import type { Card, CardToken } from "@orvacon/paykit";

/**
 * Magic test cards. The {@link mockConnector} reads the number to decide the
 * outcome, the way a gateway's sandbox publishes fixed numbers — so a test picks
 * the path it wants by choosing the card. (3-D Secure is orthogonal: request it
 * with `threeDSecure: true` on any non-declined card.)
 */
export const testCards = {
  /** Authorizes cleanly. */
  success: {
    number: "4111111111111111",
    expiryMonth: "12",
    expiryYear: "2030",
    cvc: "123",
    holderName: "Mock Success",
  },
  /** The gateway declines it — `{ ok: false, error: { code: "declined" } }`. Final, never retried. */
  declined: {
    number: "4000000000000002",
    expiryMonth: "12",
    expiryYear: "2030",
    cvc: "123",
    holderName: "Mock Declined",
  },
  /** A transient gateway failure — `{ ok: false, error: { code: "gateway_error" } }`, the one auto-retry class. */
  gatewayError: {
    number: "4000000000000119",
    expiryMonth: "12",
    expiryYear: "2030",
    cvc: "123",
    holderName: "Mock Gateway Error",
  },
} satisfies Record<string, Card>;

/** A vaulted-card token for the `token` payment source — always authorizes. */
export const testToken: CardToken = { token: "mock_tok_visa", userKey: "mock_user_key" };

/** What the mock produces for a given card. */
export type MockOutcome = "success" | "declined" | "gateway_error";

const OUTCOME_BY_NUMBER: Record<string, MockOutcome> = {
  [testCards.success.number]: "success",
  [testCards.declined.number]: "declined",
  [testCards.gatewayError.number]: "gateway_error",
};

/** The outcome for a card number; an unrecognized number authorizes. */
export function outcomeForNumber(cardNumber: string): MockOutcome {
  return OUTCOME_BY_NUMBER[cardNumber] ?? "success";
}
