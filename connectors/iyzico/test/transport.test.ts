import { describe, expect, test } from "bun:test";
import type { ConnectorContext, RawError } from "@orvacon/paykit/connector";
import { type IyzicoEnvironment, resolveBaseUrl, resolveIyzicoConfig } from "../src/config";
import { createTransport } from "../src/transport";

function fakeContext(): ConnectorContext {
  return {
    signal: new AbortController().signal,
    logger: { debug() {}, info() {}, warn() {}, error() {} },
    classifyError: (rawCode, codes) => codes?.[rawCode]?.code ?? "unknown",
  };
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

const config = resolveIyzicoConfig({ apiKey: "sandbox-api", secretKey: "sandbox-secret" });

describe("resolveIyzicoConfig", () => {
  test("applies defaults and resolves the sandbox base URL", () => {
    const resolved = resolveIyzicoConfig({ apiKey: "sandbox-x", secretKey: "sandbox-y" });
    expect(resolved.environment).toBe("sandbox");
    expect(resolved.baseUrl).toBe("https://sandbox-api.iyzipay.com");
    expect(typeof resolved.fetch).toBe("function");
  });

  test("resolves the production base URL", () => {
    expect(
      resolveIyzicoConfig({ apiKey: "a", secretKey: "b", environment: "production" }).baseUrl,
    ).toBe("https://api.iyzipay.com");
    expect(resolveBaseUrl("production")).toBe("https://api.iyzipay.com");
  });

  test("throws fail-fast on missing credentials and unknown environments", () => {
    expect(() => resolveIyzicoConfig({ apiKey: "", secretKey: "b" })).toThrow(TypeError);
    expect(() => resolveIyzicoConfig({ apiKey: "a", secretKey: "" })).toThrow(TypeError);
    const badEnv = { apiKey: "a", secretKey: "b", environment: "staging" as IyzicoEnvironment };
    expect(() => resolveIyzicoConfig(badEnv)).toThrow(TypeError);
  });
});

describe("createTransport", () => {
  test("signs the request and sends it to baseUrl + path with JSON headers", async () => {
    const calls: { url: string; init: RequestInit }[] = [];
    const fetchImpl = async (url: string | URL, init?: RequestInit): Promise<Response> => {
      calls.push({ url: String(url), init: init ?? {} });
      return jsonResponse({ status: "success", paymentId: "1" });
    };
    const ctx = fakeContext();
    const request = createTransport({ ...config, fetch: fetchImpl });
    const result = await request(ctx, {
      method: "POST",
      path: "/payment/auth",
      body: { price: "10.5" },
    });

    expect(result.ok).toBe(true);
    const call = calls[0];
    if (!call) {
      throw new Error("expected one fetch call");
    }
    expect(call.url).toBe("https://sandbox-api.iyzipay.com/payment/auth");
    expect(call.init.method).toBe("POST");
    const headers = new Headers(call.init.headers);
    expect(headers.get("authorization")?.startsWith("IYZWSv2 ")).toBe(true);
    expect(headers.get("x-iyzi-rnd")).toBeTruthy();
    expect(headers.get("content-type")).toBe("application/json");
    expect(call.init.body).toBe(JSON.stringify({ price: "10.5" }));
    expect(call.init.signal).toBe(ctx.signal);
  });

  test("returns the parsed body on a success envelope", async () => {
    // Doc-shaped 3DS initialize success: status + base64 threeDSHtmlContent + paymentId.
    const fetchImpl = async (): Promise<Response> =>
      jsonResponse({
        status: "success",
        locale: "en",
        systemTime: 1722246017090,
        conversationId: "conv-1",
        threeDSHtmlContent: "PGh0bWw+PC9odG1sPg==",
        paymentId: "12345",
        signature: "abc",
      });
    const request = createTransport({ ...config, fetch: fetchImpl });
    const result = await request(fakeContext(), {
      method: "POST",
      path: "/payment/auth",
      body: {},
    });
    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error("expected success");
    }
    expect(result.body.paymentId).toBe("12345");
    expect(result.body.threeDSHtmlContent).toBe("PGh0bWw+PC9odG1sPg==");
  });

  test("maps a failure envelope to a classified error via $ERROR_CODES", async () => {
    const errorCodes: Record<string, RawError> = { "10051": { code: "declined" } };
    // Doc-shaped failure envelope: status + errorCode + errorMessage + errorGroup.
    const fetchImpl = async (): Promise<Response> =>
      jsonResponse({
        status: "failure",
        errorCode: "10051",
        errorMessage: "Insufficient funds",
        errorGroup: "NOT_SUFFICIENT_FUNDS",
        conversationId: "conv-2",
      });
    const request = createTransport({ ...config, fetch: fetchImpl }, errorCodes);
    const result = await request(fakeContext(), {
      method: "POST",
      path: "/payment/auth",
      body: {},
    });
    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error("expected failure");
    }
    expect(result.error.code).toBe("declined");
    expect(result.error.message).toBe("Insufficient funds");
    expect(result.error.raw).toBeDefined();
  });

  test("classifies an unmapped failure code as unknown (never auto-retried)", async () => {
    const fetchImpl = async (): Promise<Response> =>
      jsonResponse({ status: "failure", errorCode: "99999", errorMessage: "Unexpected" });
    const request = createTransport({ ...config, fetch: fetchImpl });
    const result = await request(fakeContext(), {
      method: "POST",
      path: "/payment/auth",
      body: {},
    });
    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error("expected failure");
    }
    expect(result.error.code).toBe("unknown");
  });

  test("treats a non-2xx HTTP response as a transient gateway_error", async () => {
    const fetchImpl = async (): Promise<Response> => jsonResponse({ message: "oops" }, 503);
    const request = createTransport({ ...config, fetch: fetchImpl });
    const result = await request(fakeContext(), {
      method: "POST",
      path: "/payment/auth",
      body: {},
    });
    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error("expected failure");
    }
    expect(result.error.code).toBe("gateway_error");
  });

  test("treats a network throw as a transient gateway_error", async () => {
    const fetchImpl = async (): Promise<Response> => {
      throw new Error("ECONNRESET");
    };
    const request = createTransport({ ...config, fetch: fetchImpl });
    const result = await request(fakeContext(), {
      method: "POST",
      path: "/payment/auth",
      body: {},
    });
    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error("expected failure");
    }
    expect(result.error.code).toBe("gateway_error");
    expect(result.error.message).toBe("ECONNRESET");
  });

  test("omits the body for a bodyless request", async () => {
    const calls: RequestInit[] = [];
    const fetchImpl = async (_url: string | URL, init?: RequestInit): Promise<Response> => {
      calls.push(init ?? {});
      return jsonResponse({ status: "success" });
    };
    const request = createTransport({ ...config, fetch: fetchImpl });
    await request(fakeContext(), { method: "POST", path: "/payment/test" });
    expect(calls[0]?.body).toBeUndefined();
  });
});
