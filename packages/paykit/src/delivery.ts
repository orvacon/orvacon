import { type Ed25519SecretKey, signWebhook } from "@orvacon/cryptokit";
import type { Logger, NormalizedEvent, NormalizedEventType } from "./connector";
import { type EventId, generateEventId, type PaymentId } from "./ids";
import type { Money } from "./money";
import type { Payment, PaymentStatus } from "./state";

/**
 * Retry/backoff policy for transient delivery failures. Defaults: 3 retries,
 * 250 ms base, 10 s cap. Backoff is exponential (`base · 2ⁿ`) clamped to the
 * cap, then full jitter picks a uniform point in `[0, ceiling)` — the AWS/Stripe
 * model that spreads retries so a recovering endpoint is not thundered by every
 * sender retrying in lockstep.
 */
export type RetryConfig = {
  /** Maximum retries after the first attempt. Default 3 (up to 4 attempts total). */
  retries?: number;
  /** Base backoff in milliseconds — the `n = 0` ceiling. Default 250. */
  minTimeoutMs?: number;
  /** Backoff ceiling in milliseconds — caps the exponential growth. Default 10 000. */
  maxTimeoutMs?: number;
};

/** Header carrying the delivery's `evt_…` id. */
export const WEBHOOK_ID_HEADER = "orvacon-id";
/** Header carrying the unix-seconds sign time — the receiver's replay-window input. */
export const WEBHOOK_TIMESTAMP_HEADER = "orvacon-timestamp";
/** Header carrying the versioned Ed25519 signature (`v1,<base64url>`). */
export const WEBHOOK_SIGNATURE_HEADER = "orvacon-signature";

/**
 * The payload orvacon delivers to the dev's webhook endpoint. Deliberately
 * minimal and stable: it carries the orchestrated outcome and never the
 * gateway's raw payload — raw gateway data stays audit-local in the dev's
 * database, so neither its size nor any PII it may carry crosses the network to
 * a second system.
 *
 * Serialized to JSON, this exact string is what the Ed25519 signature covers.
 * The receiver re-verifies it with cryptokit's `verifyWebhook` — passing the
 * three `orvacon-*` headers — before trusting any field.
 */
export type WebhookEvent = {
  /** This delivery's id; stable across redeliveries, so receivers deduplicate on it. */
  id: EventId;
  /** The lifecycle event that fired. */
  type: NormalizedEventType;
  /** ISO 8601 — when orvacon emitted this delivery. */
  createdAt: string;
  data: {
    paymentId: PaymentId;
    /**
     * The payment's persisted status *after* the transition — read
     * `partially_refunded` vs `refunded` here, never inferred from
     * {@link WebhookEvent.type}.
     */
    status: PaymentStatus;
    /** The amount that moved in *this* event (e.g. the refunded delta), not the payment total. */
    amount: Money;
    /** The gateway's transaction reference. */
    gatewayReference: string;
    /** ISO 8601 — when the underlying event occurred at the gateway. */
    occurredAt: string;
  };
};

/**
 * Project a persisted {@link Payment} and the {@link NormalizedEvent} that moved
 * it into the minimal {@link WebhookEvent} delivered to the dev. The gateway's
 * raw payload is dropped here by design.
 */
export function buildWebhookEvent(
  payment: Payment,
  event: NormalizedEvent,
  id: EventId,
  createdAt: string,
): WebhookEvent {
  return {
    id,
    type: event.type,
    createdAt,
    data: {
      paymentId: payment.id,
      status: payment.status,
      amount: event.amount,
      gatewayReference: payment.gatewayReference ?? event.gatewayReference,
      occurredAt: event.occurredAt,
    },
  };
}

/** Drives outbound webhook delivery. `deliver` is fire-and-forget; `idle` drains in-flight work. */
export type WebhookDeliverer = {
  /**
   * Schedule a signed delivery and return immediately — the payment flow is
   * never blocked on the dev's endpoint. Failures (after retries) are routed to
   * the configured `report`; this never throws.
   */
  deliver(payment: Payment, event: NormalizedEvent): void;
  /** Resolve once every currently in-flight delivery (including retries) has settled. */
  idle(): Promise<void>;
};

/**
 * The slice of `fetch` the deliverer relies on — just the call signature, so
 * any platform's `fetch` (Node, Bun, Workers) or a test double satisfies it
 * without depending on runtime-specific extensions (e.g. Bun's `preconnect`).
 */
export type FetchLike = (input: string | URL, init?: RequestInit) => Promise<Response>;

/**
 * Construction options for {@link createWebhookDeliverer}. The test seams
 * (`fetch` / `sleep` / `now` / `random`) default to platform globals.
 */
export type WebhookDelivererOptions = {
  url: string;
  secretKey: Ed25519SecretKey;
  retry: RetryConfig | undefined;
  /** Per-attempt timeout in milliseconds; a slow endpoint is aborted and the attempt counts as transient. */
  timeoutMs: number;
  report: (error: unknown) => void;
  logger: Logger;
  fetch?: FetchLike;
  sleep?: (ms: number) => Promise<void>;
  now?: () => number;
  random?: () => number;
};

