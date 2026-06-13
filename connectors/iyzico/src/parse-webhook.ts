import { paymentId } from "@orvacon/paykit";
import type { ConnectorContext, NormalizedEvent, RawWebhook } from "@orvacon/paykit/connector";
import { parsePrice } from "./format";
import type { IyzicoTransport } from "./transport";

const FINALIZE_3DS_PATH = "/payment/3dsecure/auth";

/**
 * Handle an inbound Iyzico 3-D Secure callback and complete the payment.
 *
 * The callback POST (the browser redirect after the bank's 3DS screen) is **not
 * trusted on its own** — its `mdStatus` only gates whether to proceed. When 3DS
 * succeeded, this calls the finalize endpoint (`/payment/3dsecure/auth`); the
 * authenticated finalize call (IYZWSv2 over TLS) is the authoritative result, so
 * `payment.captured` is emitted from the finalize response, never from the
 * callback body.
 *
 * Outcomes:
 * - `mdStatus !== 1` (3DS failed/aborted at the bank) → `payment.failed`, no finalize.
 * - finalize success → `payment.captured` (amount = the charged `paidPrice`).
 * - finalize **definite** failure (gateway `status: "failure"`, classified non-`gateway_error`)
 *   → `payment.failed`.
 * - finalize **transient** failure (`gateway_error` — network/5xx, outcome **unknown**) →
 *   **throws**. The payment stays `requires_action` and reconciliation resolves it; this
 *   never guesses a result that could disagree with what Iyzico actually recorded.
 *
 * @remarks The async X-IYZ-SIGNATURE-V3 notification is a separate, deferred path
 * (post-v1); this handles the synchronous 3DS callback only — its field encoding
 * and the finalize response shape are sandbox-verified.
 */
export async function parseWebhook(
  transport: IyzicoTransport,
  ctx: ConnectorContext,
  raw: RawWebhook,
): Promise<NormalizedEvent> {
  const params = new URLSearchParams(
    typeof raw.body === "string" ? raw.body : new TextDecoder().decode(raw.body),
  );
  const id = paymentId(params.get("conversationId") ?? "");
  const gatewayReference = params.get("paymentId") ?? "";
  const occurredAt = new Date().toISOString();

  if (params.get("mdStatus") !== "1") {
    return {
      type: "payment.failed",
      paymentId: id,
      gatewayReference,
      occurredAt,
      raw: { mdStatus: params.get("mdStatus"), status: params.get("status") },
    };
  }

  const result = await transport(ctx, {
    method: "POST",
    path: FINALIZE_3DS_PATH,
    body: {
      locale: "en",
      conversationId: params.get("conversationId"),
      paymentId: gatewayReference,
      conversationData: params.get("conversationData") ?? "",
    },
  });

  if (!result.ok) {
    if (result.error.code === "gateway_error") {
      throw new Error(
        `iyzico 3DS finalize for "${id}" failed transiently (${result.error.message}); leaving for reconciliation`,
      );
    }
    return {
      type: "payment.failed",
      paymentId: id,
      gatewayReference,
      occurredAt,
      raw: result.error.raw,
    };
  }

  const finalize = result.body;
  if (typeof finalize.paidPrice !== "string" && typeof finalize.paidPrice !== "number") {
    throw new Error(`iyzico 3DS finalize for "${id}" returned no paidPrice`);
  }
  if (typeof finalize.currency !== "string") {
    throw new Error(`iyzico 3DS finalize for "${id}" returned no currency`);
  }
  return {
    type: "payment.captured",
    paymentId: id,
    gatewayReference:
      typeof finalize.paymentId === "string" ? finalize.paymentId : gatewayReference,
    amount: parsePrice(finalize.paidPrice, finalize.currency),
    occurredAt,
    raw: finalize,
  };
}
