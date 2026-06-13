import type { PaymentId } from "./ids";
import type { Money } from "./money";

/**
 * Declared differences between gateways. The core adapts its behavior to these
 * flags instead of branching on a connector's identity, so gateway specifics
 * never leak into application code.
 */
export type ConnectorCapabilities = {
  /** Encoding the gateway uses for its signatures. Iyzico `hex`, PayTR `base64`. */
  signatureEncoding: "hex" | "base64";
  /** Where the webhook/callback URL is configured. PayTR is `hybrid`. */
  callbackUrl: "api" | "panel" | "hybrid";
  /** 3DS challenge delivery. Iyzico `html`, PayTR `iframe`. */
  threeDSecure: "html" | "iframe" | "redirect" | "none";
  /** Webhook acknowledgement format. PayTR demands plain-text `OK`. */
  webhookResponse: "standard" | "plain-ok";
  /** Whether the gateway can capture less than the authorized amount. Iyzico: `false`. */
  partialCapture: boolean;
  /** Whether the gateway can refund less than the captured amount. */
  partialRefund: boolean;
  /** Whether the gateway returns a synchronous fraud status field. */
  fraudStatus: boolean;
  /** Whether authorize captures in the same step by default. */
  autoCapture: boolean;
};

/**
 * Normalized error classification. The gateway's raw code is mapped to one of
 * these by {@link ConnectorContext.classifyError}; the core decides on the class,
 * not on the raw code.
 *
 * Retry semantics are a property of the class (see {@link isRetryableError}):
 * - `declined` — the gateway said no. Final; never auto-retried.
 * - `gateway_error` — transient gateway/network failure. The only auto-retry
 *   candidate (exponential backoff + jitter).
 * - `invalid_request` — our request was malformed. A bug; never retried.
 * - `auth_error` — connector credentials invalid. Configuration; never retried.
 * - `conflict` — another request holding the same idempotency key is still in
 *   progress. Minted by the core, never by a connector; safe to retry after
 *   the in-flight request settles, but never auto-retried.
 * - `unknown` — unclassifiable, outcome ambiguous. Deliberately NOT auto-retried
 *   (a blind retry risks a double charge); surfaced for reconciliation.
 */
export type ConnectorErrorCode =
  | "declined"
  | "gateway_error"
  | "invalid_request"
  | "auth_error"
  | "conflict"
  | "unknown";

/**
 * Whether the core may automatically retry an operation that failed with this
 * class. Only `gateway_error` qualifies — when unsure, the default is to NOT
 * retry: a wrongly retried charge is worse than a surfaced error.
 */
export function isRetryableError(code: ConnectorErrorCode): boolean {
  return code === "gateway_error";
}

/** A normalized connector failure. The raw gateway payload is kept for audit. */
export type ConnectorError = {
  code: ConnectorErrorCode;
  message: string;
  raw?: unknown;
};

/** Raw gateway error mapping, declared per connector as `$ERROR_CODES`. */
export type RawError = {
  code: ConnectorErrorCode;
  message?: string;
};

/**
 * A step the caller must complete before the payment can settle — typically a
 * 3DS challenge. The shape follows the gateway's delivery mechanism.
 */
export type ConnectorAction =
  | { type: "html"; content: string }
  | { type: "iframe"; token: string }
  | { type: "redirect"; url: string };

/**
 * The outcome of a connector operation. Connectors never throw; they return a
 * discriminated result the core reflects into the state machine and ledger.
 *
 * `status` is the *gateway-level* outcome, not the persisted payment state.
 * In particular, `"refunded"` means "this refund call succeeded" — whether it
 * was partial or full. A connector never reports `partially_refunded`; the
 * core compares the cumulative refunded total against the captured amount and
 * persists `partially_refunded` or `refunded` itself.
 */
export type ConnectorResult =
  | {
      ok: true;
      status: "authorized" | "captured" | "requires_action" | "refunded";
      gatewayReference?: string;
      action?: ConnectorAction;
      raw: unknown;
    }
  | { ok: false; error: ConnectorError };

