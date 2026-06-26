import { describe, expect, test } from "bun:test";
import { type Address, idempotencyKey, money, orvacon } from "@orvacon/paykit";
import { mockConnector, mockDatabase, testCards, testSigningKey } from "@orvacon/testkit";
import { type FraudkitRules, fraudkit } from "../src/index";

function setup(rules: FraudkitRules) {
  const db = mockDatabase();
  const orva = orvacon({
    database: db,
    connectors: [mockConnector()],
    webhookSigningKey: testSigningKey,
    plugins: [fraudkit(rules)],
  });
  return { db, orva };
}

const NK: Address = { contactName: "X", address: "1 St", city: "Pyongyang", country: "NK" };

function authorize(
  orva: ReturnType<typeof setup>["orva"],
  key: string,
  amount = money(1_000, "TRY"),
  billingAddress?: Address,
) {
  return orva.authorize({
    idempotencyKey: idempotencyKey(key),
    amount,
    source: { type: "card", card: testCards.success },
    billingAddress,
  });
}

describe("fraudkit", () => {
  test("rejects an amount over the ceiling; no payment is created", async () => {
    const { db, orva } = setup({ maxAmount: money(5_000, "TRY") });
    const outcome = await authorize(orva, "k-over", money(6_000, "TRY"));
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) {
      expect(outcome.error.code).toBe("declined");
    }
    expect(db.payments.size).toBe(0);
  });

  test("allows an amount under the ceiling", async () => {
    const { orva } = setup({ maxAmount: money(5_000, "TRY") });
    const outcome = await authorize(orva, "k-under", money(4_000, "TRY"));
    expect(outcome.ok).toBe(true);
  });

  test("blocks a configured country", async () => {
    const { orva } = setup({ blockCountries: ["NK"] });
    const outcome = await authorize(orva, "k-country", money(100, "TRY"), NK);
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) {
      expect(outcome.error.message).toContain("NK");
    }
  });

  test("a custom rule can reject with its own reason", async () => {
    const { orva } = setup({ rule: (req) => (req.amount.amount === 1_313 ? "unlucky" : null) });
    const outcome = await authorize(orva, "k-rule", money(1_313, "TRY"));
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) {
      expect(outcome.error.message).toBe("unlucky");
    }
  });
});
