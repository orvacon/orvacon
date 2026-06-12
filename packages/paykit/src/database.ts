import type { IdempotencyKey, PaymentId } from "./ids";
import type { Money } from "./money";
import type { Payment, PaymentStatus } from "./state";

/**
 * A stored idempotency claim (one row in `idempotency_keys`).
 */
export type IdempotencyRecord = {
  readonly key: IdempotencyKey;
  /** The payment the key is bound to, once known. */
  readonly paymentId?: PaymentId;
  /**
   * `in_progress` from the moment the key is claimed until the operation's
   * outcome is stored; `completed` after. A replayed `completed` key returns
   * {@link IdempotencyRecord.result} verbatim — never a fresh charge.
   */
  readonly status: "in_progress" | "completed";
  /** Stored outcome, replayed to the caller on a duplicate key. */
  readonly result?: unknown;
  /** ISO 8601. */
  readonly createdAt: string;
  /** ISO 8601 — after this instant the key may be purged and safely reused. */
  readonly expiresAt: string;
};

/** Outcome of an atomic idempotency claim. */
export type IdempotencyClaim =
  | { inserted: true }
  | { inserted: false; existing: IdempotencyRecord };

/** Which side of a double-entry pair a ledger row records. */
export type LedgerDirection = "debit" | "credit";

/**
 * One leg of a double-entry ledger record. The core always writes balanced
 * sets (debits equal credits per movement) and computes the hash chain; the
 * adapter persists rows verbatim and never recomputes or mutates them.
 *
 * @remarks Skeleton — account naming and the chain's exact preimage are
 * finalized with the ledger implementation.
 */
export type LedgerEntry = {
  readonly paymentId: PaymentId;
  readonly direction: LedgerDirection;
  /** Logical account this leg moves, e.g. `"merchant_receivable"`. */
  readonly account: string;
  readonly amount: Money;
  /** ISO 8601. */
  readonly occurredAt: string;
  /** Hash of the previous chain entry (hex); genesis entries use a fixed sentinel. */
  readonly prevHash: string;
  /** Hash over this entry + `prevHash` (hex) — makes the ledger tamper-evident. */
  readonly hash: string;
};

/**
 * Adapter methods available inside {@link DatabaseAdapter.transaction}. The
 * `Omit` removes `transaction` itself, so nested transactions are a compile
 * error rather than implementation-defined behavior.
 */
export type TransactionScope = Omit<DatabaseAdapter, "transaction">;

/**
 * What `@orvacon/paykit` requires from the dev's database, implemented by the
 * `@orvacon/adapter-*` packages (bring-your-own-database). The core is the only
 * caller — application code never touches the adapter directly.
 *
 * Error model: these methods return domain values (`null` for not-found) and
 * **throw only for infrastructure failures** (lost connection, constraint the
 * contract does not anticipate). Expected domain outcomes are encoded in the
 * return types, never as exceptions.
 *
 * @remarks Skeleton/contract v1 — will widen with event storage and webhook
 * key methods.
 */
export interface DatabaseAdapter {
  readonly id: string;

  /** Persist a freshly constructed payment (status `created`). Returns the stored record. */
  createPayment(payment: Payment): Promise<Payment>;

  /** Fetch a payment by id; `null` when it does not exist. */
  getPayment(id: PaymentId): Promise<Payment | null>;

  /**
   * Atomic compare-and-swap state transition: persist `to` (and the patch)
   * only if the current status still equals `from` — `UPDATE … WHERE id = ?
   * AND status = ?`. Returns the updated payment, or `null` when the row was
   * not in `from` (a concurrent transition won the race; the core re-reads and
   * re-decides). The core validates the transition with `assertTransition`
   * before calling; the `WHERE` clause is what makes it hold under concurrency.
   */
  updatePaymentStatus(
    id: PaymentId,
    from: PaymentStatus,
    to: PaymentStatus,
    patch?: Partial<Pick<Payment, "gatewayReference" | "refundedTotal">>,
  ): Promise<Payment | null>;

  /**
   * Atomically claim an idempotency key: `INSERT … ON CONFLICT DO NOTHING`,
   * and on conflict return the existing record. The unique constraint — not
   * application logic — resolves the race; two concurrent calls with the same
   * key must yield exactly one `{ inserted: true }`.
   */
  insertIdempotencyKey(record: IdempotencyRecord): Promise<IdempotencyClaim>;

  /** Fetch an idempotency record; `null` when absent or already purged. */
  getIdempotencyKey(key: IdempotencyKey): Promise<IdempotencyRecord | null>;

  /**
   * Mark a claimed key `completed` and store the outcome that future replays
   * of the same key will return.
   */
  completeIdempotencyKey(key: IdempotencyKey, paymentId: PaymentId, result: unknown): Promise<void>;

  /**
   * Append ledger rows. Append-only: the adapter must never update or delete
   * a ledger row. Must be called inside the same {@link transaction} as the
   * state change it records — a state transition and its ledger writes either
   * both persist or neither does.
   */
  appendLedger(entries: readonly LedgerEntry[]): Promise<void>;

  /**
   * Run `fn` inside one database transaction: every call on the provided
   * {@link TransactionScope} is atomic with the others — commit when `fn`
   * resolves, roll back when it throws.
   */
  transaction<T>(fn: (tx: TransactionScope) => Promise<T>): Promise<T>;
}
