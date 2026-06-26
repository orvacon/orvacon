import { invoicekit } from "@orvacon/invoicekit";
import { money } from "@orvacon/paykit";

// A live preview of @orvacon/invoicekit's output — visit /preview/invoice.
export function GET(): Response {
  const invoicer = invoicekit({
    seller: {
      name: "Acme Yazılım A.Ş.",
      taxId: "1234567890",
      taxOffice: "Boğaziçi Vergi Dairesi",
      address: "Büyükdere Cad. No:128, Esentepe, Şişli 34394, İstanbul",
      email: "fatura@acme.com.tr",
      phone: "+90 212 555 0142",
    },
    locale: "tr-TR",
    labels: {
      document: "Fatura",
      from: "Düzenleyen",
      billTo: "Müşteri",
      description: "Açıklama",
      quantity: "Miktar",
      unitPrice: "Birim Fiyat",
      amount: "Tutar",
      subtotal: "Ara Toplam",
      total: "Genel Toplam",
      taxId: "VKN",
      taxOffice: "Vergi Dairesi",
      paid: "ÖDENDİ",
    },
  });

  const html = invoicer.render({
    payment: {
      id: "pay_01J9Z7Q2K3M4N5P6R7S8T9V0",
      amount: money(240_000, "TRY"), // ₺2.400,00 = 2.000 matrah + %20 KDV
      gatewayReference: "iyzico_abc123",
      createdAt: "2026-06-01T13:24:00.000Z",
    },
    // The buyer is a registered taxpayer (VKN + vergi dairesi) → e-Fatura, not e-Arşiv.
    documentType: "e-Fatura",
    number: "ACM2026000000042",
    ettn: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    amountInWords: "İkibindörtyüz Türk Lirası",
    buyer: {
      name: "Lovelace Danışmanlık Ltd. Şti.",
      taxId: "9876543210",
      taxOffice: "Beşiktaş Vergi Dairesi",
      address: "Barbaros Bulvarı No:42, Beşiktaş 34353, İstanbul",
      email: "muhasebe@lovelace.com.tr",
    },
    lines: [
      {
        description: "orvacon Pro — yıllık abonelik",
        quantity: 1,
        unit: "Yıl",
        unitPrice: money(200_000, "TRY"),
      },
    ],
    tax: { rate: 0.2, label: "KDV %20" },
  });

  return new Response(html, { headers: { "content-type": "text/html; charset=utf-8" } });
}
