import { describe, expect, test } from "bun:test";
import { parsePublicKey, parseSecretKey, verifyWebhook } from "@orvacon/cryptokit";
import type {
  AuthorizeInput,
  ConnectorCapabilities,
  ConnectorContext,
  ConnectorResult,
  NormalizedEvent,
  OrvaconConnector,
  RawWebhook,
} from "../src/connector";
import {
  createWebhookDeliverer,
  WEBHOOK_ID_HEADER,
  WEBHOOK_SIGNATURE_HEADER,
  WEBHOOK_TIMESTAMP_HEADER,
  type WebhookEvent,
} from "../src/delivery";
import {
  type Address,
  addMoney,
  assertTransition,
  type BasketItem,
  type Buyer,
  canTransition,
  compareMoney,
  eventId,
  generateEventId,
  generatePaymentId,
  idempotencyKey,
  money,
  type OperationOutcome,
  orvacon,
  type Payment,
  type PaymentId,
  paymentId,
  type RetryConfig,
  subtractMoney,
} from "../src/index";
import { memoryAdapter } from "./memory-adapter";

/** A real Ed25519 pair (cryptokit `generateSigningKeyPair`); the secret feeds `webhookSigningKey`, the public verifies deliveries. */
const SIGNING_KEY = "orvsk_VvAbgdbdEscGzduADGtBo0dJF-apyQNky5VL3gr9uyg";
const PUBLIC_KEY = "orvpk_h4B42ib_eqdmilRcRQ5I_wgNHclPulgkBz2CJQRX7Ck";

const CAPABILITIES = {
  signatureEncoding: "hex",
  callbackUrl: "api",
  threeDSecure: "html",
  webhookResponse: "standard",
  partialCapture: false,
  partialRefund: true,
  fraudStatus: true,
  autoCapture: true,
} satisfies ConnectorCapabilities;

type FakeConnector = OrvaconConnector & {
  calls: { authorize: number; capture: number; refund: number };
  authorizeInputs: AuthorizeInput[];
};

function fakeConnector(
  overrides: Partial<ConnectorCapabilities> = {},
  behavior: {
    authorize?: (input: AuthorizeInput) => ConnectorResult;
    webhookEvent?: () => NormalizedEvent;
  } = {},
): FakeConnector {
  const calls = { authorize: 0, capture: 0, refund: 0 };
  const authorizeInputs: AuthorizeInput[] = [];
  return {
    id: "fake",
    version: "0.0.0",
    capabilities: { ...CAPABILITIES, ...overrides },
    calls,
    authorizeInputs,
    async authorize(_ctx: ConnectorContext, input: AuthorizeInput): Promise<ConnectorResult> {
      calls.authorize++;
      authorizeInputs.push(input);
      return (
        behavior.authorize?.(input) ?? {
          ok: true,
          status: "captured",
          gatewayReference: `gw-${input.paymentId}`,
          raw: {},
        }
      );
    },
    async capture(): Promise<ConnectorResult> {
      calls.capture++;
      return { ok: true, status: "captured", raw: {} };
    },
    async refund(): Promise<ConnectorResult> {
      calls.refund++;
      return { ok: true, status: "refunded", raw: {} };
    },
    async parseWebhook(): Promise<NormalizedEvent> {
      const event = behavior.webhookEvent?.();
      if (!event) {
        throw new Error("no webhook behavior configured");
      }
      return event;
    },
  };
}

function instance(connector: OrvaconConnector, db = memoryAdapter()) {
  return {
    db,
    pay: orvacon({
      database: db,
      connectors: [connector],
      webhookSigningKey: SIGNING_KEY,
    }),
  };
}

function requirePaymentId(outcome: OperationOutcome): PaymentId {
  if (!outcome.paymentId) {
    throw new Error("expected outcome.paymentId");
  }
  return outcome.paymentId;
}

