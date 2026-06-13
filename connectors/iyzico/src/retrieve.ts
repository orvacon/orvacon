import type {
  ConnectorContext,
  ReconcileOutcome,
  RetrievePaymentInput,
} from "@orvacon/paykit/connector";
import { parsePrice } from "./format";
import type { IyzicoTransport } from "./transport";

const DETAIL_PATH = "/payment/detail";

/**
 * Fetch Iyzico's authoritative view of a payment for reconciliation, via the
 * Retrieve Payment endpoint (`/payment/detail`). The decision turns on
 * `paymentStatus` — verified against the sandbox: a captured payment reports
 * `SUCCESS` (with a populated `itemTransactions`), an unfinalized 3DS payment
 * reports `INIT_THREEDS`, and a failed-3DS one `CALLBACK_THREEDS` (both with an
 * empty `itemTransactions`). The `phase` field is *not* discriminating — it is
 * `AUTH` for all three.
 *
 * - `SUCCESS` → resolved `payment.captured`, amount from `paidPrice`.
 * - `INIT_THREEDS` (or any other non-terminal status) → `resolved: false`; the
 *   gateway has not settled, so the core leaves the payment untouched.
 * - a transport/gateway error → `ok: false`.
 *
 * @remarks **Unverified** — the `FAILURE → payment.failed` mapping is inferred:
 * against the sandbox even a failed 3DS reports `CALLBACK_THREEDS` (treated as
 * pending), so `FAILURE` itself was never observed. Any unrecognized status
 * falls through to `resolved: false` (safe: it never invents a settlement).
 */
export async function retrievePayment(
  transport: IyzicoTransport,
  ctx: ConnectorContext,
  input: RetrievePaymentInput,
): Promise<ReconcileOutcome> {
  const result = await transport(ctx, {
    method: "POST",
    path: DETAIL_PATH,
    body: {
      locale: "en",
      conversationId: input.paymentId,
      paymentId: input.gatewayReference,
    },
  });
  if (!result.ok) {
    return { ok: false, error: result.error };
  }

  const body = result.body;
  const paymentStatus = typeof body.paymentStatus === "string" ? body.paymentStatus : "";
  const occurredAt = new Date().toISOString();
  const gatewayReference =
    typeof body.paymentId === "string" ? body.paymentId : input.gatewayReference;

  if (paymentStatus === "SUCCESS") {
    if (typeof body.paidPrice !== "string" && typeof body.paidPrice !== "number") {
      return {
        ok: false,
        error: { code: "unknown", message: "iyzico retrieve: SUCCESS payment has no paidPrice" },
      };
    }
    if (typeof body.currency !== "string") {
      return {
        ok: false,
        error: { code: "unknown", message: "iyzico retrieve: payment has no currency" },
      };
    }
    return {
      ok: true,
      resolved: true,
      event: {
        type: "payment.captured",
        paymentId: input.paymentId,
        gatewayReference,
        amount: parsePrice(body.paidPrice, body.currency),
        occurredAt,
        raw: body,
      },
    };
  }

  if (paymentStatus === "FAILURE") {
    return {
      ok: true,
      resolved: true,
      event: {
        type: "payment.failed",
        paymentId: input.paymentId,
        gatewayReference,
        occurredAt,
        raw: body,
      },
    };
  }

  // INIT_THREEDS or any other non-terminal status: still pending at the gateway.
  return { ok: true, resolved: false };
}
