import type { Money, NormalizedEvent, NormalizedEventType, PaymentId } from "@orvacon/paykit";

/** Whether an event type carries a moved `amount` (vs `failed` / `voided`). */
export function movesValue(
  type: NormalizedEventType,
): type is "payment.authorized" | "payment.captured" | "payment.refunded" {
  return (
    type === "payment.authorized" || type === "payment.captured" || type === "payment.refunded"
  );
}

/**
 * Assemble a `NormalizedEvent`, enforcing the value-moving discriminant: the
 * three money events require an `amount`, `failed` / `voided` carry none. Shared
 * by the webhook ({@link mockCallback}) and reconcile ({@link mockReconcile})
 * paths so both produce the exact shape the core applies.
 */
export function buildNormalizedEvent(
  paymentId: PaymentId,
  gatewayReference: string,
  occurredAt: string,
  type: NormalizedEventType,
  amount?: Money,
  raw: unknown = {},
): NormalizedEvent {
  const base = { paymentId, gatewayReference, occurredAt, raw };
  if (movesValue(type)) {
    if (!amount) {
      throw new TypeError(`Mock event "${type}" requires an amount.`);
    }
    return { ...base, type, amount };
  }
  return { ...base, type };
}