describe("money", () => {
  test("rejects floats, negatives, bad currency", () => {
    expect(() => money(10.5, "TRY")).toThrow(TypeError);
    expect(() => money(-1, "TRY")).toThrow(TypeError);
    expect(() => money(100, "TURKLIRA")).toThrow(TypeError);
  });

  test("arithmetic preserves currency safety", () => {
    const a = money(1000, "TRY");
    const b = money(300, "TRY");
    expect(subtractMoney(a, b)).toEqual(money(700, "TRY"));
    expect(addMoney(a, b)).toEqual(money(1300, "TRY"));
    expect(compareMoney(b, a)).toBe(-1);
    expect(() => subtractMoney(b, a)).toThrow(TypeError);
    expect(() => addMoney(a, money(1, "USD"))).toThrow(TypeError);
  });
});

describe("state machine", () => {
  test("permits and forbids the documented transitions", () => {
    expect(canTransition("created", "authorized")).toBe(true);
    expect(canTransition("captured", "partially_refunded")).toBe(true);
    expect(canTransition("partially_refunded", "refunded")).toBe(true);
    expect(canTransition("refunded", "authorized")).toBe(false);
    expect(() => assertTransition("refunded", "authorized")).toThrow();
  });
});

describe("ids", () => {
  test("generates prefixed ULIDs and validates format", () => {
    const id = generatePaymentId();
    expect(id.startsWith("pay_")).toBe(true);
    expect(id).toHaveLength(30);
    expect(() => paymentId("not-an-id")).toThrow(TypeError);
    expect(paymentId(id)).toBe(id);
  });

  test("generates evt_ ids and validates format", () => {
    const id = generateEventId();
    expect(id.startsWith("evt_")).toBe(true);
    expect(id).toHaveLength(30);
    expect(() => eventId("evt_short")).toThrow(TypeError);
    expect(eventId(id)).toBe(id);
  });
});

describe("authorize", () => {
  test("happy path persists, writes a chained ledger pair, completes the key", async () => {
    const connector = fakeConnector();
    const { db, pay } = instance(connector);
    const outcome = await pay.authorize({
      idempotencyKey: idempotencyKey("k-1"),
      amount: money(10_000, "TRY"),
      source: { type: "token", token: { token: "tok_1" } },
    });
    expect(outcome.result.ok).toBe(true);
    const stored = db.payments.get(requirePaymentId(outcome));
    expect(stored?.status).toBe("captured");
    expect(db.ledger).toHaveLength(2);
    expect(db.ledger[0]?.prevHash).toBe("0".repeat(64));
    expect(db.ledger[1]?.prevHash).toBe(db.ledger[0]?.hash);
    expect(db.idempotency.get("k-1")?.status).toBe("completed");
  });

  test("forwards buyer, addresses, and basket through to the connector", async () => {
    const connector = fakeConnector();
    const { pay } = instance(connector);
    const buyer: Buyer = {
      name: "Ada",
      surname: "Lovelace",
      email: "ada@example.test",
      nationalId: "11111111111",
    };
    const billingAddress: Address = {
      contactName: "Ada Lovelace",
      address: "1 Analytical St",
      city: "Istanbul",
      country: "TR",
    };
    const basket: BasketItem[] = [
      { referenceId: "sku-1", name: "Widget", price: money(10_000, "TRY"), type: "virtual" },
    ];
    await pay.authorize({
      idempotencyKey: idempotencyKey("k-ctx"),
      amount: money(10_000, "TRY"),
      source: { type: "token", token: { token: "tok" } },
      buyer,
      billingAddress,
      shippingAddress: billingAddress,
      basket,
    });
    const input = connector.authorizeInputs[0];
    if (!input) {
      throw new Error("expected an authorize input");
    }
    expect(input.buyer).toEqual(buyer);
    expect(input.billingAddress).toEqual(billingAddress);
    expect(input.shippingAddress).toEqual(billingAddress);
    expect(input.basket).toEqual(basket);
  });

  test("replaying a completed key returns the stored result without a second gateway call", async () => {
    const connector = fakeConnector();
    const { db, pay } = instance(connector);
    const request = {
      idempotencyKey: idempotencyKey("k-replay"),
      amount: money(5_000, "TRY"),
      source: { type: "token", token: { token: "tok" } },
    } as const;
    const first = await pay.authorize(request);
    const second = await pay.authorize(request);
    expect(connector.calls.authorize).toBe(1);
    expect(second.paymentId).toBe(first.paymentId);
    expect(second.result).toEqual(first.result);
    expect(db.ledger).toHaveLength(2);
  });

  test("an unexpired in-progress key yields a conflict", async () => {
    const connector = fakeConnector();
    const { db, pay } = instance(connector);
    const key = idempotencyKey("k-conflict");
    await db.insertIdempotencyKey({
      key,
      status: "in_progress",
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 60_000).toISOString(),
    });
    const outcome = await pay.authorize({
      idempotencyKey: key,
      amount: money(1_000, "TRY"),
      source: { type: "token", token: { token: "tok" } },
    });
    expect(outcome.result.ok).toBe(false);
    if (!outcome.result.ok) {
      expect(outcome.result.error.code).toBe("conflict");
    }
    expect(connector.calls.authorize).toBe(0);
  });

  test("a stale in-progress key is reclaimed and processed", async () => {
    const connector = fakeConnector();
    const { db, pay } = instance(connector);
    const key = idempotencyKey("k-stale");
    await db.insertIdempotencyKey({
      key,
      status: "in_progress",
      createdAt: new Date(Date.now() - 120_000).toISOString(),
      expiresAt: new Date(Date.now() - 60_000).toISOString(),
    });
    const outcome = await pay.authorize({
      idempotencyKey: key,
      amount: money(1_000, "TRY"),
      source: { type: "token", token: { token: "tok" } },
    });
    expect(outcome.result.ok).toBe(true);
    expect(connector.calls.authorize).toBe(1);
  });

  test("declined authorize moves the payment to failed", async () => {
    const connector = fakeConnector(
      {},
      {
        authorize: () => ({
          ok: false,
          error: { code: "declined", message: "insufficient funds" },
        }),
      },
    );
    const { db, pay } = instance(connector);
    const outcome = await pay.authorize({
      idempotencyKey: idempotencyKey("k-declined"),
      amount: money(1_000, "TRY"),
      source: { type: "token", token: { token: "tok" } },
    });
    expect(outcome.result.ok).toBe(false);
    expect(db.payments.get(requirePaymentId(outcome))?.status).toBe("failed");
    expect(db.ledger).toHaveLength(0);
  });
});

