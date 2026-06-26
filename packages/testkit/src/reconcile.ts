import type { Money, NormalizedEventType, PaymentId, ReconcileOutcome } from "@orvacon/paykit";
import { buildNormalizedEvent } from "./event";

/** Input to {@link mockReconcile}. */
export interface MockReconcileInput {
  /** The payment the gateway settled — usually `input.paymentId` from the resolver. */
  paymentId: PaymentId;
  /** The event the gateway reports. Default `"payment.captured"`. */
  type?: NormalizedEventType;
  /** The amount moved — required for `payment.authorized` / `captured` / `refunded`. */
  amount?: Money;
  /** The gateway reference; defaults to the mock's `mock_<paymentId>`. */
  gatewayReference?: string;
  /** ISO 8601 timestamp; defaults to now. */
  occurredAt?: string;
}

/**
 * Build a **resolved** `ReconcileOutcome` — the gateway had already settled, so
 * `orva.reconcile()` advances the payment. Use it in {@link mockConnector}'s
 * `reconcile` option to drive the settled-but-unreflected path:
 *
 * ```ts
 * mockConnector({
 *   reconcile: (input) => mockReconcile({ paymentId: input.paymentId, amount: money(2500, "TRY") }),
 * });
 * ```
 *
 * Leave the option unset for the default (`resolved: false` — still pending, a
 * no-op, the correct outcome for an abandoned payment).
 */
export function mockReconcile(
  input: MockReconcileInput,
): Extract<ReconcileOutcome, { resolved: true }> {
  return {
    ok: true,
    resolved: true,
    event: buildNormalizedEvent(
      input.paymentId,
      input.gatewayReference ?? `mock_${input.paymentId}`,
      input.occurredAt ?? new Date().toISOString(),
      input.type ?? "payment.captured",
      input.amount,
    ),
  };
}

/** The default `retrievePayment` outcome: still pending, so reconcile is a no-op. */
export function reconcilePending(): Extract<ReconcileOutcome, { resolved: false }> {
  return { ok: true, resolved: false };
}