/**
 * Event kinds a webhook can normalize to.
 *
 * There is deliberately no `payment.partially_refunded`: a refund event carries
 * the moved delta ({@link NormalizedEvent.amount}), and whether the payment is
 * now partially or fully refunded is the core's bookkeeping decision — read it
 * from `Payment.status` after the transition, never from the event type.
 */
export type NormalizedEventType =
  | "payment.authorized"
  | "payment.captured"
  | "payment.refunded"
  | "payment.failed"
  | "payment.voided";

/**
 * A gateway webhook reduced to one shape the core understands. Whatever the
 * gateway sends, `parseWebhook` verifies it (with the gateway's own signature
 * scheme) and emits this.
 */
export type NormalizedEvent = {
  type: NormalizedEventType;
  /** orvacon's own payment id (= the gateway conversationId / merchant_oid). */
  paymentId: PaymentId;
  /** The gateway's transaction reference. */
  gatewayReference: string;
  /**
   * The amount that moved in *this* event — for a refund this is the refunded
   * delta, not the remaining or original total. The core sums refund deltas
   * against the captured amount to decide `partially_refunded` vs `refunded`.
   */
  amount: Money;
  /** ISO 8601 timestamp. */
  occurredAt: string;
  /** The raw gateway payload, retained for audit. */
  raw: unknown;
};

/**
 * Raw card details passed through to the gateway.
 *
 * **Handle as toxic.** Never persisted by the core, never written to the
 * ledger or any audit record, never logged — do not put a `Card` (or anything
 * containing one, e.g. an `AuthorizeInput`) into log fields or a `raw` payload.
 * Prefer the token flow ({@link PaymentSource}) wherever the gateway supports it.
 */
export type Card = {
  number: string;
  expiryMonth: string;
  expiryYear: string;
  /**
   * Sensitive Authentication Data (PCI DSS): must never be stored after
   * authorization — not even encrypted. It exists in memory for the duration
   * of the gateway call and is gone.
   */
  cvc: string;
  holderName?: string;
};

/** A gateway-issued token standing in for a card (PCI-friendly flow). */
export type CardToken = {
  token: string;
};

/**
 * What a payment is charged against. A discriminated union so a PCI-compliant
 * token flow and a raw-card flow share one input shape without one breaking the
 * other later.
 */
export type PaymentSource = { type: "card"; card: Card } | { type: "token"; token: CardToken };

/**
 * The person being charged. Optional on {@link AuthorizeInput}: a connector may
 * require it — and a specific subset of its fields — for 3-D Secure, fraud
 * scoring, or address verification. A connector that needs a field this type
 * leaves optional (e.g. {@link Buyer.nationalId}) validates its presence and
 * rejects the charge with `invalid_request` before calling the gateway.
 */
export type Buyer = {
  /** The buyer's id in the merchant's own system. */
  referenceId?: string;
  name: string;
  surname: string;
  email: string;
  /** Phone in E.164 form, e.g. `"+905350000000"`. */
  phone?: string;
  /**
   * The buyer's government-issued national identity number, where a gateway
   * requires it (e.g. Turkey's TCKN). Named for the concept, not any one
   * country's field — gateways that do not need it ignore it.
   */
  nationalId?: string;
  /** Free-form registration/contact address line. */
  address?: string;
  city?: string;
  country?: string;
  /** The buyer's IP at checkout; some gateways require it for fraud scoring. */
  ip?: string;
};

/**
 * A postal address. Optional on {@link AuthorizeInput}; some gateways require a
 * billing address for AVS / 3-D Secure, and a shipping address for physical goods.
 */
export type Address = {
  /** Name of the person at this address. */
  contactName: string;
  address: string;
  city: string;
  country: string;
  /** Postal/ZIP code, where applicable. */
  zipCode?: string;
};

/**
 * One line of an itemized basket. Optional on {@link AuthorizeInput}; some
 * gateways require the basket and check that the line-item total equals the
 * charged amount. `price` is {@link Money} (integer minor units) so the total is
 * summed currency-safely, never floated — and that equality check belongs to the
 * connector, since not every gateway enforces it.
 */
export type BasketItem = {
  /** The item's id in the merchant's catalog. */
  referenceId: string;
  name: string;
  price: Money;
  /** Primary category label, e.g. `"Electronics"`. */
  category?: string;
  /** Whether the item ships physically or is delivered digitally. */
  type?: "physical" | "virtual";
};

