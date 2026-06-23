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

/** A {@link mockDatabase} with its stores exposed so a test can assert on them. */
export interface MockDatabase extends DatabaseAdapter {
  /** Every payment, by id. */
  readonly payments: Map<string, Payment>;
  /** The append-only ledger, in chain order. */
  readonly ledger: LedgerEntry[];
  /** Idempotency claims, by key. */
  readonly idempotency: Map<string, IdempotencyRecord>;
}

/**
 * An in-memory `DatabaseAdapter` for tests — no Postgres, no migration, no RLS.
 * Pass it to `orvacon({ database: mockDatabase() })` and drive real flows; the
 * `payments` and `ledger` stores are exposed so a test can read the persisted
 * result directly.
 *
 * Compare-and-swap transitions, atomic idempotency claims, and the append-only
 * ledger are implemented faithfully — single-threaded, so each map operation is
 * atomic. `transaction` runs its callback against the same store with no
 * rollback: right for unit tests, not a production adapter.
 */
export function mockDatabase(): MockDatabase {
  const payments = new Map<string, Payment>();
  const ledger: LedgerEntry[] = [];
  const idempotency = new Map<string, IdempotencyRecord>();

  const scope = {
    id: "mock",
    async createPayment(payment: Payment): Promise<Payment> {
      payments.set(payment.id, payment);
      return payment;
    },
    async getPayment(id: PaymentId): Promise<Payment | null> {
      return payments.get(id) ?? null;
    },
    async updatePaymentStatus(
      id: PaymentId,
      from: PaymentStatus,
      to: PaymentStatus,
      patch?: Partial<Pick<Payment, "gatewayReference" | "refundedTotal">>,
    ): Promise<Payment | null> {
      const current = payments.get(id);
      if (!current || current.status !== from) {
        return null;
      }
      const updated = {
        ...current,
        ...patch,
        status: to,
        updatedAt: new Date().toISOString(),
      } satisfies Payment;
      payments.set(id, updated);
      return updated;
    },
    async insertIdempotencyKey(record: IdempotencyRecord): Promise<IdempotencyClaim> {
      const existing = idempotency.get(record.key);
      if (existing) {
        return { inserted: false, existing };
      }
      idempotency.set(record.key, record);
      return { inserted: true };
    },
    async getIdempotencyKey(key: IdempotencyKey): Promise<IdempotencyRecord | null> {
      return idempotency.get(key) ?? null;
    },
    async reclaimIdempotencyKey(key: IdempotencyKey, expiresAt: string): Promise<boolean> {
      const existing = idempotency.get(key);
      if (existing?.status !== "in_progress" || Date.parse(existing.expiresAt) > Date.now()) {
        return false;
      }
      idempotency.set(key, { ...existing, createdAt: new Date().toISOString(), expiresAt });
      return true;
    },
    async completeIdempotencyKey(
      key: IdempotencyKey,
      paymentId: PaymentId,
      result: unknown,
    ): Promise<void> {
      const existing = idempotency.get(key);
      if (existing) {
        idempotency.set(key, { ...existing, status: "completed", paymentId, result });
      }
    },
    async getLedgerHead(): Promise<LedgerEntry | null> {
      return ledger[ledger.length - 1] ?? null;
    },
    async appendLedger(entries: readonly LedgerEntry[]): Promise<void> {
      ledger.push(...entries);
    },
  } satisfies TransactionScope;

  return {
    ...scope,
    async transaction<T>(fn: (tx: TransactionScope) => Promise<T>): Promise<T> {
      return fn(scope);
    },
    payments,
    ledger,
    idempotency,
  };
}
