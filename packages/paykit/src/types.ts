import type {
  AuthorizeInput,
  ConnectorError,
  ConnectorResult,
  Logger,
  NormalizedEvent,
  NormalizedEventType,
  OrvaconConnector,
  RawWebhook,
} from "./connector";
import type { DatabaseAdapter } from "./database";
import type { RetryConfig } from "./delivery";
import type { Idempotent, PaymentId } from "./ids";
import type { Money } from "./money";
import type { Payment } from "./state";

/** A behavior plugin, bound via `plugins: []`. Contract firmed up later. */
export interface OrvaconPlugin {
  readonly id: string;
}

/**
 * Handler invoked after the corresponding event's state change is persisted.
 * Receives the persisted {@link Payment} (final status — e.g. distinguishing
 * `partially_refunded` from `refunded`) and the triggering
 * {@link NormalizedEvent} (the moved delta and raw gateway payload).
 */
export type HookHandler = (payment: Payment, event: NormalizedEvent) => void | Promise<void>;

/**
 * Event-keyed lifecycle hooks, e.g. `{ "payment.captured": async (p) => … }`.
 * Handlers fire after the transition has been persisted; a handler that throws
 * is reported through `onError` and never breaks the payment flow.
 */
export type Hooks = Partial<Record<NormalizedEventType, HookHandler>>;

/**
 * Configuration for an orvacon instance. Validated fail-fast in {@link orvacon};
 * missing or invalid config throws at setup, not at the first payment.
 */
export type OrvaconConfig = {
  /** Bring-your-own-database adapter. Required — the core persists every payment, event, and ledger row. */
  database: DatabaseAdapter;
  /** Registered gateway connectors, e.g. `[iyzico({ ... })]`. */
  connectors: OrvaconConnector[];
  /** Behavior plugins. */
  plugins?: OrvaconPlugin[];
  /** Event-keyed lifecycle hooks. */
  hooks?: Hooks;
  /** Logger. Defaults to a no-op. */
  logger?: Logger;
  /** Catch-all for errors the core could not otherwise surface (e.g. a throwing hook). */
  onError?: (error: Error) => void;
  /** Per-gateway-call timeout in milliseconds. Default 30 000. */
  timeout?: number;
  /**
   * Retry policy for transient failures, applied to outgoing webhook delivery:
   * a 5xx / 429 / 408 / network failure is retried up to `retries` times with
   * exponential backoff + full jitter; any other 4xx is permanent. See
   * {@link RetryConfig} for the defaults.
   *
   * @remarks Automatic retry of transient *gateway* calls reuses this same
   * machinery and lands with the connector work; today only webhook delivery
   * consumes it.
   */
  retry?: RetryConfig;
  /**
   * Where orvacon POSTs its signed lifecycle webhooks. Optional: with no URL,
   * delivery is off and only in-process {@link Hooks} fire. An invalid or
   * non-`http(s)` URL is rejected fail-fast at construction.
   *
   * @remarks At-least-once and fire-and-forget — the payment flow never blocks
   * on the endpoint, and a delivery that exhausts its retries is surfaced
   * through {@link OrvaconConfig.onError}. v1 keeps no persistent outbox, so an
   * in-flight retry is lost on a crash or serverless freeze; await
   * {@link Orvacon.drainWebhooks} before a short-lived process exits. Durable
   * redelivery lands with the event-storage adapter methods.
   */
  webhookUrl?: string;
  /**
   * Ed25519 private key (`orvsk_…`) used to sign every webhook orvacon sends.
   * Required — there is no unsigned-webhook mode. Generate a pair with
   * `npx orvacon keys` and load the secret half from an environment variable.
   *
   * Parsed with cryptokit's `parseSecretKey` at construction, so a malformed
   * key fails fast at setup rather than at the first delivery.
   */
  webhookSigningKey: string;
};

/**
 * Application-facing authorize request. The core generates the payment id
 * (applications never mint ids) and consumes the idempotency key; the
 * connector receives a plain `AuthorizeInput` and sees neither concern.
 * `connectorId` selects the gateway; it may be omitted when exactly one
 * connector is registered.
 */
