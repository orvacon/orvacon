import type {
  DatabaseAdapter,
  IdempotencyClaim,
  IdempotencyKey,
  IdempotencyRecord,
  LedgerEntry,
  Payment,
  PaymentId,
  PaymentStatus,
  TransactionScope,
} from "@orvacon/paykit";
import { money } from "@orvacon/paykit";
import type { Row, Sql, TransactionSql } from "postgres";

export { supabaseSchema } from "./schema";

/**
 * Options for {@link supabaseAdapter}.
 *
 * `sql` is a [postgres.js](https://github.com/porsager/postgres) client over a
 * **direct** Postgres connection — not `@supabase/supabase-js`. The server side
 * needs real transactions and advisory locks, which PostgREST (and therefore
 * supabase-js) cannot give; supabase-js is the **dev's client-side** tool for
 * RLS-scoped reads, a separate path. This adapter connects as a `BYPASSRLS` role
 * and writes freely; the row-level security it generates protects that other,
 * client path.
 *
 * **Serverless connection setup (load-bearing).** Point `sql` at Supabase's
 * **transaction-mode connection pooler** (port 6543), not the direct 5432, and
 * disable prepared statements — transaction-mode pooling shares connections, so
 * named prepared statements break:
 *
 * ```ts
 * import postgres from "postgres";
 * const sql = postgres(process.env.SUPABASE_DB_URL, { prepare: false });
 * const db = supabaseAdapter({ sql });
 * ```
 *
 * Getting this wrong fails in production with "too many connections", not in dev.
 */
export type SupabaseAdapterOptions = {
  sql: Sql;
};

/**
 * The Supabase database adapter (runtime half). Implements
 * {@link DatabaseAdapter} over a direct Postgres connection: compare-and-swap
 * state transitions, `INSERT … ON CONFLICT` idempotency claims, and the
 * append-only hash-chained ledger, all inside real transactions.
 *
 * @remarks **Unverified — needs an integration run.** The SQL is type-correct
 * but its *behavior* (advisory-lock serialization, CAS under concurrency,
 * `ON CONFLICT` dedup) is only proven against a real Postgres. Run the
 * `DATABASE_URL`-gated integration tests against a local/Docker Postgres before
 * relying on it — the adapter's equivalent of the connector's sandbox smoke-test.
 *
 * @remarks **Scale (deliberate v1 debt).** The ledger is one global hash chain,
 * so the advisory lock serializes *every* append across all payments — correct
 * and fine at v1 volume, but a throughput ceiling under load. Per-tenant chains
 * (a separate chain + lock per tenant) lift it when that ceiling is reached;
 * deferred until throughput demands.
 */
export function supabaseAdapter(options: SupabaseAdapterOptions): DatabaseAdapter {
  const { sql } = options;
  const scope = makeScope(sql);
  return {
    ...scope,
    transaction<T>(fn: (tx: TransactionScope) => Promise<T>): Promise<T> {
      return sql.begin((tx) => fn(makeScope(tx))) as Promise<T>;
    },
  };
}

