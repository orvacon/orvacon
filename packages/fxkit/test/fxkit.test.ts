import { describe, expect, test } from "bun:test";
import { money } from "@orvacon/paykit";
import { fxkit } from "../src/index";

const fixed = (r: number) => fxkit({ rates: { rate: () => r }, locale: "en-US" });

describe("fxkit", () => {
  test("formats an amount in the target currency", async () => {
    const shown = await fixed(0.0277).display(money(2999, "TRY"), "EUR"); // 29.99 × 0.0277 ≈ 0.83
    expect(shown).toContain("0.83");
    expect(shown).toContain("€");
  });

  test("uses the target currency's decimals — JPY has none", async () => {
    const shown = await fixed(3.7).display(money(10_000, "TRY"), "JPY"); // 100 × 3.7 = 370
    expect(shown).toContain("370");
    expect(shown).not.toContain(".");
  });

  test("respects the base currency's scale — JPY has no minor units", async () => {
    const shown = await fixed(0.0068).display(money(100, "JPY"), "USD"); // 100 × 0.0068 = 0.68
    expect(shown).toContain("0.68");
  });

  test("awaits an async rate source", async () => {
    const fx = fxkit({ rates: { rate: async () => 0.03 }, locale: "en-US" });
    const shown = await fx.display(money(1_000, "TRY"), "EUR"); // 10 × 0.03 = 0.30
    expect(shown).toContain("0.30");
  });
});
