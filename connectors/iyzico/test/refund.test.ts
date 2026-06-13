import { describe, expect, test } from "bun:test";
import { generatePaymentId, money } from "@orvacon/paykit";
import type { ConnectorContext, RefundInput } from "@orvacon/paykit/connector";
import { resolveIyzicoConfig } from "../src/config";
import { refund } from "../src/refund";
import { createTransport } from "../src/transport";

function fakeContext(): ConnectorContext {
  return {
    signal: new AbortController().signal,
    logger: { debug() {}, info() {}, warn() {}, error() {} },
    classifyError: (rawCode, codes) => codes?.[rawCode]?.code ?? "unknown",
  };
}

function harness(response: unknown, status = 200) {
  const calls: { url: string; body: string }[] = [];
  const fetchImpl = async (url: string | URL, init?: RequestInit): Promise<Response> => {
    calls.push({ url: String(url), body: String(init?.body) });
    return new Response(JSON.stringify(response), {
      status,
      headers: { "content-type": "application/json" },
    });
  };
  const config = resolveIyzicoConfig({
    apiKey: "sandbox-x",
    secretKey: "sandbox-y",
    fetch: fetchImpl,
  });
  return { transport: createTransport(config), calls };
}

function refundInput(amount = money(3_000, "TRY")): RefundInput {
  return { paymentId: generatePaymentId(), gatewayReference: "iyzico-pay-1", amount };
}

describe("iyzico refund (V2 over paymentId)", () => {
  test("posts to /v2/payment/refund by paymentId and reports refunded", async () => {
    const { transport, calls } = harness({
      status: "success",
      paymentId: "iyzico-pay-1",
      price: "30.0",
    });
    const result = await refund(transport, fakeContext(), refundInput(money(3_000, "TRY")));

    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error("expected success");
    }
    expect(result.status).toBe("refunded");
    expect(result.gatewayReference).toBe("iyzico-pay-1");

    const call = calls[0];
    if (!call) {
      throw new Error("expected a gateway call");
    }
    expect(call.url).toBe("https://sandbox-api.iyzipay.com/v2/payment/refund");
    const body = JSON.parse(call.body);
    // gatewayReference (the stored Iyzico paymentId) is what Refund V2 keys on.
    expect(body.paymentId).toBe("iyzico-pay-1");
    expect(body.price).toBe("30.0");
    expect(body.currency).toBe("TRY");
  });

  test("rejects a refund without an explicit amount before the gateway", async () => {
    const { transport, calls } = harness({ status: "success" });
    const result = await refund(transport, fakeContext(), {
      paymentId: generatePaymentId(),
      gatewayReference: "iyzico-pay-1",
    });
    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error("expected failure");
    }
    expect(result.error.code).toBe("invalid_request");
    expect(calls).toHaveLength(0);
  });

  test("propagates a gateway failure as a connector error", async () => {
    const { transport } = harness({
      status: "failure",
      errorCode: "x",
      errorMessage: "Refund window closed",
    });
    const result = await refund(transport, fakeContext(), refundInput());
    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error("expected failure");
    }
    expect(result.error.code).toBe("unknown");
    expect(result.error.message).toBe("Refund window closed");
  });
});
