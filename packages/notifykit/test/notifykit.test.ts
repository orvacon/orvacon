import { describe, expect, test } from "bun:test";
import { type Card, idempotencyKey, money, orvacon } from "@orvacon/paykit";
import { mockConnector, mockDatabase, testCards, testSigningKey } from "@orvacon/testkit";
import { type NotifyEvent, notifykit } from "../src/index";

function setup(onError?: (e: Error) => void, notify?: () => void) {
  const seen: NotifyEvent[] = [];
  const db = mockDatabase();
  const orva = orvacon({
    database: db,
    connectors: [mockConnector({ capabilities: { autoCapture: true } })],
    webhookSigningKey: testSigningKey,
    onError,
    plugins: [
      notifykit({
        notify: (event) => {
          if (notify) {
            notify();
          } else {
            seen.push(event);
          }
        },
      }),
    ],
  });
  return { seen, orva };
}

const buy = (orva: ReturnType<typeof setup>["orva"], key: string, card: Card = testCards.success) =>
  orva.authorize({
    idempotencyKey: idempotencyKey(key),
    amount: money(1_000, "TRY"),
    source: { type: "card", card },
  });

describe("notifykit", () => {
  test("notifies on capture", async () => {
    const { seen, orva } = setup();
    await buy(orva, "k-cap");
    expect(seen).toContain("captured");
  });

  test("notifies on a failed charge", async () => {
    const { seen, orva } = setup();
    await buy(orva, "k-fail", testCards.declined);
    expect(seen).toContain("failed");
  });

  test("notifies on refund", async () => {
    const { seen, orva } = setup();
    const outcome = await buy(orva, "k-ref");
    if (!outcome.ok) {
      throw new Error(outcome.error.message);
    }
    await orva.refund({ idempotencyKey: idempotencyKey("k-ref-r"), paymentId: outcome.paymentId });
    expect(seen).toContain("refunded");
  });

  test("a throwing notify is reported, never breaks the payment", async () => {
    const errors: Error[] = [];
    const { orva } = setup(
      (e) => errors.push(e),
      () => {
        throw new Error("smtp down");
      },
    );
    const outcome = await buy(orva, "k-boom");
    expect(outcome.ok).toBe(true);
    expect(errors.some((e) => e.message.includes("smtp down"))).toBe(true);
  });
});
