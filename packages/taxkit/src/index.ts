import { addMoney, type Money, money, type OrvaconPlugin } from "@orvacon/paykit";

/** Options for {@link taxkit}. */
export interface TaxkitOptions {
  /**
   * Tax rate as a fraction of the amount — `0.20` for 20%, `0.18` for Turkey's
   * standard KDV. Must be a non-negative finite number.
   */
  rate: number;
}

/**
 * An orvacon plugin that adds tax on top of every authorized amount before the
 * gateway sees it. Tax-**exclusive**: the request's `amount` is the pre-tax base,
 * and `rate × amount` (rounded to whole minor units) is added.
 *
 * ```ts
 * orvacon({ plugins: [taxkit({ rate: 0.2 })] });
 * ```
 *
 * @throws TypeError if `rate` is not a non-negative finite number — fail-fast at
 * setup, not at the first payment.
 */
export function taxkit(options: TaxkitOptions): OrvaconPlugin {
  if (!Number.isFinite(options.rate) || options.rate < 0) {
    throw new TypeError(`taxkit: rate must be a non-negative number, got ${options.rate}`);
  }
  return {
    name: "taxkit",
    beforeAuthorize: (_ctx, request) => ({
      ...request,
      amount: addMoney(request.amount, taxOn(request.amount, options.rate)),
    }),
  };
}

/** The tax due on a base amount, rounded to whole minor units. */
function taxOn(base: Money, rate: number): Money {
  return money(Math.round(base.amount * rate), base.currency);
}
