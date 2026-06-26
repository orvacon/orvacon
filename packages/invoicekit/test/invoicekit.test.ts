import { describe, expect, test } from "bun:test";
import { money } from "@orvacon/paykit";
import { type InvoiceInput, invoicekit } from "../src/index";

const invoicer = invoicekit({ seller: { name: "Acme Ltd", taxId: "1234567890" }, locale: "en-US" });

const sample: InvoiceInput = {
  payment: {
    id: "pay_123",
    amount: money(2_360, "TRY"),
    gatewayReference: "gw_abc",
    createdAt: "2026-06-01T10:00:00.000Z",
  },
  buyer: { name: "Ada Lovelace", email: "ada@example.test" },
  lines: [
    { description: "Widget", quantity: 2, unitPrice: money(1_000, "TRY") },
    { description: "Shipping", quantity: 1, unitPrice: money(360, "TRY") },
  ],
};

describe("invoicekit", () => {
  test("renders a self-contained HTML invoice with the parties, lines, and total", () => {
    const html = invoicer.render(sample);
    expect(html.startsWith("<!doctype html>")).toBe(true);
    expect(html).toContain("Acme Ltd");
    expect(html).toContain("Ada Lovelace");
    expect(html).toContain("Widget");
    expect(html).toContain("23.60"); // total paid = 23.60 TRY
  });

  test("computes each line total as unit × quantity", () => {
    const html = invoicer.render(sample);
    expect(html).toContain("20.00"); // 2 × 10.00
  });

  test("escapes HTML in user-provided strings", () => {
    const html = invoicekit({ seller: { name: "<script>x</script>" } }).render(sample);
    expect(html).not.toContain("<script>x</script>");
    expect(html).toContain("&lt;script&gt;");
  });

  test("falls back to the payment id for the invoice number", () => {
    expect(invoicer.render(sample)).toContain("pay_123");
  });
});