describe("capture", () => {
  test("partial capture is rejected before the gateway when the capability is absent", async () => {
    const connector = fakeConnector(
      { partialCapture: false, autoCapture: false },
      { authorize: () => ({ ok: true, status: "authorized", gatewayReference: "gw", raw: {} }) },
    );
    const { pay } = instance(connector);
    const authorized = await pay.authorize({
      idempotencyKey: idempotencyKey("k-auth"),
      amount: money(10_000, "TRY"),
      source: { type: "token", token: { token: "tok" } },
    });
    const outcome = await pay.capture({
      idempotencyKey: idempotencyKey("k-cap"),
      paymentId: requirePaymentId(authorized),
      amount: money(4_000, "TRY"),
    });
    expect(outcome.result.ok).toBe(false);
    if (!outcome.result.ok) {
      expect(outcome.result.error.code).toBe("invalid_request");
    }
    expect(connector.calls.capture).toBe(0);
  });
});

describe("refund", () => {
  test("partial then full refund walks captured → partially_refunded → refunded", async () => {
    const connector = fakeConnector();
    const { db, pay } = instance(connector);
    const authorized = await pay.authorize({
      idempotencyKey: idempotencyKey("k-pay"),
      amount: money(10_000, "TRY"),
      source: { type: "token", token: { token: "tok" } },
    });
    const id = requirePaymentId(authorized);
    const partial = await pay.refund({
      idempotencyKey: idempotencyKey("k-r1"),
      paymentId: id,
      amount: money(3_000, "TRY"),
    });
    expect(partial.result.ok).toBe(true);
    expect(db.payments.get(id)?.status).toBe("partially_refunded");
    expect(db.payments.get(id)?.refundedTotal).toEqual(money(3_000, "TRY"));
    const rest = await pay.refund({
      idempotencyKey: idempotencyKey("k-r2"),
      paymentId: id,
    });
    expect(rest.result.ok).toBe(true);
    expect(db.payments.get(id)?.status).toBe("refunded");
    expect(db.payments.get(id)?.refundedTotal).toEqual(money(10_000, "TRY"));
    expect(db.ledger).toHaveLength(6);
    for (let i = 1; i < db.ledger.length; i++) {
      expect(db.ledger[i]?.prevHash).toBe(db.ledger[i - 1]?.hash);
    }
  });

  test("over-refund is rejected before the gateway", async () => {
    const connector = fakeConnector();
    const { pay } = instance(connector);
    const authorized = await pay.authorize({
      idempotencyKey: idempotencyKey("k-pay2"),
      amount: money(1_000, "TRY"),
      source: { type: "token", token: { token: "tok" } },
    });
    const outcome = await pay.refund({
      idempotencyKey: idempotencyKey("k-over"),
      paymentId: requirePaymentId(authorized),
      amount: money(2_000, "TRY"),
    });
    expect(outcome.result.ok).toBe(false);
    expect(connector.calls.refund).toBe(0);
  });
});

