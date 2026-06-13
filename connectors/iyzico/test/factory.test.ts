import { describe, expect, test } from "bun:test";
import { generatePaymentId } from "@orvacon/paykit";
import type { ConnectorContext } from "@orvacon/paykit/connector";
import { iyzico } from "../src/index";

function fakeContext(): ConnectorContext {
  return {
    signal: new AbortController().signal,
    logger: { debug() {}, info() {}, warn() {}, error() {} },
    classifyError: (rawCode, codes) => codes?.[rawCode]?.code ?? "unknown",
  };
}

describe("iyzico() factory", () => {
  test("builds a registerable connector with the verified capabilities", () => {
    const connector = iyzico({ apiKey: "sandbox-x", secretKey: "sandbox-y" });
    expect(connector.id).toBe("iyzico");
    expect(connector.capabilities.autoCapture).toBe(true);
    expect(connector.capabilities.partialCapture).toBe(false);
    expect(connector.capabilities.partialRefund).toBe(true);
    expect(connector.capabilities.signatureEncoding).toBe("hex");
    expect(connector.capabilities.threeDSecure).toBe("html");
    expect(connector.capabilities.callbackUrl).toBe("api");
    expect(typeof connector.authorize).toBe("function");
    expect(typeof connector.refund).toBe("function");
    expect(typeof connector.parseWebhook).toBe("function");
    expect(connector.$ERROR_CODES?.["10051"]?.code).toBe("declined");
    expect(connector.$ERROR_CODES?.["1000"]?.code).toBe("auth_error");
  });

  test("fails fast on missing credentials", () => {
    expect(() => iyzico({ apiKey: "", secretKey: "y" })).toThrow(TypeError);
    expect(() => iyzico({ apiKey: "x", secretKey: "" })).toThrow(TypeError);
  });

  test("capture is a declared boundary — auto-capture, no separate capture", async () => {
    const connector = iyzico({ apiKey: "sandbox-x", secretKey: "sandbox-y" });
    const result = await connector.capture(fakeContext(), {
      paymentId: generatePaymentId(),
      gatewayReference: "gw-1",
    });
    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error("expected capture to be rejected");
    }
    expect(result.error.code).toBe("invalid_request");
  });
});
