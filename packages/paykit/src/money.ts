/** Attach a compile-time brand `B` to a primitive `T`. */
type Brand<T, B extends string> = T & { readonly __brand: B };

/**
 * Integer minor units (e.g. kuruş, cents), always non-negative. Branded so a
 * bare `number` cannot be passed where money is expected, and so arithmetic
 * results stay typed only when routed through the helpers below.
 */
export type MinorUnits = Brand<number, "MinorUnits">;

/** ISO 4217 currency code, uppercased (e.g. `"TRY"`, `"USD"`). Branded. */
export type Currency = Brand<string, "Currency">;

/**
 * A monetary amount as integer minor units plus a currency. Money is never a
 * float in the core; floats may only appear at a connector's gateway boundary,
 * never here.
 *
 * Amounts are always non-negative. A refund is a positive amount whose direction
 * (debit/credit) is carried by the ledger, not by the sign of the number.
 */
export type Money = {
  readonly amount: MinorUnits;
  readonly currency: Currency;
};

/**
 * Construct a {@link Money} value. Fails fast — a non-integer, negative, or
 * malformed input is a programming error, not a runtime state.
 *
 * Zero is allowed (some flows authorize a zero amount to validate or store a
 * card); rejecting a zero *payment* is the job of `authorize`, not of this type.
 *
 * @throws TypeError if `amount` is not a non-negative safe integer, or
 * `currency` is not a three-letter code.
 */
export function money(amount: number, currency: string): Money {
  if (!Number.isSafeInteger(amount)) {
    throw new TypeError(`Money amount must be an integer in minor units, got ${amount}`);
  }
  if (amount < 0) {
    throw new TypeError(`Money amount must be non-negative, got ${amount}`);
  }
  if (!/^[A-Za-z]{3}$/.test(currency)) {
    throw new TypeError(`Money currency must be a 3-letter ISO 4217 code, got "${currency}"`);
  }
  return { amount: amount as MinorUnits, currency: currency.toUpperCase() as Currency };
}

/** True when both amounts share the same currency. */
export function sameCurrency(a: Money, b: Money): boolean {
  return a.currency === b.currency;
}

/**
 * Add two amounts of the same currency. Routes through {@link money} so the
 * brand is preserved.
 *
 * @throws TypeError on a currency mismatch.
 */
export function addMoney(a: Money, b: Money): Money {
  if (!sameCurrency(a, b)) {
    throw new TypeError(`Cannot add ${b.currency} to ${a.currency}`);
  }
  return money(a.amount + b.amount, a.currency);
}

/**
 * Subtract `b` from `a` (same currency). Because {@link money} rejects negative
 * results, an over-subtraction (e.g. refunding more than was captured) throws
 * rather than producing a negative amount.
 *
 * @throws TypeError on a currency mismatch or a negative result.
 */
export function subtractMoney(a: Money, b: Money): Money {
  if (!sameCurrency(a, b)) {
    throw new TypeError(`Cannot subtract ${b.currency} from ${a.currency}`);
  }
  return money(a.amount - b.amount, a.currency);
}

/**
 * Currency-safe comparison: `-1` if `a < b`, `0` if equal, `1` if `a > b`.
 *
 * @throws TypeError on a currency mismatch.
 */
export function compareMoney(a: Money, b: Money): -1 | 0 | 1 {
  if (!sameCurrency(a, b)) {
    throw new TypeError(`Cannot compare ${a.currency} with ${b.currency}`);
  }
  if (a.amount < b.amount) {
    return -1;
  }
  if (a.amount > b.amount) {
    return 1;
  }
  return 0;
}

/** True when the amount is zero. */
export function isZeroMoney(m: Money): boolean {
  return m.amount === 0;
}
