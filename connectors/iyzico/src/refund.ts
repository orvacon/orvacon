import type { ConnectorContext, ConnectorResult, RefundInput } from "@orvacon/paykit/connector";
import { formatPrice } from "./format";
import type { IyzicoTransport } from "./transport";

const REFUND_V2_PATH = "/v2/payment/refund";

/**
 * Refund a captured Iyzico payment via Refund V2, which works over the payment
 * id (orvacon's `gatewayReference`) rather than per-item transaction ids — so the
 * gateway reference the core already holds is enough. The core sums refunds and
 * decides `partially_refunded` vs `refunded`; this only reports that the refund
 * call succeeded and always receives an explicit delta from the core.
 *
 * @remarks **Unverified** — Refund V2 is documented as not recommended for a
 * basket with more than one item (it cannot target a specific line), so
 * multi-item partial refunds need the per-transaction refund and are deferred
 * (post-v1).
 */
export async function refund(
  transport: IyzicoTransport,
  ctx: ConnectorContext,
  input: RefundInput,
): Promise<ConnectorResult> {
  if (!input.amount) {
    return {
      ok: false,
      error: { code: "invalid_request", message: "iyzico refund requires an explicit amount" },
    };
  }
  const result = await transport(ctx, {
    method: "POST",
    path: REFUND_V2_PATH,
    body: {
      locale: "en",
      conversationId: input.paymentId,
      paymentId: input.gatewayReference,
      price: formatPrice(input.amount),
      currency: input.amount.currency,
    },
  });
  if (!result.ok) {
    return result;
  }
  return {
    ok: true,
    status: "refunded",
    gatewayReference:
      typeof result.body.paymentId === "string" ? result.body.paymentId : input.gatewayReference,
    raw: result.body,
  };
}
