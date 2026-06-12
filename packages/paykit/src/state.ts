import type { PaymentId } from "./ids";
import type { Money } from "./money";

/**
 * Lifecycle states of a payment.
 *
 * `created → requires_action → authorized → captured → (partially_refunded →) refunded`,
 * with `failed` and `voided` as terminal off-ramps.
 *
 * `partially_refunded` is reached when a refund moves less than the full captured
 * amount; further refunds stay there until the cumulative refund equals the
 * captured amount, at which point the payment is `refunded`.
 *
 * `voided` is reached through a gateway-initiated cancellation arriving as a
 * `payment.voided` webhook (authorization canceled or expired on the gateway
 * side). v1 deliberately has no core-initiated `void()` operation — which is
 * also why `ConnectorResult.status` has no `"voided"` member.
 */
export type PaymentStatus =
  | "created"
  | "requires_action"
  | "authorized"
  | "captured"
  | "partially_refunded"
  | "refunded"
  | "failed"
  | "voided";

const transitions = {
  created: ["requires_action", "authorized", "captured", "failed"],
  requires_action: ["authorized", "captured", "failed"],
  authorized: ["captured", "voided", "failed"],
  captured: ["partially_refunded", "refunded"],
  partially_refunded: ["partially_refunded", "refunded"],
  refunded: [],
  failed: [],
  voided: [],
} as const satisfies Record<PaymentStatus, readonly PaymentStatus[]>;

/**
 * The permitted forward transitions, derived from the same table the runtime
 * guard uses — the compile-time union and {@link assertTransition} cannot
 * drift apart. An illegal move (e.g. `refunded → authorized`) is a compile
 * error; terminal states map to `never`.
 */
export type AllowedTransitions = {
  [S in PaymentStatus]: (typeof transitions)[S][number];
};

/** The states reachable in one step from `S`. */
export type NextStatus<S extends PaymentStatus> = AllowedTransitions[S];

/** True when `from → to` is a permitted transition. */
export function canTransition(from: PaymentStatus, to: PaymentStatus): boolean {
  const allowed: readonly PaymentStatus[] = transitions[from];
  return allowed.includes(to);
}

/**
 * Runtime half of the state machine: statuses crossing the connector and
 * webhook boundaries arrive as runtime strings, so the core validates every
 * transition here before persisting it — the compile-time
 * {@link AllowedTransitions} alone cannot see those values.
 *
 * @throws Error on an illegal transition.
 */
export function assertTransition(from: PaymentStatus, to: PaymentStatus): void {
  if (!canTransition(from, to)) {
    throw new Error(`Illegal payment state transition: ${from} → ${to}`);
  }
}

/** A persisted payment record. The core owns this; connectors never see it. */
export type Payment = {
  readonly id: PaymentId;
  readonly status: PaymentStatus;
  /** The original authorized/captured amount. */
  readonly amount: Money;
  /** Cumulative amount refunded so far; drives `captured → partially_refunded → refunded`. */
  readonly refundedTotal?: Money;
  /** Id of the connector that owns this payment, e.g. `"iyzico"`. */
  readonly connectorId: string;
  /** The gateway's transaction reference, once known. */
  readonly gatewayReference?: string;
  /** ISO 8601 timestamps. */
  readonly createdAt: string;
  readonly updatedAt: string;
};
