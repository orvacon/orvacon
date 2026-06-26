import { describe, expect, test } from "bun:test";
import { money } from "@orvacon/paykit";
import { type InvoiceInput, invoicekit } from "../src/index";

const invoicer = invoicekit({
  seller: { name: "Acme Ltd", taxId: "1234567890", taxOffice: "Boğaziçi V.D." },
  locale: "en-US",
});

const sample: InvoiceInput = {
  payment: {
    id: "pay_123",
    amount: money(2_400, "TRY"), // 20.00 base + 4.00 KDV
    gatewayReference: "gw_abc",
    createdAt: "2026-06-01T10:00:00.000Z",
  },
  buyer: { name: "Ada Lovelace", taxId: "9876543210", taxOffice: "Beşiktaş V.D." },
  lines: [{ description: "Pro plan", quantity: 1, unitPrice: money(2_000, "TRY") }],
  tax: { rate: 0.2, label: "KDV %20" },
};

describe("invoicekit", () => {
  test("renders a self-contained document with both parties' tax id and tax office", () => {
    const html = invoicer.render(sample);
    expect(html.startsWith("<!doctype html>")).toBe(true);
    expect(html).toContain("Acme Ltd");
    expect(html).toContain("1234567890"); // seller VKN
    expect(html).toContain("Boğaziçi V.D."); // seller tax office
    expect(html).toContain("Ada Lovelace");
    expect(html).toContain("9876543210"); // buyer VKN
  });

  test("breaks out the tax — subtotal, tax line, and total with the ISO code", () => {
    const html = invoicer.render(sample);
    expect(html).toContain("KDV %20");
    expect(html).toContain("4.00"); // KDV = 20.00 × 0.20
    expect(html).toContain("24.00"); // total = 24.00
    expect(html).toContain("TRY"); // ISO code on the grand total
  });

  test("computes each line total as unit × quantity", () => {
    const html = invoicer.render({
      ...sample,
      lines: [{ description: "Seat", quantity: 3, unitPrice: money(1_000, "TRY") }],
    });
    expect(html).toContain("30.00"); // 3 × 10.00
  });

  test("shows the document type and ETTN when given", () => {
    const html = invoicer.render({ ...sample, documentType: "e-Arşiv Fatura", ettn: "abc-123" });
    expect(html).toContain("e-Arşiv Fatura");
    expect(html).toContain("ETTN: abc-123");
  });

  test("escapes HTML in user-provided strings", () => {
    const html = invoicekit({ seller: { name: "<script>x</script>" } }).render(sample);
    expect(html).not.toContain("<script>x</script>");
    expect(html).toContain("&lt;script&gt;");
  });

  test("honors label overrides", () => {
    const html = invoicekit({ seller: { name: "X" }, labels: { total: "Genel Toplam" } }).render(
      sample,
    );
    expect(html).toContain("Genel Toplam");
  });
});
