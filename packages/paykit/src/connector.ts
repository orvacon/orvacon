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
 */
export type ConnectorErrorCode =
  | "declined"
  | "gateway_error"
  | "invalid_request"
  | "auth_error"
  | "unknown";

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

/** Event kinds a webhook can normalize to. */
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
  paymentId: string;
  /** The gateway's transaction reference. */
  gatewayReference: string;
  amount: Money;
  /** ISO 8601 timestamp. */
  occurredAt: string;
  /** The raw gateway payload, retained for audit. */
  raw: unknown;
};

/** Card details passed through to the gateway. Never stored by the core. */
export type Card = {
  number: string;
  expiryMonth: string;
  expiryYear: string;
  cvc: string;
  holderName?: string;
};

/** Input to {@link OrvaconConnector.authorize}. */
export type AuthorizeInput = {
  paymentId: string;
  amount: Money;
  card: Card;
  /** Request a 3DS flow. The connector returns `requires_action` with a challenge. */
  threeDSecure?: boolean;
  /** Where the gateway should send the user back after a challenge. */
  callbackUrl?: string;
};

/**
 * Input to {@link OrvaconConnector.capture}. Omit `amount` for a full capture.
 * Providing a partial `amount` while {@link ConnectorCapabilities.partialCapture}
 * is `false` is rejected by the core as an `invalid_request` before the gateway
 * is called.
 */
export type CaptureInput = {
  paymentId: string;
  gatewayReference: string;
  amount?: Money;
};

/**
 * Input to {@link OrvaconConnector.refund}. Omit `amount` for a full refund;
 * a partial `amount` requires {@link ConnectorCapabilities.partialRefund}.
 */
export type RefundInput = {
  paymentId: string;
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
