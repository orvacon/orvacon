import type { Money } from "./money";

/**
 * Lifecycle states of a payment.
 *
 * `created → requires_action → authorized → captured → refunded`, with
 * `failed` and `voided` as terminal off-ramps.
 */
export type PaymentStatus =
  | "created"
  | "requires_action"
  | "authorized"
  | "captured"
  | "refunded"
  | "failed"
  | "voided";

/**
 * The permitted forward transitions, encoded at the type level so an illegal
 * move (e.g. `refunded → authorized`) is a compile error rather than a runtime
 * check. Terminal states map to `never`.
 */
export type AllowedTransitions = {
  created: "requires_action" | "authorized" | "captured" | "failed";
  requires_action: "authorized" | "captured" | "failed";
  authorized: "captured" | "voided" | "failed";
  captured: "refunded";
  refunded: never;
  failed: never;
  voided: never;
};

/** The states reachable in one step from `S`. */
export type NextStatus<S extends PaymentStatus> = AllowedTransitions[S];

/** A persisted payment record. The core owns this; connectors never see it. */
export type Payment = {
  readonly id: string;
  readonly status: PaymentStatus;
  readonly amount: Money;
  /** Id of the connector that owns this payment, e.g. `"iyzico"`. */
  readonly connectorId: string;
  /** The gateway's transaction reference, once known. */
  readonly gatewayReference?: string;
  /** ISO 8601 timestamps. */
  readonly createdAt: string;
  readonly updatedAt: string;
};
