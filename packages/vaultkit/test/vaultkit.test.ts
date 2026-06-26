import { describe, expect, test } from "bun:test";
import { idempotencyKey, money, orvacon } from "@orvacon/paykit";
import { mockConnector, mockDatabase, testCards, testSigningKey } from "@orvacon/testkit";
import { vaultkit } from "../src/index";

const buyer = { name: "Ada", surname: "Lovelace", email: "ada@example.com" };

function makeVault() {
  const orva = orvacon({
    connectors: [mockConnector()],
    database: mockDatabase(),
    webhookSigningKey: testSigningKey,
  });
  return { orva, vault: vaultkit({ orva }) };
}

describe("vaultkit", () => {
  test("save normalizes the gateway token into a persist-ready CardOnFile", async () => {
    const { vault } = makeVault();
    const result = await vault.save({ card: testCards.success, buyer, customerRef: "cus_42" });
    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error("expected ok");
    }
    expect(result.card).toMatchObject({
      token: "mock_tok_1111",
      brand: "Visa",
      last4: "1111",
      customerRef: "cus_42",
      label: "Visa •••• 1111",
    });
    expect(result.card.userKey).toBeDefined();
  });

  test("toSource turns a saved card back into a token payment source", async () => {
    const { vault } = makeVault();
    const saved = await vault.save({ card: testCards.success, buyer });
    if (!saved.ok) {
      throw new Error("expected ok");
    }
    expect(vault.toSource(saved.card)).toEqual({
      type: "token",
      token: { token: "mock_tok_1111", userKey: saved.card.userKey },
    });
  });

  test("a saved card charges through orva via toSource", async () => {
    const { orva, vault } = makeVault();
    const saved = await vault.save({ card: testCards.success, buyer });
    if (!saved.ok) {
      throw new Error("expected ok");
    }
    const charge = await orva.authorize({
      idempotencyKey: idempotencyKey("vault-charge-1"),
      amount: money(1_000, "TRY"),
      source: vault.toSource(saved.card),
    });
    expect(charge.ok).toBe(true);
  });

  test("forget deletes the card — a CardOnFile or a bare token reference both work", async () => {
    const { vault } = makeVault();
    const saved = await vault.save({ card: testCards.success, buyer });
    if (!saved.ok) {
      throw new Error("expected ok");
    }
    expect(await vault.forget(saved.card)).toEqual({ ok: true });
    expect(await vault.forget({ token: "mock_tok_1111" })).toEqual({ ok: true });
  });

  test("label renders the card and falls back when brand or last4 is missing", () => {
    const { vault } = makeVault();
    expect(vault.label({ brand: "Visa", last4: "4242" })).toBe("Visa •••• 4242");
    expect(vault.label({ last4: "4242" })).toBe("Card •••• 4242");
    expect(vault.label({ brand: "Visa" })).toBe("Visa");
    expect(vault.label({})).toBe("Saved card");
  });

  test("save surfaces a gateway error without throwing", async () => {
    const vault = vaultkit({
      orva: {
        storeCard: async () => ({
          ok: false,
          error: { code: "gateway_error", message: "vault unavailable" },
        }),
        deleteCard: async () => ({ ok: true }),
      },
    });
    const result = await vault.save({ card: testCards.success, buyer });
    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error("expected failure");
    }
    expect(result.error.code).toBe("gateway_error");
  });
});
