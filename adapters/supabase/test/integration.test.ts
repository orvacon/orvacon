import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { generatePaymentId, idempotencyKey, money } from "@orvacon/paykit";
import postgres, { type TransactionSql } from "postgres";
import { supabaseAdapter, supabaseSchema } from "../src/index";

const DATABASE_URL = process.env.DATABASE_URL;

/**
 * Gated on a real Postgres (local/Docker or a Supabase project). This is the
 * adapter's verification *threshold* — the equivalent of the connector's sandbox
 * smoke-test. Until it runs green, the adapter is type-correct but
 * behavior-unproven (advisory-lock serialization, CAS, `ON CONFLICT` dedup, and
 * — the security claim — that the generated RLS actually *denies*).
 * Run with `DATABASE_URL=postgres://… bun test`.
 */
const suite = DATABASE_URL ? describe : describe.skip;

suite("supabaseAdapter (integration — requires DATABASE_URL)", () => {
  const sql = postgres(DATABASE_URL ?? "", { prepare: false });
  const db = supabaseAdapter({ sql });

  beforeAll(async () => {
    await sql`drop table if exists ledger, idempotency_keys, payments`;
    // Stand up the Supabase environment the generated RLS assumes, *faithfully* —
    // a wrong emulation gives false confidence:
    //  - auth.uid() reads the JWT `sub` from the request.jwt.claims GUC, as Supabase's does;
    //  - anon / authenticated have no BYPASSRLS, service_role does;
    //  - Supabase grants new tables *and sequences* to all three roles by default,
    //    so RLS — not a missing grant — is the gate. `alter default privileges` set
    //    *before* the tables are created makes them inherit those grants, then the
    //    migration's own `revoke` trims update/delete on the ledger. (Sequences
    //    matter: the ledger's bigserial needs nextval, or the server can't append.)
    await sql
      .unsafe(`
        create schema if not exists auth;
        create or replace function auth.uid() returns uuid language sql stable as $$
          select (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')::uuid
        $$;
        do $$ begin
          if not exists (select from pg_roles where rolname = 'anon') then create role anon; end if;
          if not exists (select from pg_roles where rolname = 'authenticated') then create role authenticated; end if;
          if not exists (select from pg_roles where rolname = 'service_role') then create role service_role bypassrls; end if;
        end $$;
        grant usage on schema public to anon, authenticated, service_role;
        alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
        alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
      `)
      .simple();
    // Apply the *generated* migration — the exact SQL the CLI will write. The
    // runtime tests below run as the superuser connection, which bypasses RLS, as
    // a BYPASSRLS service_role would in production.
    await sql.unsafe(supabaseSchema()).simple();
  });

  afterAll(async () => {
    await sql.end();
  });

  test("createPayment then getPayment round-trips the money and owner", async () => {
    const id = generatePaymentId();
    const now = new Date().toISOString();
    await db.createPayment({
      id,
      status: "created",
      amount: money(10_000, "TRY"),
      connectorId: "iyzico",
      userId: "u1",
      createdAt: now,
      updatedAt: now,
    });
    const stored = await db.getPayment(id);
    expect(stored?.amount).toEqual(money(10_000, "TRY"));
    expect(stored?.userId).toBe("u1");
  });

  test("updatePaymentStatus compare-and-swap rejects a stale from-status", async () => {
    const id = generatePaymentId();
    const now = new Date().toISOString();
    await db.createPayment({
      id,
      status: "created",
      amount: money(1_000, "TRY"),
      connectorId: "iyzico",
      createdAt: now,
      updatedAt: now,
    });
    expect(await db.updatePaymentStatus(id, "created", "captured")).not.toBeNull();
    expect(await db.updatePaymentStatus(id, "created", "captured")).toBeNull();
  });

  test("idempotency claim dedupes on conflict", async () => {
    const now = new Date().toISOString();
    const record = {
      key: idempotencyKey("k-int"),
      status: "in_progress" as const,
      createdAt: now,
      expiresAt: now,
    };
    expect((await db.insertIdempotencyKey(record)).inserted).toBe(true);
    expect((await db.insertIdempotencyKey(record)).inserted).toBe(false);
  });

  test("the ledger's unique(prev_hash) refuses a forked chain", async () => {
    const append = (prev: string, hash: string) =>
      sql`insert into ledger (payment_id, direction, account, amount_minor, currency, occurred_at, prev_hash, hash)
          values ('p_fork', 'debit', 'gateway', 1, 'TRY', now(), ${prev}, ${hash})`;
    await append("genesis", "hash_a");
    // A second link off the same prev_hash is a fork; the constraint rejects it
    // even if the advisory lock were somehow bypassed.
    let forkRejected = false;
    try {
      await append("genesis", "hash_b");
    } catch {
      forkRejected = true;
    }
    expect(forkRejected).toBe(true);
  });

  /**
   * The security claim itself: the generated RLS doesn't just *apply*, it *denies*.
   * Each test switches to a real Supabase role (set local role, inside a txn) and
   * proves one of the adapter's four guarantees. Negative tests assert the denial's
   * *reason* (the error message): an RLS refusal must read "row-level security",
   * a privilege refusal "permission denied" — anything else is a false green that
   * would leave a hole open against a real project.
   */
  describe("RLS deny semantics (real roles, faithful grants)", () => {
    const ALICE = "11111111-1111-1111-1111-111111111111";
    const BOB = "22222222-2222-2222-2222-222222222222";

    // Run `fn` as `role` within a transaction, optionally carrying a JWT `sub` so
    // auth.uid() resolves. `set local` / a local set_config revert at txn end.
    const asRole = <T>(
      role: string,
      sub: string | null,
      fn: (tx: TransactionSql) => Promise<T>,
    ): Promise<T> =>
      sql.begin(async (tx) => {
        await tx.unsafe(`set local role ${role}`);
        if (sub) {
          await tx`select set_config('request.jwt.claims', ${JSON.stringify({ sub })}, true)`;
        }
        return fn(tx);
      }) as Promise<T>;

    const reason = (error: unknown): string => String((error as Error)?.message ?? "");

    beforeAll(async () => {
      // Clean tables for these tests; the faithful env (roles, auth.uid, default
      // privileges) from the suite's beforeAll persists across the table drop.
      await sql`drop table if exists ledger, idempotency_keys, payments`;
      await sql.unsafe(supabaseSchema()).simple();
    });

    test("claim 1: authenticated cannot INSERT a payment — and the refusal is RLS, not a missing grant", async () => {
      let error: unknown;
      try {
        await asRole(
          "authenticated",
          ALICE,
          (tx) =>
            tx`insert into payments (id, status, amount_minor, currency, connector_id, user_id, created_at, updated_at)
               values ('p_evil', 'captured', 1, 'TRY', 'iyzico', ${ALICE}, now(), now())`,
        );
      } catch (e) {
        error = e;
      }
      // The whole point: a client cannot forge a captured payment. "permission
      // denied" here would mean the grant was missing — a false green hiding a
      // real hole. The denial must come from the policy.
      expect(reason(error)).toContain("row-level security");
    });

    test("claim 2: authenticated reads only its own payment", async () => {
      const now = new Date().toISOString();
      await db.createPayment({
        id: generatePaymentId(),
        status: "created",
        amount: money(1, "TRY"),
        connectorId: "iyzico",
        userId: ALICE,
        createdAt: now,
        updatedAt: now,
      });
      await db.createPayment({
        id: generatePaymentId(),
        status: "created",
        amount: money(1, "TRY"),
        connectorId: "iyzico",
        userId: BOB,
        createdAt: now,
        updatedAt: now,
      });
      const visible = await asRole(
        "authenticated",
        ALICE,
        (tx) => tx`select user_id from payments`,
      );
      expect(visible.length).toBeGreaterThan(0);
      expect(visible.every((r) => r.user_id === ALICE)).toBe(true);
    });

    test("claim 3: service_role cannot UPDATE the ledger — the append-only revoke holds", async () => {
      await sql`insert into ledger (payment_id, direction, account, amount_minor, currency, occurred_at, prev_hash, hash)
                values ('p_led', 'debit', 'gateway', 10, 'TRY', now(), 'rls_genesis', 'rls_h_led')`;
      let error: unknown;
      try {
        await asRole(
          "service_role",
          null,
          (tx) => tx`update ledger set amount_minor = 999 where hash = 'rls_h_led'`,
        );
      } catch (e) {
        error = e;
      }
      // The revoke is privilege-level (service_role bypasses RLS), so the correct
      // reason here is "permission denied", not an RLS message.
      expect(reason(error)).toContain("permission denied");
    });

    test("claim 4: service_role CAN write a payment and append the ledger — RLS must not block the server", async () => {
      const id = generatePaymentId();
      await asRole("service_role", null, async (tx) => {
        await tx`insert into payments (id, status, amount_minor, currency, connector_id, created_at, updated_at)
                 values (${id}, 'created', 1, 'TRY', 'iyzico', now(), now())`;
        await tx`update payments set status = 'captured' where id = ${id}`;
        await tx`insert into ledger (payment_id, direction, account, amount_minor, currency, occurred_at, prev_hash, hash)
                 values (${id}, 'debit', 'gateway', 1, 'TRY', now(), 'c4_genesis', 'c4_hash')`;
      });
      const [payment] = await sql`select status from payments where id = ${id}`;
      const [entry] = await sql`select hash from ledger where hash = 'c4_hash'`;
      expect(payment?.status).toBe("captured");
      expect(entry?.hash).toBe("c4_hash");
    });
  });
});
