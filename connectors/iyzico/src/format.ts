import { type Money, money } from "@orvacon/paykit";

/**
 * Map integer minor units to Iyzico's decimal price string (e.g. 1050 → `"10.5"`).
 * Shared by every Iyzico call that sends a price (authorize, refund).
 *
 * @remarks The trailing-zero format is sandbox-verified for 2-decimal currencies —
 * the round-trip through {@link parsePrice} recovers exact minor units. Zero- and
 * three-decimal currencies are out of v1 scope (TRY is the v1 currency).
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

/**
 * Parse Iyzico's decimal price (e.g. `"100.5"` or `100.5`) back into branded
 * {@link Money} (integer minor units) at the gateway boundary — the inverse of
 * {@link formatPrice}. Floats live only here, at the boundary; the result is a
 * validated integer-minor-units `Money` the core can trust.
 *
 * @remarks Sandbox-verified for 2-decimal currencies, matching {@link formatPrice};
 * zero/three-decimal currencies are out of v1 scope.
 */
export function parsePrice(value: string | number, currency: string): Money {
  return money(Math.round(Number(value) * 100), currency);
}