describe("handleWebhook", () => {
  test("applies a capture event once and flags the redelivery as duplicate", async () => {
    let eventPaymentId = paymentId(generatePaymentId());
    const connector = fakeConnector(
      { autoCapture: false },
      {
        authorize: () => ({ ok: true, status: "requires_action", gatewayReference: "gw", raw: {} }),
        webhookEvent: () => ({
          type: "payment.captured",
          paymentId: eventPaymentId,
          gatewayReference: "gw",
          amount: money(10_000, "TRY"),
          occurredAt: new Date().toISOString(),
          raw: {},
        }),
      },
    );
    const { db, pay } = instance(connector);
    const authorized = await pay.authorize({
      idempotencyKey: idempotencyKey("k-3ds"),
      amount: money(10_000, "TRY"),
      source: { type: "token", token: { token: "tok" } },
      threeDSecure: true,
    });
    eventPaymentId = requirePaymentId(authorized);
    expect(db.payments.get(eventPaymentId)?.status).toBe("requires_action");
    const raw = { headers: {}, body: "{}" } satisfies RawWebhook;
    const first = await pay.handleWebhook("fake", raw);
    expect(first.duplicate).toBe(false);
    expect(first.payment.status).toBe("captured");
    expect(db.ledger).toHaveLength(2);
    const second = await pay.handleWebhook("fake", raw);
    expect(second.duplicate).toBe(true);
    expect(db.ledger).toHaveLength(2);
  });
});

describe("config validation", () => {
  test("fails fast on missing pieces", () => {
    const db = memoryAdapter();
    expect(() => orvacon({ database: db, connectors: [], webhookSigningKey: "k" })).toThrow(
      TypeError,
    );
    expect(() =>
      orvacon({
        database: db,
        connectors: [fakeConnector()],
        webhookSigningKey: "",
      }),
    ).toThrow(TypeError);
    expect(() =>
      orvacon({
        database: db,
        connectors: [fakeConnector(), fakeConnector()],
        webhookSigningKey: "k",
      }),
    ).toThrow(TypeError);
  });

  test("rejects a malformed signing key at construction, not at first payment", () => {
    const db = memoryAdapter();
    expect(() =>
      orvacon({
        database: db,
        connectors: [fakeConnector()],
        webhookSigningKey: "not-an-orvsk-key",
      }),
    ).toThrow(TypeError);
  });

  test("rejects a non-http(s) or unparseable webhookUrl", () => {
    const db = memoryAdapter();
    for (const webhookUrl of ["ftp://example.test/hook", "not a url"]) {
      expect(() =>
        orvacon({
          database: db,
          connectors: [fakeConnector()],
          webhookSigningKey: SIGNING_KEY,
          webhookUrl,
        }),
      ).toThrow(TypeError);
    }
  });

  test("accepts a valid https webhookUrl", () => {
    const db = memoryAdapter();
    expect(() =>
      orvacon({
        database: db,
        connectors: [fakeConnector()],
        webhookSigningKey: SIGNING_KEY,
        webhookUrl: "https://example.test/orva/webhook",
      }),
    ).not.toThrow();
  });
});

