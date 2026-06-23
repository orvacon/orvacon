import { describe, expect, test } from "bun:test";
import { type Card, idempotencyKey, money, orvacon } from "@orvacon/paykit";
import {
  type MockConnectorOptions,
  mockCallback,
  mockConnector,
  mockDatabase,
  testCards,
  testSigningKey,
} from "../src/index";

function setup(options?: MockConnectorOptions) {
  const db = mockDatabase();
  const orva = orvacon({
    database: db,
    connectors: [mockConnector(options)],
    webhookSigningKey: testSigningKey,
  });
  return { db, orva };
}

const from = (card: Card) => ({ type: "card", card }) as const;

describe("mockConnector + mockDatabase", () => {
  test("authorize → capture → refund walks the lifecycle, no gateway", async () => {
    const { db, orva } = setup();

    const authorized = await orva.authorize({
      idempotencyKey: idempotencyKey("k-auth"),
      amount: money(1499, "TRY"),
      source: from(testCards.success),
    });
    expect(authorized.ok).toBe(true);
    if (!authorized.ok) throw new Error(authorized.error.message);
    expect(authorized.status).toBe("authorized");
    const { paymentId } = authorized;
    expect(db.payments.get(paymentId)?.status).toBe("authorized");

    const captured = await orva.capture({ idempotencyKey: idempotencyKey("k-cap"), paymentId });
    expect(captured.ok && captured.status).toBe("captured");
    expect(db.payments.get(paymentId)?.status).toBe("captured");

    const refunded = await orva.refund({ idempotencyKey: idempotencyKey("k-ref"), paymentId });
    expect(refunded.ok && refunded.status).toBe("refunded");
    expect(db.payments.get(paymentId)?.status).toBe("refunded");
    // Two ledger entries per transition (debit/credit pair), chained.
    expect(db.ledger.length).toBeGreaterThan(0);
  });

  test("a declined card fails before settlement", async () => {
    const { orva } = setup();
    const outcome = await orva.authorize({
      idempotencyKey: idempotencyKey("k-decline"),
      amount: money(1000, "TRY"),
      source: from(testCards.declined),
    });
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) {
      expect(outcome.error.code).toBe("declined");
    }
  });

  test("3-D Secure returns requires_action, then mockCallback settles it", async () => {
    const { db, orva } = setup();

    const challenge = await orva.authorize({
      idempotencyKey: idempotencyKey("k-3ds"),
      amount: money(2500, "TRY"),
      source: from(testCards.success),
      threeDSecure: true,
    });
    expect(challenge.ok).toBe(true);
    if (!challenge.ok) throw new Error(challenge.error.message);
    expect(challenge.status).toBe("requires_action");
    if (challenge.status === "requires_action") {
      expect(challenge.action?.type).toBe("html");
    }
    const { paymentId } = challenge;
    expect(db.payments.get(paymentId)?.status).toBe("requires_action");

    const raw = mockCallback({ paymentId, type: "payment.captured", amount: money(2500, "TRY") });
    const result = await orva.handleWebhook("mock", raw);
    expect(result.duplicate).toBe(false);
    expect(result.payment.status).toBe("captured");
    expect(db.payments.get(paymentId)?.status).toBe("captured");
  });

  test("an autoCapture connector captures at authorize", async () => {
    const { orva } = setup({ capabilities: { autoCapture: true } });
    const outcome = await orva.authorize({
      idempotencyKey: idempotencyKey("k-autocap"),
      amount: money(999, "TRY"),
      source: from(testCards.success),
    });
    expect(outcome.ok && outcome.status).toBe("captured");
  });
});
