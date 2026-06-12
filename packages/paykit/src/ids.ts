import type { Brand } from "./brand";

/**
 * orvacon's own payment identifier — the same value that rides the gateway as
 * `conversationId` / `merchant_oid`.
 *
 * Validation is deliberately minimal (non-empty) for now: the id *format*
 * (ULID vs UUID, prefixing) is decided with the orchestration body and will
 * tighten inside {@link paymentId} without touching any call site.
 */
export type PaymentId = Brand<string, "PaymentId">;

/**
 * Validate and brand a payment id.
 *
 * @throws TypeError if the id is empty.
 */
export function paymentId(value: string): PaymentId {
  if (value.length === 0) {
    throw new TypeError("Payment id must be a non-empty string");
  }
  return value as PaymentId;
}
