import { describe, expect, test } from "bun:test";
import { generatePaymentId, type LedgerEntry, money } from "@orvacon/paykit";
import { ledgerkit } from "../src/index";

const pid = generatePaymentId();
const entries: LedgerEntry[] = [
  {
    paymentId: pid,
    direction: "debit",
    account: "gateway",
    amount: money(2_400, "TRY"),
    occurredAt: "2026-06-01T10:00:00.000Z",
    prevHash: "0".repeat(64),
    hash: "h1",
  },
  {
    paymentId: pid,
    direction: "credit",
    account: "merchant_receivable",
    amount: money(2_400, "TRY"),
    occurredAt: "2026-06-01T10:00:00.000Z",
    prevHash: "h1",
    hash: "h2",
  },
];

const lk = ledgerkit({ locale: "en-US" });

describe("ledgerkit", () => {
  test("maps entries to double-entry rows", () => {
    const rows = lk.toRows(entries);
    expect(rows[0]).toMatchObject({ account: "gateway", debit: "24.00", credit: "" });
    expect(rows[1]).toMatchObject({ account: "merchant_receivable", credit: "24.00", debit: "" });
  });

  test("exports CSV with a header and one row per leg", () => {
    const csv = lk.toCsv(entries);
    const lines = csv.split("\r\n");
    expect(lines[0]).toBe("date,paymentId,account,debit,credit,currency,hash");
    expect(lines).toHaveLength(3); // header + 2 legs
    expect(csv).toContain("24.00");
    expect(csv).toContain("gateway");
  });

  test("quotes CSV cells that contain a comma", () => {
    const first = entries[0];
    if (!first) {
      throw new Error("no entry");
    }
    const csv = lk.toCsv([{ ...first, account: "fees, gateway" }]);
    expect(csv).toContain('"fees, gateway"');
  });

  test("verifyChain passes a linked chain and points at a break", () => {
    expect(lk.verifyChain(entries)).toEqual({ ok: true });
    const second = entries[1];
    const first = entries[0];
    if (!first || !second) {
      throw new Error("no entries");
    }
    expect(lk.verifyChain([first, { ...second, prevHash: "wrong" }])).toEqual({
      ok: false,
      brokenAt: 1,
    });
  });
});
