import type {
  AuthorizeInput,
  ConnectorError,
  ConnectorResult,
  DeleteCardInput,
  DeleteCardResult,
  Logger,
  NormalizedEvent,
  NormalizedEventType,
  OrvaconConnector,
  RawWebhook,
  StoreCardInput,
  StoreCardResult,
} from "./connector";
import type { DatabaseAdapter } from "./database";
import type { RetryConfig } from "./delivery";
import type { Idempotent, PaymentId } from "./ids";
import type { Money } from "./money";
import type { Payment } from "./state";

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
  /** Event-keyed lifecycle hooks. */
  hooks?: Hooks;
  /** Behavior plugins (subkit, taxkit, fraudkit, …), run in array order. See {@link OrvaconPlugin}. */
  plugins?: OrvaconPlugin[];
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

/** Per-call context the core hands a plugin. */
export type PluginContext = {
  logger: Logger;
};

/**
 * What {@link OrvaconPlugin.beforeAuthorize} returns: the (possibly transformed)
 * request to proceed with, or `{ reject }` to veto the charge before the gateway.
 */
export type BeforeAuthorizeResult = AuthorizeRequest | { reject: ConnectorError };

/**
 * A behavior plugin. Bound via `orvacon({ plugins: [taxkit(), fraudkit()] })`, it
 * extends the orchestration at two points — without touching the connector or the
 * application code:
 *
 * - `beforeAuthorize` runs before the gateway, in registration order (each plugin
 *   sees the previous one's transform), and may rewrite the request — e.g. add tax
 *   to the amount — or veto it — e.g. a fraud block.
 * - `hooks` react to persisted lifecycle events, merged with the instance's own
 *   {@link Hooks}. A throwing handler is reported through {@link OrvaconConfig.onError}
 *   and never breaks the payment flow.
 *
 * The core never lets a plugin change the `idempotencyKey` or `connectorId`: those
 * are fixed from the original request, so a plugin can reshape *what* is charged
 * but not *where* or the replay identity.
 */
export interface OrvaconPlugin {
  /** Stable identifier, used in logs and errors. */
  name: string;
  beforeAuthorize?(
    ctx: PluginContext,
    request: AuthorizeRequest,
  ): BeforeAuthorizeResult | Promise<BeforeAuthorizeResult>;
  hooks?: Hooks;
}

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
 * Application-facing store-card request. Vaults a card with the gateway and
 * returns a {@link CardToken} to charge later. `connectorId` selects the gateway
 * (omit when exactly one is registered). Not idempotent and not persisted —
 * orvacon returns the token for the application to store against its own customer.
 */
export type StoreCardRequest = StoreCardInput & { connectorId?: string };

/** Application-facing delete-card request. `connectorId` selects the gateway. */
export type DeleteCardRequest = DeleteCardInput & { connectorId?: string };

/**
 * Outcome of a mutating operation (`authorize` / `capture` / `refund`): the
 * connector's discriminated result with the orvacon `paymentId` attached, so it
 * is discriminated on `ok` like every other operation. `paymentId` is always
 * present on success (the payment row exists) and on a post-creation failure;
 * it is absent only when validation rejected the request before any payment was
 * created.
 */
export type OperationOutcome =
  | ({ paymentId: PaymentId } & Extract<ConnectorResult, { ok: true }>)
  | ({ paymentId?: PaymentId } & Extract<ConnectorResult, { ok: false }>);

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
   * Vault a card with the gateway and return a {@link CardToken} to charge it
   * later (via a `token` payment source). orvacon stores nothing — persist the
   * returned token against your own customer. A connector whose gateway has no
   * card storage rejects this as `invalid_request`.
   */
  storeCard(request: StoreCardRequest): Promise<StoreCardResult>;
  /** Delete a vaulted card at the gateway. Paired with {@link storeCard}. */
  deleteCard(request: DeleteCardRequest): Promise<DeleteCardResult>;
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