describe("webhook delivery", () => {
  const silentLogger = {
    debug() {},
    info() {},
    warn() {},
    error() {},
  };
  const FIXED_NOW = 1_700_000_000_000;

  function samplePayment(): Payment {
    return {
      id: generatePaymentId(FIXED_NOW),
      status: "captured",
      amount: money(10_000, "TRY"),
      connectorId: "fake",
      gatewayReference: "gw-ref-1",
      createdAt: new Date(FIXED_NOW).toISOString(),
      updatedAt: new Date(FIXED_NOW).toISOString(),
    };
  }

  function sampleEvent(payment: Payment): NormalizedEvent {
    return {
      type: "payment.captured",
      paymentId: payment.id,
      gatewayReference: "gw-ref-1",
      amount: money(10_000, "TRY"),
      occurredAt: new Date(FIXED_NOW).toISOString(),
      raw: { secret: "do-not-leak", big: "x".repeat(50) },
    };
  }

  function headerValue(headers: Headers, name: string): string {
    const value = headers.get(name);
    if (value === null) {
      throw new Error(`missing header ${name}`);
    }
    return value;
  }

  function harness(
    responses: Array<number | "throw">,
    opts: { retry?: RetryConfig; random?: () => number } = {},
  ) {
    const requests: { headers: Headers; body: string }[] = [];
    const delays: number[] = [];
    const errors: unknown[] = [];
    const fetchImpl = async (_input: string | URL, init?: RequestInit): Promise<Response> => {
      const status = responses[Math.min(requests.length, responses.length - 1)] ?? 200;
      requests.push({ headers: new Headers(init?.headers), body: String(init?.body) });
      if (status === "throw") {
        throw new Error("network down");
      }
      return new Response(null, { status });
    };
    const deliverer = createWebhookDeliverer({
      url: "https://hook.test/orva",
      secretKey: parseSecretKey(SIGNING_KEY),
      retry: opts.retry,
      timeoutMs: 1_000,
      report: (error) => errors.push(error),
      logger: silentLogger,
      fetch: fetchImpl,
      sleep: async (ms) => {
        delays.push(ms);
      },
      now: () => FIXED_NOW,
      random: opts.random ?? (() => 0),
    });
    return { deliverer, requests, delays, errors };
  }

  test("signs a minimal, raw-free event that verifies against the public key", async () => {
    const payment = samplePayment();
    const { deliverer, requests } = harness([200]);
    deliverer.deliver(payment, sampleEvent(payment));
    await deliverer.idle();

    expect(requests).toHaveLength(1);
    const { headers, body } = requests[0] ?? { headers: new Headers(), body: "" };
    expect(headers.get("content-type")).toBe("application/json");

    const event = JSON.parse(body) as WebhookEvent;
    expect(event.type).toBe("payment.captured");
    expect(event.id.startsWith("evt_")).toBe(true);
    expect(event.data.status).toBe("captured");
    expect(event.data.amount).toEqual(money(10_000, "TRY"));
    expect(event.data.gatewayReference).toBe("gw-ref-1");
    // The gateway's raw payload never leaves the dev's database.
    expect(body).not.toContain("do-not-leak");
    expect("raw" in event).toBe(false);
    expect("raw" in event.data).toBe(false);

    const verification = await verifyWebhook(parsePublicKey(PUBLIC_KEY), {
      id: headerValue(headers, WEBHOOK_ID_HEADER),
      timestamp: Number(headerValue(headers, WEBHOOK_TIMESTAMP_HEADER)),
      payload: body,
      signature: headerValue(headers, WEBHOOK_SIGNATURE_HEADER),
      now: Math.floor(FIXED_NOW / 1000),
    });
    expect(verification.valid).toBe(true);
  });

  test("returns from deliver before the POST, and idle drains it", async () => {
    const payment = samplePayment();
    const { deliverer, requests } = harness([200]);
    deliverer.deliver(payment, sampleEvent(payment));
    // Fire-and-forget: signing is async, so nothing has been sent synchronously.
    expect(requests).toHaveLength(0);
    await deliverer.idle();
    expect(requests).toHaveLength(1);
  });

  test("retries a 500 then succeeds", async () => {
    const payment = samplePayment();
    const { deliverer, requests, delays, errors } = harness([500, 200], { retry: { retries: 3 } });
    deliverer.deliver(payment, sampleEvent(payment));
    await deliverer.idle();
    expect(requests).toHaveLength(2);
    expect(delays).toHaveLength(1);
    expect(errors).toHaveLength(0);
  });

  test("treats a network error as transient and retries", async () => {
    const payment = samplePayment();
    const { deliverer, requests, errors } = harness(["throw", 200], { retry: { retries: 3 } });
    deliverer.deliver(payment, sampleEvent(payment));
    await deliverer.idle();
    expect(requests).toHaveLength(2);
    expect(errors).toHaveLength(0);
  });

  test("does not retry a permanent 4xx and reports the failure", async () => {
    const payment = samplePayment();
    const { deliverer, requests, delays, errors } = harness([400], { retry: { retries: 3 } });
    deliverer.deliver(payment, sampleEvent(payment));
    await deliverer.idle();
    expect(requests).toHaveLength(1);
    expect(delays).toHaveLength(0);
    expect(errors).toHaveLength(1);
  });

  test("gives up after exhausting retries on a persistent 503", async () => {
    const payment = samplePayment();
    const { deliverer, requests, delays, errors } = harness([503], { retry: { retries: 2 } });
    deliverer.deliver(payment, sampleEvent(payment));
    await deliverer.idle();
    expect(requests).toHaveLength(3); // initial attempt + 2 retries
    expect(delays).toHaveLength(2);
    expect(errors).toHaveLength(1);
  });

  test("backoff grows exponentially, scales by jitter, and is clamped to the cap", async () => {
    const payment = samplePayment();
    const { deliverer, delays } = harness([503], {
      retry: { retries: 3, minTimeoutMs: 100, maxTimeoutMs: 250 },
      random: () => 0.5,
    });
    deliverer.deliver(payment, sampleEvent(payment));
    await deliverer.idle();
    // ceilings: min(250,100)=100, min(250,200)=200, min(250,400)=250 → floor(0.5 · ceiling)
    expect(delays).toEqual([50, 100, 125]);
  });

  test("delivers a verifiable webhook end-to-end when webhookUrl is configured", async () => {
    const calls: { url: string; headers: Headers; body: string }[] = [];
    const realFetch = globalThis.fetch;
    const stub = async (input: string | URL, init?: RequestInit): Promise<Response> => {
      calls.push({
        url: String(input),
        headers: new Headers(init?.headers),
        body: String(init?.body),
      });
      return new Response(null, { status: 200 });
    };
    globalThis.fetch = stub as typeof fetch;
    try {
      const db = memoryAdapter();
      const pay = orvacon({
        database: db,
        connectors: [fakeConnector()],
        webhookSigningKey: SIGNING_KEY,
        webhookUrl: "https://example.test/orva/webhook",
      });
      await pay.authorize({
        idempotencyKey: idempotencyKey("k-deliver"),
        amount: money(10_000, "TRY"),
        source: { type: "token", token: { token: "tok" } },
      });
      await pay.drainWebhooks();

      expect(calls).toHaveLength(1);
      const call = calls[0];
      if (!call) {
        throw new Error("expected a delivery");
      }
      expect(call.url).toBe("https://example.test/orva/webhook");
      const event = JSON.parse(call.body) as WebhookEvent;
      expect(event.type).toBe("payment.captured");
      expect(event.data.status).toBe("captured");
      const verification = await verifyWebhook(parsePublicKey(PUBLIC_KEY), {
        id: headerValue(call.headers, WEBHOOK_ID_HEADER),
        timestamp: Number(headerValue(call.headers, WEBHOOK_TIMESTAMP_HEADER)),
        payload: call.body,
        signature: headerValue(call.headers, WEBHOOK_SIGNATURE_HEADER),
      });
      expect(verification.valid).toBe(true);
    } finally {
      globalThis.fetch = realFetch;
    }
  });

  test("does not POST anything when no webhookUrl is configured", async () => {
    let called = 0;
    const realFetch = globalThis.fetch;
    const stub = async (_input: string | URL, _init?: RequestInit): Promise<Response> => {
      called++;
      return new Response(null, { status: 200 });
    };
    globalThis.fetch = stub as typeof fetch;
    try {
      const { pay } = instance(fakeConnector());
      await pay.authorize({
        idempotencyKey: idempotencyKey("k-no-deliver"),
        amount: money(1_000, "TRY"),
        source: { type: "token", token: { token: "tok" } },
      });
      await pay.drainWebhooks();
      expect(called).toBe(0);
    } finally {
      globalThis.fetch = realFetch;
    }
  });
});
