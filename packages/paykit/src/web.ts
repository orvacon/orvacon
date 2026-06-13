import type { RawWebhook } from "./connector";
import type { Orvacon } from "./orvacon";
import type { PaymentStatus } from "./state";

/** Where the browser is sent after a 3-D Secure callback resolves. */
export type ReturnUrls = {
  success: string;
  failure: string;
};

/** Options for {@link toWebHandler}. */
export type WebHandlerOptions = {
  /**
   * Where to redirect the browser once a 3DS *callback* resolves — the user must
   * land somewhere, never a blank page. orvacon picks `success` for a captured/
   * authorized outcome and `failure` otherwise, because the orchestrator already
   * knows the finalize result; the app should not have to decide.
   *
   * @remarks **Unverified** — *that* the browser is redirected is settled; the
   * exact gateway mechanism is not. Whether orvacon 302s the callback itself, or
   * the gateway expects separate success/failure URLs configured up front (in its
   * panel or request, like PayTR's `merchant_ok_url` / `merchant_fail_url`), is
   * confirmed against the sandbox.
   */
  returnUrl: ReturnUrls;
};

/** A framework-agnostic handler: a Web-standard `Request` plus the route's connector id → a `Response`. */
export type WebHandler = (request: Request, connectorId: string) => Promise<Response>;

/**
 * Adapt an orvacon instance to a Web-standard `Request → Response` handler for
 * the gateway callback route (`/api/orva/callback/[connector]`). Framework
 * adapters (`toNextJsHandler`, …) wrap this; it carries no framework dependency.
 *
 * The request is parsed to a {@link RawWebhook} and run through `handleWebhook`
 * **synchronously** — parse → verify → finalize → state → ledger all settle
 * before the response, so the outcome is durable and the user sees the real
 * result. The signed outbound webhook delivery `handleWebhook` schedules is
 * fire-and-forget; a framework adapter drains it *after* the response (e.g.
 * Next's `after`), so the callback is never blocked on the dev's endpoint.
 */
export function toWebHandler(orva: Orvacon, options: WebHandlerOptions): WebHandler {
  return async (request, connectorId) => {
    let raw: RawWebhook;
    try {
      raw = await toRawWebhook(request);
    } catch {
      return new Response("invalid request", { status: 400 });
    }
    try {
      const outcome = await orva.handleWebhook(connectorId, raw);
      return respondTo(outcome.payment.status, options);
    } catch {
      // Unknown connector / unverifiable payload / unknown payment: the callback
      // is never trusted, so send the browser to the failure page.
      return redirect(options.returnUrl.failure);
    }
  };
}

async function toRawWebhook(request: Request): Promise<RawWebhook> {
  const headers: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    headers[key] = value;
  });
  const query: Record<string, string> = {};
  new URL(request.url).searchParams.forEach((value, key) => {
    query[key] = value;
  });
  return { headers, body: await request.text(), query };
}

const SUCCESS_STATUSES = new Set<PaymentStatus>([
  "authorized",
  "captured",
  "partially_refunded",
  "refunded",
]);

/**
 * Choose the callback response from the resolved payment status: a browser 3DS
 * callback redirects to success or failure.
 *
 * @remarks Only the browser-callback branch exists in v1. An async server-to-
 * server **notification** (post-v1) is not a browser flow — it returns a plain
 * acknowledgement shaped by the connector's `webhookResponse` capability (e.g.
 * PayTR's plain `OK`), not a redirect. That branch slots in here, keyed off
 * whether the inbound is a callback or a notification, without touching the
 * callback path.
 */
function respondTo(status: PaymentStatus, options: WebHandlerOptions): Response {
  return SUCCESS_STATUSES.has(status)
    ? redirect(options.returnUrl.success)
    : redirect(options.returnUrl.failure);
}

/** 303 See Other: the browser issues a GET to `location` after the callback POST. */
function redirect(location: string): Response {
  return new Response(null, { status: 303, headers: { location } });
}
