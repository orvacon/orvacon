import { describe, expect, test } from "bun:test";
import { idempotencyKey, money, orvacon } from "@orvacon/paykit";
import { mockConnector, mockDatabase, testCards, testSigningKey } from "@orvacon/testkit";
import { taxkit } from "../src/index";

function setup(rate: number) {
  const db = mockDatabase();
  const orva = orvacon({
    database: db,
    connectors: [mockConnector()],
    webhookSigningKey: testSigningKey,
    plugins: [taxkit({ rate })],
  });
  return { db, orva };
}

async function authorizedAmount(orva: ReturnType<typeof setup>["orva"], base: number, key: string) {
  const outcome = await orva.authorize({
    idempotencyKey: idempotencyKey(key),
    amount: money(base, "TRY"),
    source: { type: "card", card: testCards.success },
  });
  if (!outcome.ok) {
    throw new Error(outcome.error.message);
  }
  return outcome.paymentId;
}

describe("taxkit", () => {
  test("adds the tax on top of the authorized amount", async () => {
    const { db, orva } = setup(0.2);
    const id = await authorizedAmount(orva, 1_000, "k-20");
    expect(db.payments.get(id)?.amount).toEqual(money(1_200, "TRY"));
  });

  test("rounds the tax to whole minor units", async () => {
    const { db, orva } = setup(0.18); // 999 × 0.18 = 179.82 → 180
    const id = await authorizedAmount(orva, 999, "k-18");
    expect(db.payments.get(id)?.amount).toEqual(money(1_179, "TRY"));
  });

  test("a zero rate is a no-op", async () => {
    const { db, orva } = setup(0);
    const id = await authorizedAmount(orva, 500, "k-0");
    expect(db.payments.get(id)?.amount).toEqual(money(500, "TRY"));
  });

  test("rejects an invalid rate at setup", () => {
    expect(() => taxkit({ rate: -1 })).toThrow(TypeError);
    expect(() => taxkit({ rate: Number.NaN })).toThrow(TypeError);
  });
});