const DEFAULT_RETRIES = 3;
const DEFAULT_MIN_TIMEOUT_MS = 250;
const DEFAULT_MAX_TIMEOUT_MS = 10_000;

/** A 5xx, 429, or 408 is transient (retry); every other non-2xx is permanent (give up). */
function isRetryableStatus(status: number): boolean {
  return status === 408 || status === 429 || status >= 500;
}

/** Full-jitter backoff: a uniform point in `[0, min(cap, base · 2ⁿ))`. */
function backoffDelay(
  attempt: number,
  minTimeoutMs: number,
  maxTimeoutMs: number,
  random: () => number,
): number {
  const ceiling = Math.min(maxTimeoutMs, minTimeoutMs * 2 ** attempt);
  return Math.floor(random() * ceiling);
}

type SendOutcome =
  | { kind: "ok" }
  | { kind: "transient"; reason: string }
  | { kind: "permanent"; reason: string };

function defaultSleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Create the outbound webhook deliverer. Each delivery signs
 * `id.timestamp.payload` with the Ed25519 secret (cryptokit `signWebhook`),
 * POSTs the JSON body plus the three `orvacon-*` headers, and retries transient
 * failures (5xx / 429 / 408 / network) with exponential backoff + full jitter;
 * any other 4xx is permanent.
 *
 * @remarks There is no persistent outbox in v1: in-flight retries live only in
 * memory, so a crash or a serverless freeze drops them. Durable redelivery
 * arrives with the event-storage `DatabaseAdapter` methods. Until then, await
 * {@link WebhookDeliverer.idle} before a short-lived process exits.
 */
export function createWebhookDeliverer(options: WebhookDelivererOptions): WebhookDeliverer {
  const fetchImpl: FetchLike = options.fetch ?? fetch;
  const sleep = options.sleep ?? defaultSleep;
  const now = options.now ?? Date.now;
  const random = options.random ?? Math.random;
  const retries = options.retry?.retries ?? DEFAULT_RETRIES;
  const minTimeoutMs = options.retry?.minTimeoutMs ?? DEFAULT_MIN_TIMEOUT_MS;
  const maxTimeoutMs = options.retry?.maxTimeoutMs ?? DEFAULT_MAX_TIMEOUT_MS;
  const inFlight = new Set<Promise<void>>();

  async function sendOnce(body: string, headers: Record<string, string>): Promise<SendOutcome> {
    let response: Response;
    try {
      response = await fetchImpl(options.url, {
        method: "POST",
        headers,
        body,
        signal: AbortSignal.timeout(options.timeoutMs),
      });
    } catch (error) {
      return { kind: "transient", reason: error instanceof Error ? error.message : String(error) };
    }
    if (response.ok) {
      return { kind: "ok" };
    }
    return isRetryableStatus(response.status)
      ? { kind: "transient", reason: `HTTP ${response.status}` }
      : { kind: "permanent", reason: `HTTP ${response.status}` };
  }

  async function run(payment: Payment, event: NormalizedEvent): Promise<void> {
    const at = now();
    const id = generateEventId(at);
    const timestamp = Math.floor(at / 1000);
    const body = JSON.stringify(buildWebhookEvent(payment, event, id, new Date(at).toISOString()));
    const signature = await signWebhook(options.secretKey, { id, timestamp, payload: body });
    const headers = {
      "content-type": "application/json",
      [WEBHOOK_ID_HEADER]: id,
      [WEBHOOK_TIMESTAMP_HEADER]: String(timestamp),
      [WEBHOOK_SIGNATURE_HEADER]: signature,
    };
    for (let attempt = 0; attempt <= retries; attempt++) {
      if (attempt > 0) {
        await sleep(backoffDelay(attempt - 1, minTimeoutMs, maxTimeoutMs, random));
      }
      const outcome = await sendOnce(body, headers);
      if (outcome.kind === "ok") {
        options.logger.debug("orvacon: webhook delivered", { event: id, type: event.type });
        return;
      }
      if (outcome.kind === "permanent") {
        throw new Error(`orvacon: webhook delivery to ${options.url} failed (${outcome.reason})`);
      }
      if (attempt === retries) {
        throw new Error(
          `orvacon: webhook delivery to ${options.url} failed after ${retries + 1} attempts (${outcome.reason})`,
        );
      }
      options.logger.warn("orvacon: webhook delivery attempt failed, retrying", {
        event: id,
        attempt: attempt + 1,
        reason: outcome.reason,
      });
    }
  }

  function deliver(payment: Payment, event: NormalizedEvent): void {
    const task = run(payment, event).catch((error) => {
      options.report(error);
    });
    inFlight.add(task);
    void task.finally(() => {
      inFlight.delete(task);
    });
  }

  async function idle(): Promise<void> {
    await Promise.allSettled([...inFlight]);
  }

  return { deliver, idle };
}
