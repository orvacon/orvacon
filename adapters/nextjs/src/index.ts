import { type Orvacon, toWebHandler, type WebHandlerOptions } from "@orvacon/paykit";
import { after } from "next/server";

/** The Next.js App Router context for the dynamic `[connector]` route segment. */
type RouteContext = { params: Promise<{ connector: string }> };

/** The route handlers {@link toNextJsHandler} returns — wire with `export const { POST } = …`. */
export type NextJsHandlers = {
  POST: (request: Request, context: RouteContext) => Promise<Response>;
};

/**
 * Adapt an orvacon instance to a Next.js App Router route handler for
 * `app/api/orva/callback/[connector]/route.ts`:
 *
 * ```ts
 * export const { POST } = toNextJsHandler(orva, {
 *   returnUrl: { success: "/checkout/done", failure: "/checkout/failed" },
 * });
 * ```
 *
 * `handleWebhook` runs **synchronously** — finalize and the state/ledger writes
 * settle before the browser is redirected, so the user sees the real outcome —
 * and the signed outbound webhook delivery is drained with Next's `after`,
 * finishing in the background without blocking the redirect.
 *
 * **Make the callback route public.** Exclude `/api/orva/callback` from your
 * `middleware` matcher: the gateway redirects the browser here with no session,
 * so an auth check on this route silently strands payments.
 */
export function toNextJsHandler(orva: Orvacon, options: WebHandlerOptions): NextJsHandlers {
  const handler = toWebHandler(orva, options);
  return {
    POST: async (request, context) => {
      const { connector } = await context.params;
      const response = await handler(request, connector);
      after(() => orva.drainWebhooks());
      return response;
    },
  };
}
