import type { RawError } from "@orvacon/paykit/connector";

/**
 * Known Iyzico error codes mapped to normalized classes, consumed through
 * `ctx.classifyError`. A deliberately *small, confident* seed (verified against
 * Iyzico's documented codes): well-known card/bank declines are `declined`, and
 * credential/signature failures are `auth_error`. Every unlisted code resolves
 * to `unknown` — never auto-retried, surfaced for reconciliation — so the table
 * is expanded as real codes appear against the sandbox, not guessed up front.
 */
export const IYZICO_ERROR_CODES: Record<string, RawError> = {
  // Card / bank declines — the bank said no; final, not our request's fault.
  "10005": { code: "declined" }, // general decline ("contact your bank")
  "10012": { code: "declined" }, // invalid transaction
  "10034": { code: "declined" }, // restricted / fraud suspected
  "10043": { code: "declined" }, // not permitted (lost/stolen)
  "10051": { code: "declined" }, // insufficient funds / limit
  "10054": { code: "declined" }, // expired card
  "10084": { code: "declined" }, // invalid CVC
  // Connector credential / signature errors — configuration, not the customer.
  "1000": { code: "auth_error" }, // invalid signature
  "1002": { code: "auth_error" }, // merchant not found
  "1003": { code: "auth_error" }, // authorization error
  "1006": { code: "auth_error" }, // API key missing
};
