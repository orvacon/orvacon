import type { Money } from "@orvacon/paykit";

/** A source of FX rates: how many `to` units equal one `from` unit (major units). */
export interface FxRates {
  rate: (from: string, to: string) => number | Promise<number>;
}

/** Options for {@link fxkit}. */
export interface FxkitOptions {
  /** Where the rates come from — your provider, a cache, a fixed table. */
  rates: FxRates;
  /** BCP-47 locale for formatting, e.g. `"tr-TR"`. Defaults to the runtime's. */
  locale?: string;
}

/** What {@link fxkit} returns. */
export interface Fx {
  /**
   * Format `amount` as it would read in `target` currency — **for display only**.
   * The number of decimals follows both currencies' real scale via `Intl`.
   */
  display: (amount: Money, target: string) => Promise<string>;
}

/**
 * Show a price in the shopper's currency while you still charge in the merchant's.
 * fxkit **never** moves custody — it only formats, so it cannot change what is
 * authorized.
 *
 * ```ts
 * const fx = fxkit({ rates: { rate: () => 0.0277 } }); // TRY → EUR
 * await fx.display(money(2999, "TRY"), "EUR"); // "≈ €0.83" — you still charge 29.99 TRY
 * ```
 */
export function fxkit(options: FxkitOptions): Fx {
  return {
    display: async (amount, target) => {
      const r = await options.rates.rate(amount.currency, target);
      const base = amount.amount / minorScale(amount.currency, options.locale);
      const formatted = new Intl.NumberFormat(options.locale, {
        style: "currency",
        currency: target,
      }).format(base * r);
      return `≈ ${formatted}`;
    },
  };
}

/** The minor-unit divisor for a currency (100 for TRY/EUR, 1 for JPY), via `Intl`. */
function minorScale(currency: string, locale?: string): number {
  const decimals =
    new Intl.NumberFormat(locale, { style: "currency", currency }).resolvedOptions()
      .maximumFractionDigits ?? 2;
  return 10 ** decimals;
}