export type AuthorizeRequest = Idempotent<
  Omit<AuthorizeInput, "paymentId"> & {
    connectorId?: string;
    /** The payment's owner (the app's user id). Stored on the {@link Payment}; never sent to the connector. */
    userId?: string;
  }
>;

/**
 * Application-facing capture request. The gateway reference comes from the
 * stored payment, never from the caller. Omit `amount` for a full capture.
 */
export type CaptureRequest = Idempotent<{ paymentId: PaymentId; amount?: Money }>;

/**
 * Application-facing refund request. Omit `amount` to refund everything still
 * refundable (the captured amount minus refunds so far).
 */
export type RefundRequest = Idempotent<{ paymentId: PaymentId; amount?: Money }>;

/**
 * Outcome of a mutating operation. `paymentId` is present whenever a payment
 * row exists — it is absent only when validation rejected the request before a
 * payment was created.
 */
export type OperationOutcome = {
  paymentId?: PaymentId;
  result: ConnectorResult;
};

/** Outcome of an inbound webhook: the normalized event, the payment after processing, and whether this delivery was a duplicate (already-applied transitions are skipped, not re-applied). */
export type WebhookOutcome = {
  event: NormalizedEvent;
  payment: Payment;
  duplicate: boolean;
};

/**
 * Outcome of {@link Orvacon.reconcile}.
 * - `resolved: true` — the gateway had settled and the payment was advanced (and
 *   ledgered) to match.
 * - `resolved: false` — the gateway still reports it pending, so the payment is
 *   left unchanged (the correct outcome for an abandoned payment).
 * - `ok: false` — reconciliation could not run (unknown payment, a connector
 *   that cannot retrieve, a payment not awaiting reconciliation, or the retrieve
 *   call itself failed); no state changed.
 */
export type ReconcileResult =
  | { ok: true; resolved: true; payment: Payment; event: NormalizedEvent }
  | { ok: true; resolved: false; payment: Payment }
  | { ok: false; error: ConnectorError };

/**
 * The application-facing orchestrator. The app calls these without knowing
 * which gateway is behind a payment.
 */
export interface Orvacon {
  authorize(request: AuthorizeRequest): Promise<OperationOutcome>;
  capture(request: CaptureRequest): Promise<OperationOutcome>;
  refund(request: RefundRequest): Promise<OperationOutcome>;
  /**
   * Handle an inbound gateway webhook. `connectorId` comes from the callback
   * route (e.g. `/api/orva/callback/[connector]`). Throws on an unknown
   * connector, an unverifiable payload (the connector's signature check), or
   * an unknown payment — the framework adapter maps those to 4xx responses.
   */
  handleWebhook(connectorId: string, raw: RawWebhook): Promise<WebhookOutcome>;
  /**
   * Reconcile a payment stuck at `requires_action` against the gateway's
   * authoritative state — the backstop for the narrow window where the gateway
   * settled (money moved) but the core crashed before persisting it. Reads the
   * truth via the connector's `retrievePayment` and advances the payment only if
   * the gateway says it settled; a still-pending payment is left untouched. A
   * connector without `retrievePayment` cannot be reconciled.
   *
   * @remarks v1 resolves only *settled-but-unreflected* payments; it does not
   * expire or resolve a payment the gateway still reports pending. An abandoned
   * 3DS challenge stays `requires_action` until it settles or is handled out of
   * band — there is no automatic expiry. (The gateway captures at finalize, so a
   * never-finalized 3DS payment moved no money: leaving it untouched is correct.)
   */
  reconcile(paymentId: PaymentId): Promise<ReconcileResult>;
  /**
   * Await every in-flight outbound webhook delivery, including pending retries.
   * Outgoing delivery is fire-and-forget — the mutating methods return without
   * waiting on the dev's endpoint — so a long-running server never needs this.
   * A **short-lived runtime must await it before exiting or freezing** (scripts,
   * CLIs, serverless handlers), or a delivery still in flight is dropped. A
   * no-op when no `webhookUrl` is configured.
   */
  drainWebhooks(): Promise<void>;
}
