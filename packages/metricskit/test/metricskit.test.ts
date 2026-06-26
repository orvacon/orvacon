import { describe, expect, test } from "bun:test";
import { idempotencyKey, money, orvacon } from "@orvacon/paykit";
import { mockConnector, mockDatabase, testCards, testSigningKey } from "@orvacon/testkit";
import { metricskit } from "../src/index";

function setup(prefix?: string) {
  const calls: { name: string; tags?: Record<string, string> }[] = [];
  const orva = orvacon({
    database: mockDatabase(),
    connectors: [mockConnector({ capabilities: { autoCapture: true } })],
    webhookSigningKey: testSigningKey,
    plugins: [metricskit({ sink: { inc: (name, tags) => calls.push({ name, tags }) }, prefix })],
  });
  return { calls, orva };
}

const buy = (orva: ReturnType<typeof setup>["orva"], key: string, card = testCards.success) =>
  orva.authorize({
    idempotencyKey: idempotencyKey(key),
    amount: money(1_000, "TRY"),
    source: { type: "card", card },
  });

describe("metricskit", () => {
  test("counts a capture, tagged with currency and connector", async () => {
    const { calls, orva } = setup();
    await buy(orva, "k-cap");
    const captured = calls.find((c) => c.name === "orvacon.payment.captured");
    expect(captured).toBeDefined();
    expect(captured?.tags).toEqual({ currency: "TRY", connector: "mock" });
  });

  test("counts a failed charge", async () => {
    const { calls, orva } = setup();
    await buy(orva, "k-fail", testCards.declined);
    expect(calls.some((c) => c.name === "orvacon.payment.failed")).toBe(true);
  });

  test("honors a custom prefix", async () => {
    const { calls, orva } = setup("acme");
    await buy(orva, "k-prefix");
    expect(calls.some((c) => c.name === "acme.payment.captured")).toBe(true);
  });
});
