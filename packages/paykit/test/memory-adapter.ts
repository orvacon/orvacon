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
} from "../src/index";

/**
 * In-memory DatabaseAdapter for tests. Compare-and-swap and atomic-claim
 * semantics are implemented faithfully (single-threaded, so map operations are
 * atomic); `transaction` runs the callback against the same store without
 * rollback — sufficient for happy-path and race-shape tests, not a real
 * adapter.
 */
export function memoryAdapter(): DatabaseAdapter & {
  payments: Map<string, Payment>;
  ledger: LedgerEntry[];
  idempotency: Map<string, IdempotencyRecord>;
} {
  const payments = new Map<string, Payment>();
  const ledger: LedgerEntry[] = [];
  const idempotency = new Map<string, IdempotencyRecord>();

  const scope = {
    id: "memory",
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
