import { describe, expect, test } from "bun:test";
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
  addMoney,
  assertTransition,
  canTransition,
  compareMoney,
  generatePaymentId,
  idempotencyKey,
  money,
  type OperationOutcome,
  orvacon,
  type PaymentId,
  paymentId,
  subtractMoney,
} from "../src/index";
import { memoryAdapter } from "./memory-adapter";

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
};

function fakeConnector(
  overrides: Partial<ConnectorCapabilities> = {},
  behavior: {
    authorize?: (input: AuthorizeInput) => ConnectorResult;
    webhookEvent?: () => NormalizedEvent;
  } = {},
): FakeConnector {
  const calls = { authorize: 0, capture: 0, refund: 0 };
  return {
    id: "fake",
    version: "0.0.0",
    capabilities: { ...CAPABILITIES, ...overrides },
    calls,
    async authorize(_ctx: ConnectorContext, input: AuthorizeInput): Promise<ConnectorResult> {
      calls.authorize++;
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
      webhookSigningKey: "test-key",
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
});
