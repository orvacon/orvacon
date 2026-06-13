import { describe, expect, test } from "bun:test";
import { toBase64, toBytes } from "@orvacon/cryptokit";
import { generatePaymentId, money } from "@orvacon/paykit";
import type { Address, AuthorizeInput, ConnectorContext } from "@orvacon/paykit/connector";
import { authorize } from "../src/authorize";
import { resolveIyzicoConfig } from "../src/config";
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

function parsedBody(calls: { url: string; body: string }[], index: number) {
  const call = calls[index];
  if (!call) {
    throw new Error(`expected a gateway call at index ${index}`);
  }
  return JSON.parse(call.body);
}

const ADDRESS: Address = {
  contactName: "Ada Lovelace",
  address: "1 Analytical St",
  city: "Istanbul",
  country: "TR",
};

function validInput(overrides: Partial<AuthorizeInput> = {}): AuthorizeInput {
  return {
    paymentId: generatePaymentId(),
    amount: money(10_000, "TRY"),
    source: {
      type: "card",
      card: {
        number: "4111111111111111",
        expiryMonth: "12",
        expiryYear: "2030",
        cvc: "123",
        holderName: "Ada Lovelace",
      },
    },
    threeDSecure: true,
    callbackUrl: "https://shop.test/callback",
    buyer: {
      name: "Ada",
      surname: "Lovelace",
      email: "ada@example.test",
      nationalId: "11111111111",
      phone: "+905350000000",
      address: "1 Analytical St",
      city: "Istanbul",
      country: "TR",
    },
    billingAddress: ADDRESS,
    basket: [
      { referenceId: "sku-1", name: "Widget", price: money(10_000, "TRY"), type: "physical" },
    ],
    ...overrides,
  };
}

const challengeHtml = "<html>3ds</html>";
const threeDsSuccess = {
  status: "success",
  locale: "en",
  systemTime: 1722246017090,
  conversationId: "conv-1",
  paymentId: "iyzico-pay-123",
  signature: "sig",
  threeDSHtmlContent: toBase64(toBytes(challengeHtml)),
};

describe("iyzico authorize — 3DS", () => {
  test("returns requires_action with the decoded challenge HTML and maps the request", async () => {
    const { transport, calls } = harness(threeDsSuccess);
    const result = await authorize(transport, fakeContext(), validInput());

    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error("expected success");
    }
    expect(result.status).toBe("requires_action");
    expect(result.gatewayReference).toBe("iyzico-pay-123");
    if (result.action?.type !== "html") {
      throw new Error("expected an html action");
    }
    expect(result.action.content).toBe(challengeHtml);

    const body = parsedBody(calls, 0);
    expect(calls[0]?.url).toBe("https://sandbox-api.iyzipay.com/payment/3dsecure/initialize");
    expect(body.price).toBe("100.0");
    expect(body.currency).toBe("TRY");
    expect(body.paymentCard.cardNumber).toBe("4111111111111111");
    // nationalId → Iyzico's identityNumber; phone → gsmNumber (concept, not field name)
    expect(body.buyer.identityNumber).toBe("11111111111");
    expect(body.buyer.gsmNumber).toBe("+905350000000");
    expect(body.billingAddress.contactName).toBe("Ada Lovelace");
    expect(body.basketItems[0].itemType).toBe("PHYSICAL");
    expect(body.basketItems[0].category1).toBe("General");
    expect(body.basketItems[0].price).toBe("100.0");
  });

  test("maps the token (stored-card) flow to cardToken", async () => {
    const { transport, calls } = harness(threeDsSuccess);
    await authorize(transport, fakeContext(), {
      ...validInput(),
      source: { type: "token", token: { token: "tok_abc" } },
    });
    expect(parsedBody(calls, 0).paymentCard.cardToken).toBe("tok_abc");
  });

  test("derives itemType from the shipping address when BasketItem.type is absent", async () => {
    const { transport, calls } = harness(threeDsSuccess);
    await authorize(transport, fakeContext(), {
      ...validInput(),
      basket: [{ referenceId: "s", name: "W", price: money(10_000, "TRY") }],
      shippingAddress: undefined,
    });
    expect(parsedBody(calls, 0).basketItems[0].itemType).toBe("VIRTUAL");

    await authorize(transport, fakeContext(), {
      ...validInput(),
      basket: [{ referenceId: "s", name: "W", price: money(10_000, "TRY") }],
      shippingAddress: ADDRESS,
    });
    expect(parsedBody(calls, 1).basketItems[0].itemType).toBe("PHYSICAL");
  });

  test("propagates a gateway failure envelope as a connector error", async () => {
    const { transport } = harness({
      status: "failure",
      errorCode: "5",
      errorMessage: "Invalid card",
    });
    const result = await authorize(transport, fakeContext(), validInput());
    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error("expected failure");
    }
    expect(result.error.code).toBe("unknown");
    expect(result.error.message).toBe("Invalid card");
  });
});

describe("iyzico authorize — validation (before the gateway)", () => {
  test("names the missing required buyer field", async () => {
    const { transport, calls } = harness(threeDsSuccess);
    const result = await authorize(transport, fakeContext(), {
      ...validInput(),
      buyer: {
        name: "Ada",
        surname: "Lovelace",
        email: "ada@example.test",
        phone: "+905350000000",
        address: "1 Analytical St",
        city: "Istanbul",
        country: "TR",
      },
    });
    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error("expected failure");
    }
    expect(result.error.code).toBe("invalid_request");
    expect(result.error.message).toContain("buyer.nationalId");
    expect(calls).toHaveLength(0);
  });

  test("rejects when the basket total does not equal the amount", async () => {
    const { transport, calls } = harness(threeDsSuccess);
    const result = await authorize(transport, fakeContext(), {
      ...validInput(),
      basket: [{ referenceId: "s", name: "W", price: money(5_000, "TRY"), type: "physical" }],
    });
    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error("expected failure");
    }
    expect(result.error.code).toBe("invalid_request");
    expect(result.error.message).toContain("total");
    expect(calls).toHaveLength(0);
  });
});

describe("iyzico authorize — direct (non-3DS)", () => {
  test("maps a completed auth to captured and posts to /payment/auth", async () => {
    const { transport, calls } = harness({ status: "success", paymentId: "iyzico-pay-9" });
    const result = await authorize(transport, fakeContext(), {
      ...validInput(),
      threeDSecure: false,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error("expected success");
    }
    expect(result.status).toBe("captured");
    expect(result.gatewayReference).toBe("iyzico-pay-9");
    expect(calls[0]?.url).toBe("https://sandbox-api.iyzipay.com/payment/auth");
  });
});
