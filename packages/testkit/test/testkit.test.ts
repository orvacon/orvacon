import { describe, expect, test } from "bun:test";
import { type Card, idempotencyKey, money, orvacon } from "@orvacon/paykit";
import {
  type MockConnectorOptions,
  mockCallback,
  mockConnector,
  mockDatabase,
  mockReconcile,
  testCards,
  testSigningKey,
  testToken,
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
  test("authorize → capture → refund walks the lifecycle, with a chained ledger", async () => {
    const { db, orva } = setup();

    const authorized = await orva.authorize({
      idempotencyKey: idempotencyKey("k-auth"),
      amount: money(1499, "TRY"),
      source: from(testCards.success),
    });
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

    // Each transition appends a chained debit/credit pair.
    expect(db.ledger.length).toBeGreaterThanOrEqual(2);
    for (let i = 1; i < db.ledger.length; i++) {
      expect(db.ledger[i]?.prevHash).toBe(db.ledger[i - 1]?.hash);
    }
  });

  test("a token source authorizes", async () => {
    const { orva } = setup();
    const outcome = await orva.authorize({
      idempotencyKey: idempotencyKey("k-token"),
      amount: money(1000, "TRY"),
      source: { type: "token", token: testToken },
    });
    expect(outcome.ok && outcome.status).toBe("authorized");
  });

  test("a declined card fails before settlement", async () => {
    const { orva } = setup();
    const outcome = await orva.authorize({
      idempotencyKey: idempotencyKey("k-decline"),
      amount: money(1000, "TRY"),
      source: from(testCards.declined),
    });
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) expect(outcome.error.code).toBe("declined");
  });

  test("a gateway-error card surfaces the retry class", async () => {
    const { orva } = setup();
    const outcome = await orva.authorize({
      idempotencyKey: idempotencyKey("k-gwerr"),
      amount: money(1000, "TRY"),
      source: from(testCards.gatewayError),
    });
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) expect(outcome.error.code).toBe("gateway_error");
  });

  test("3-D Secure returns requires_action, then mockCallback settles it", async () => {
    const { db, orva } = setup();
    const challenge = await orva.authorize({
      idempotencyKey: idempotencyKey("k-3ds"),
      amount: money(2500, "TRY"),
      source: from(testCards.success),
      threeDSecure: true,
    });
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

  test("partial then full refund walks captured → partially_refunded → refunded", async () => {
    const { db, orva } = setup();
    const authorized = await orva.authorize({
      idempotencyKey: idempotencyKey("k-pr-auth"),
      amount: money(10_000, "TRY"),
      source: from(testCards.success),
    });
    if (!authorized.ok) throw new Error(authorized.error.message);
    const { paymentId } = authorized;
    await orva.capture({ idempotencyKey: idempotencyKey("k-pr-cap"), paymentId });

    const partial = await orva.refund({
      idempotencyKey: idempotencyKey("k-pr-r1"),
      paymentId,
      amount: money(3_000, "TRY"),
    });
    expect(partial.ok).toBe(true);
    expect(db.payments.get(paymentId)?.status).toBe("partially_refunded");

    const rest = await orva.refund({ idempotencyKey: idempotencyKey("k-pr-r2"), paymentId });
    expect(rest.ok).toBe(true);
    expect(db.payments.get(paymentId)?.status).toBe("refunded");
  });

  test("storeCard vaults a card and deleteCard forgets it", async () => {
    const { orva } = setup();
    const stored = await orva.storeCard({ card: testCards.success });
    if (!stored.ok) throw new Error(stored.error.message);
    expect(stored.card.last4).toBe("1111");
    expect(stored.card.token.token).toContain("mock_tok_");

    const deleted = await orva.deleteCard({ token: stored.card.token });
    expect(deleted.ok).toBe(true);
  });

  test("reconcile settles a payment the gateway already captured", async () => {
    const { db, orva } = setup({
      reconcile: (input) =>
        mockReconcile({
          paymentId: input.paymentId,
          type: "payment.captured",
          amount: money(2500, "TRY"),
        }),
    });
    const challenge = await orva.authorize({
      idempotencyKey: idempotencyKey("k-rec-ok"),
      amount: money(2500, "TRY"),
      source: from(testCards.success),
      threeDSecure: true,
    });
    if (!challenge.ok) throw new Error(challenge.error.message);
    const { paymentId } = challenge;
    expect(db.payments.get(paymentId)?.status).toBe("requires_action");

    const result = await orva.reconcile(paymentId);
    expect(result.ok && result.resolved).toBe(true);
    expect(db.payments.get(paymentId)?.status).toBe("captured");
  });

  test("reconcile leaves a still-pending payment untouched (default)", async () => {
    const { db, orva } = setup();
    const challenge = await orva.authorize({
      idempotencyKey: idempotencyKey("k-rec-pending"),
      amount: money(700, "TRY"),
      source: from(testCards.success),
      threeDSecure: true,
    });
    if (!challenge.ok) throw new Error(challenge.error.message);
    const { paymentId } = challenge;

    const result = await orva.reconcile(paymentId);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.resolved).toBe(false);
    }
    expect(db.payments.get(paymentId)?.status).toBe("requires_action");
  });

  test("a replayed idempotency key returns the original outcome, not a second charge", async () => {
    const { db, orva } = setup();
    const request = {
      idempotencyKey: idempotencyKey("k-replay"),
      amount: money(500, "TRY"),
      source: from(testCards.success),
    } as const;
    const first = await orva.authorize(request);
    const second = await orva.authorize(request);
    expect(second).toEqual(first);
    expect(db.payments.size).toBe(1);
  });
});