/** Input to {@link OrvaconConnector.authorize}. */
export type AuthorizeInput = {
  paymentId: PaymentId;
  amount: Money;
  source: PaymentSource;
  /** Request a 3DS flow. The connector returns `requires_action` with a challenge. */
  threeDSecure?: boolean;
  /** Where the gateway should send the user back after a challenge. */
  callbackUrl?: string;
  /** The buyer being charged. Optional here; a connector may require it (and a subset of its fields). */
  buyer?: Buyer;
  /** Billing address. Optional here; required by some gateways for AVS / 3-D Secure. */
  billingAddress?: Address;
  /** Shipping address, for physically shipped goods. */
  shippingAddress?: Address;
  /** Itemized basket. Optional here; some gateways require it and reconcile its total against `amount`. */
  basket?: readonly BasketItem[];
};

/**
 * Input to {@link OrvaconConnector.capture}. Omit `amount` for a full capture.
 * Providing a partial `amount` while {@link ConnectorCapabilities.partialCapture}
 * is `false` is rejected by the core as an `invalid_request` before the gateway
 * is called.
 */
export type CaptureInput = {
  paymentId: PaymentId;
  gatewayReference: string;
  amount?: Money;
};

/**
 * Input to {@link OrvaconConnector.refund}. Omit `amount` for a full refund;
 * a partial `amount` requires {@link ConnectorCapabilities.partialRefund}.
 */
export type RefundInput = {
  paymentId: PaymentId;
  gatewayReference: string;
  amount?: Money;
};

/** A raw inbound webhook, before verification and normalization. */
export type RawWebhook = {
  headers: Record<string, string>;
  body: string | Uint8Array;
  query?: Record<string, string>;
};

/** Result of {@link OrvaconConnector.verifySetup}. */
export type SetupResult = {
  ok: boolean;
  /** Instructions for any gateway-side setup the connector cannot do itself. */
  instructions?: string;
};

/** Minimal structured logger the core injects; connectors never construct their own. */
export type Logger = {
  debug(message: string, fields?: Record<string, unknown>): void;
  info(message: string, fields?: Record<string, unknown>): void;
  warn(message: string, fields?: Record<string, unknown>): void;
  error(message: string, fields?: Record<string, unknown>): void;
};

/**
 * Per-call context the core hands a connector. Cross-cutting infrastructure
 * (logging, error classification, timeout/retry) lives here, not inside the
 * connector.
 */
export type ConnectorContext = {
  logger: Logger;
  /**
   * Carries the core's per-call timeout (and future cancellation). Connectors
   * must pass this to every gateway HTTP call so a hung gateway cannot hang
   * the core.
   */
  signal: AbortSignal;
  classifyError(rawCode: string, errorCodes?: Record<string, RawError>): ConnectorErrorCode;
};

/**
 * The contract every gateway implements. Gateway-specific concerns —
 * authentication, field names, error codes, webhook format, signature scheme —
 * are sealed inside the connector; only normalized types cross this boundary.
 *
 * Connectors are registered as factory results, e.g.
 * `orvacon({ connectors: [iyzico({ apiKey, secretKey })] })`.
 */
export interface OrvaconConnector {
  /** Stable identifier, e.g. `"iyzico"`. */
  id: string;
  version: string;
  capabilities: ConnectorCapabilities;

  authorize(ctx: ConnectorContext, input: AuthorizeInput): Promise<ConnectorResult>;
  capture(ctx: ConnectorContext, input: CaptureInput): Promise<ConnectorResult>;
  refund(ctx: ConnectorContext, input: RefundInput): Promise<ConnectorResult>;
  parseWebhook(ctx: ConnectorContext, raw: RawWebhook): Promise<NormalizedEvent>;

  /** Optional check for gateway-side setup the connector cannot perform itself. */
  verifySetup?(ctx: ConnectorContext): Promise<SetupResult>;
  /** Raw gateway error-code mapping, consumed by {@link ConnectorContext.classifyError}. */
  $ERROR_CODES?: Record<string, RawError>;
}
