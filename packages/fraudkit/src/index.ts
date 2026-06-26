import {
  type AuthorizeRequest,
  compareMoney,
  type Money,
  type OrvaconPlugin,
} from "@orvacon/paykit";

/** Rules for {@link fraudkit}. All optional; the first one that matches vetoes the charge. */
export interface FraudkitRules {
  /** Reject any authorize whose amount exceeds this (same currency only). */
  maxAmount?: Money;
  /** Reject when the billing address country is in this list (ISO 3166 codes). */
  blockCountries?: string[];
  /** A custom check: return a reason string to reject, or `null`/`undefined` to allow. */
  rule?: (request: AuthorizeRequest) => string | null | undefined;
}

/**
 * An orvacon plugin that vetoes risky authorizes before the gateway. Each rule is
 * checked in `beforeAuthorize`; the first match rejects the charge with
 * `declined` and its reason, and no payment is created.
 *
 * ```ts
 * orvacon({ plugins: [fraudkit({ maxAmount: money(50_000, "TRY"), blockCountries: ["NK"] })] });
 * ```
 */
export function fraudkit(rules: FraudkitRules): OrvaconPlugin {
  return {
    name: "fraudkit",
    beforeAuthorize: (_ctx, request) => {
      const reason = assess(request, rules);
      return reason ? { reject: { code: "declined", message: reason } } : request;
    },
  };
}

/** The reason this request should be vetoed, or `null` to allow it. */
function assess(request: AuthorizeRequest, rules: FraudkitRules): string | null {
  if (
    rules.maxAmount &&
    rules.maxAmount.currency === request.amount.currency &&
    compareMoney(request.amount, rules.maxAmount) > 0
  ) {
    return "amount over the fraud ceiling";
  }
  const country = request.billingAddress?.country;
  if (country && rules.blockCountries?.includes(country)) {
    return `payments from ${country} are blocked`;
  }
  return rules.rule?.(request) ?? null;
}
