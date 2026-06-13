import { describe, expect, test } from "bun:test";
import { generatePaymentId, money } from "@orvacon/paykit";
import type { ConnectorContext, RawError, RawWebhook } from "@orvacon/paykit/connector";
import { resolveIyzicoConfig } from "../src/config";
import { parseWebhook } from "../src/parse-webhook";
import { createTransport } from "../src/transport";

const PAY_ID = generatePaymentId();

function fakeContext(): ConnectorContext {
  return {
    signal: new AbortController().signal,
    logger: { debug() {}, info() {}, warn() {}, error() {} },
    classifyError: (rawCode, codes) => codes?.[rawCode]?.code ?? "unknown",
  };
}

function harness(response: unknown, status = 200, errorCodes?: Record<string, RawError>) {
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
  return { transport: createTransport(config, errorCodes), calls };
}

function callback(fields: Record<string, string>): RawWebhook {
  return { headers: {}, body: new URLSearchParams(fields).toString() };
}

describe("iyzico parseWebhook — 3DS callback", () => {
  test("mdStatus != 1 → payment.failed without calling finalize", async () => {
    const { transport, calls } = harness({});
    const event = await parseWebhook(
      transport,
      fakeContext(),
      callback({
        conversationId: PAY_ID,
        paymentId: "iyzico-pay-1",
        mdStatus: "0",
        status: "failure",
      }),
    );
    expect(event.type).toBe("payment.failed");
    expect(event.paymentId).toBe(PAY_ID);
    expect(calls).toHaveLength(0);
  });

  test("mdStatus == 1 + finalize success → payment.captured with the charged amount", async () => {
    const { transport, calls } = harness({
      status: "success",
      paymentId: "iyzico-pay-9",
      price: "100.5",
      paidPrice: "100.5",
      currency: "TRY",
      signature: "sig",
    });
    const event = await parseWebhook(
      transport,
      fakeContext(),
      callback({
        conversationId: PAY_ID,
        paymentId: "iyzico-pay-9",
        conversationData: "cd-abc",
        mdStatus: "1",
        status: "success",
      }),
    );
    expect(event.type).toBe("payment.captured");
    if (event.type !== "payment.captured") {
      throw new Error("expected captured");
    }
    expect(event.paymentId).toBe(PAY_ID);
    expect(event.gatewayReference).toBe("iyzico-pay-9");
    expect(event.amount).toEqual(money(10_050, "TRY"));

    const call = calls[0];
    if (!call) {
      throw new Error("expected a finalize call");
    }
    expect(call.url).toBe("https://sandbox-api.iyzipay.com/payment/3dsecure/auth");
    const body = JSON.parse(call.body);
    expect(body.paymentId).toBe("iyzico-pay-9");
    expect(body.conversationData).toBe("cd-abc");
  });

  test("finalize definite failure → payment.failed", async () => {
    const { transport } = harness(
      { status: "failure", errorCode: "10051", errorMessage: "Insufficient funds" },
      200,
      { "10051": { code: "declined" } },
    );
    const event = await parseWebhook(
      transport,
      fakeContext(),
      callback({
        conversationId: PAY_ID,
        paymentId: "p",
        conversationData: "cd",
        mdStatus: "1",
        status: "success",
      }),
    );
    expect(event.type).toBe("payment.failed");
  });

  test("finalize transient failure throws, leaving the payment for reconciliation", async () => {
    const { transport } = harness({ message: "gateway down" }, 503);
    await expect(
      parseWebhook(
        transport,
        fakeContext(),
        callback({
          conversationId: PAY_ID,
          paymentId: "p",
          conversationData: "cd",
          mdStatus: "1",
          status: "success",
        }),
      ),
    ).rejects.toThrow();
  });

  test("rejects a callback whose conversationId is not a payment id", async () => {
    const { transport } = harness({});
    await expect(
      parseWebhook(
        transport,
        fakeContext(),
        callback({ conversationId: "not-a-payment-id", paymentId: "p", mdStatus: "1" }),
      ),
    ).rejects.toThrow();
  });
});
