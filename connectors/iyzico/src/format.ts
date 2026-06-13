import type { Money } from "@orvacon/paykit";

/**
 * Map integer minor units to Iyzico's decimal price string (e.g. 1050 → `"10.5"`).
 * Shared by every Iyzico call that sends a price (authorize, refund).
 *
 * @remarks **Unverified** — Iyzico's exact trailing-zero rule for `price` /
 * `paidPrice` (and the response-signature preimage) is not yet confirmed against
 * the sandbox, and this assumes 2-decimal currencies (TRY/USD/EUR). Revisit for
 * zero/three-decimal currencies and the precise trailing-zero format.
 */
export function formatPrice(amount: Money): string {
  const factor = 100;
  const whole = Math.floor(amount.amount / factor);
  const fraction = amount.amount % factor;
  if (fraction === 0) {
    return `${whole}.0`;
  }
  const trimmed = String(fraction).padStart(2, "0").replace(/0+$/, "");
  return `${whole}.${trimmed}`;
}