function makeScope(sql: Sql | TransactionSql): TransactionScope {
  return {
    id: "supabase",

    async createPayment(payment: Payment): Promise<Payment> {
      const [row] = await sql`
        insert into payments
          (id, status, amount_minor, currency, refunded_total_minor, connector_id, user_id, gateway_reference, created_at, updated_at)
        values (
          ${payment.id}, ${payment.status}, ${payment.amount.amount}, ${payment.amount.currency},
          ${payment.refundedTotal?.amount ?? null}, ${payment.connectorId}, ${payment.userId ?? null},
          ${payment.gatewayReference ?? null}, ${payment.createdAt}, ${payment.updatedAt}
        )
        returning *`;
      return toPayment(requireRow(row));
    },

    async getPayment(id: PaymentId): Promise<Payment | null> {
      const [row] = await sql`select * from payments where id = ${id}`;
      return row ? toPayment(row) : null;
    },

    async updatePaymentStatus(id, from, to, patch): Promise<Payment | null> {
      const set: Record<string, unknown> = { status: to };
      if (patch?.gatewayReference !== undefined) {
        set.gateway_reference = patch.gatewayReference;
      }
      if (patch?.refundedTotal !== undefined) {
        set.refunded_total_minor = patch.refundedTotal.amount;
      }
      // Compare-and-swap: only writes when the row is still in `from`.
      const [row] = await sql`
        update payments set ${sql(set)}, updated_at = now()
        where id = ${id} and status = ${from}
        returning *`;
      return row ? toPayment(row) : null;
    },

    async insertIdempotencyKey(record: IdempotencyRecord): Promise<IdempotencyClaim> {
      const [inserted] = await sql`
        insert into idempotency_keys (key, payment_id, status, result, created_at, expires_at)
        values (${record.key}, ${record.paymentId ?? null}, ${record.status},
                ${sql.json((record.result ?? null) as never)}, ${record.createdAt}, ${record.expiresAt})
        on conflict (key) do nothing
        returning *`;
      if (inserted) {
        return { inserted: true };
      }
      const [existing] = await sql`select * from idempotency_keys where key = ${record.key}`;
      return { inserted: false, existing: toIdempotencyRecord(requireRow(existing)) };
    },

    async getIdempotencyKey(key: IdempotencyKey): Promise<IdempotencyRecord | null> {
      const [row] = await sql`select * from idempotency_keys where key = ${key}`;
      return row ? toIdempotencyRecord(row) : null;
    },

    async reclaimIdempotencyKey(key: IdempotencyKey, expiresAt: string): Promise<boolean> {
      const rows = await sql`
        update idempotency_keys set created_at = now(), expires_at = ${expiresAt}
        where key = ${key} and status = 'in_progress' and expires_at < now()
        returning key`;
      return rows.length > 0;
    },

    async completeIdempotencyKey(key, paymentId, result): Promise<void> {
      await sql`
        update idempotency_keys
        set status = 'completed', payment_id = ${paymentId}, result = ${sql.json(result as never)}
        where key = ${key}`;
    },

    async getLedgerHead(): Promise<LedgerEntry | null> {
      // The ledger is a single global hash chain, so concurrent appends must
      // serialize onto one head. A transaction-scoped advisory lock does that —
      // and unlike `FOR UPDATE` it works on an empty table (the genesis race),
      // because there is no row to lock. Released on commit/rollback.
      await sql`select pg_advisory_xact_lock(hashtext('orva_ledger'))`;
      const [row] = await sql`select * from ledger order by seq desc limit 1`;
      return row ? toLedgerEntry(row) : null;
    },

    async appendLedger(entries: readonly LedgerEntry[]): Promise<void> {
      if (entries.length === 0) {
        return;
      }
      const rows = entries.map((e) => ({
        payment_id: e.paymentId,
        direction: e.direction,
        account: e.account,
        amount_minor: e.amount.amount,
        currency: e.amount.currency,
        occurred_at: e.occurredAt,
        prev_hash: e.prevHash,
        hash: e.hash,
      }));
      await sql`insert into ledger ${sql(rows)}`;
    },
  };
}

/**
 * The one place stored rows re-enter typed code: postgres.js returns loosely
 * typed rows, branded back here. The column shapes are the adapter's own schema
 * (generated alongside), so the casts are sound at this boundary.
 */
function toPayment(row: Row): Payment {
  const currency = String(row.currency);
  return {
    id: String(row.id) as PaymentId,
    status: String(row.status) as PaymentStatus,
    amount: money(Number(row.amount_minor), currency),
    refundedTotal:
      row.refunded_total_minor == null
        ? undefined
        : money(Number(row.refunded_total_minor), currency),
    connectorId: String(row.connector_id),
    userId: row.user_id == null ? undefined : String(row.user_id),
    gatewayReference: row.gateway_reference == null ? undefined : String(row.gateway_reference),
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at),
  };
}

function toLedgerEntry(row: Row): LedgerEntry {
  return {
    paymentId: String(row.payment_id) as PaymentId,
    direction: row.direction === "credit" ? "credit" : "debit",
    account: String(row.account),
    amount: money(Number(row.amount_minor), String(row.currency)),
    occurredAt: iso(row.occurred_at),
    prevHash: String(row.prev_hash),
    hash: String(row.hash),
  };
}

function toIdempotencyRecord(row: Row): IdempotencyRecord {
  return {
    key: String(row.key) as IdempotencyKey,
    paymentId: row.payment_id == null ? undefined : (String(row.payment_id) as PaymentId),
    status: row.status === "completed" ? "completed" : "in_progress",
    result: row.result ?? undefined,
    createdAt: iso(row.created_at),
    expiresAt: iso(row.expires_at),
  };
}

/** Timestamps come back as `Date` from a `timestamptz` column; the core wants ISO strings. */
function iso(value: unknown): string {
  return value instanceof Date ? value.toISOString() : String(value);
}

function requireRow(row: Row | undefined): Row {
  if (!row) {
    throw new Error("supabase: expected a row from a RETURNING clause");
  }
  return row;
}
