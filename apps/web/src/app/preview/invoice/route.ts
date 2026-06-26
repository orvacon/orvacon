import { invoicekit } from "@orvacon/invoicekit";
import { money } from "@orvacon/paykit";

// A live preview of @orvacon/invoicekit's output — visit /preview/invoice.
export function GET(): Response {
  const invoicer = invoicekit({
    seller: {
      name: "Acme Yazılım A.Ş.",
      taxId: "1234567890",
      address: "Levent, İstanbul",
      email: "billing@acme.test",
    },
    locale: "tr-TR",
  });

  const html = invoicer.render({
    payment: {
      id: "pay_01J9Z7Q2K3M4N5P6R7S8T9V0",
      amount: money(2_360, "TRY"),
      gatewayReference: "iyzico_abc123",
      createdAt: "2026-06-01T10:00:00.000Z",
    },
    number: "INV-2026-0042",
    buyer: { name: "Ada Lovelace", email: "ada@example.test", address: "Beşiktaş, İstanbul" },
    lines: [
      { description: "Pro plan — annual", quantity: 1, unitPrice: money(2_000, "TRY") },
      { description: "Setup fee", quantity: 1, unitPrice: money(360, "TRY") },
    ],
  });

  return new Response(html, { headers: { "content-type": "text/html; charset=utf-8" } });
}
