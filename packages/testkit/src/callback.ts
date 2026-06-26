import {
  type Money,
  money,
  type NormalizedEvent,
  type NormalizedEventType,
  type PaymentId,
  type RawWebhook,
} from "@orvacon/paykit";
import { buildNormalizedEvent, movesValue } from "./event";

/** Input to {@link mockCallback}. */
export interface MockCallbackInput {
  /** The payment to settle — the `paymentId` from the authorize outcome. */
  paymentId: PaymentId;
  /** The event to deliver. Default `"payment.captured"`. */
  type?: NormalizedEventType;
  /** The amount moved — required for `payment.authorized` / `captured` / `refunded`. */
  amount?: Money;
  /** The gateway reference; defaults to the mock's `mock_<paymentId>`. */
  gatewayReference?: string;
  /** ISO 8601 timestamp; defaults to now. */
  occurredAt?: string;
}

interface MockWebhookBody {
  type: NormalizedEventType;
  paymentId: string;
  gatewayReference: string;
  occurredAt: string;
  amountMinor?: number;
  currency?: string;
}

/**
 * Build the {@link RawWebhook} a gateway callback (a 3-D Secure finalize) or an
 * async webhook would deliver. Feed it to `orva.handleWebhook(connectorId, raw)`
 * to settle a payment sitting at `requires_action`:
 *
 * ```ts
 * const raw = mockCallback({ paymentId, type: "payment.captured", amount });
 * await orva.handleWebhook("mock", raw);
 * ```
 */
export function mockCallback(input: MockCallbackInput): RawWebhook {
  const type = input.type ?? "payment.captured";
  const body: MockWebhookBody = {
    type,
    paymentId: input.paymentId,
    gatewayReference: input.gatewayReference ?? `mock_${input.paymentId}`,
    occurredAt: input.occurredAt ?? new Date().toISOString(),
  };
  if (movesValue(type)) {
    if (!input.amount) {
      throw new TypeError(`mockCallback: "${type}" requires an amount.`);
    }
    body.amountMinor = input.amount.amount;
    body.currency = input.amount.currency;
  }
  return {
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  };
}

/**
 * Decode a {@link mockCallback} body back into a `NormalizedEvent`. Used by the
 * {@link mockConnector}'s `parseWebhook`; not usually called directly.
 */
export function decodeMockWebhook(raw: RawWebhook): NormalizedEvent {
  const text = typeof raw.body === "string" ? raw.body : new TextDecoder().decode(raw.body);
  const parsed = JSON.parse(text) as MockWebhookBody;
  const amount =
    parsed.amountMinor !== undefined && parsed.currency !== undefined
      ? money(parsed.amountMinor, parsed.currency)
      : undefined;
  return buildNormalizedEvent(
    parsed.paymentId as PaymentId,
    parsed.gatewayReference,
    parsed.occurredAt,
    parsed.type,
    amount,
    parsed,
  );
}
