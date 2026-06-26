# @orvacon/invoicekit

Render a printable HTML invoice from an [orvacon](https://orvacon.com) payment — a single
self-contained document (inline styles, no external assets) you can email, attach, or print to PDF.

Built for a real **tax invoice**: it breaks out the tax (lines are the pre-tax base, then a tax line,
then the total), carries both parties' tax id and tax office, and shows a document type + ETTN for a
Turkish **e-Arşiv / e-Fatura**. Set `labels` to Turkish for a *fatura*.

## Install

```bash
bun add @orvacon/invoicekit
```

## Use

```ts
import { money } from "@orvacon/paykit";
import { invoicekit } from "@orvacon/invoicekit";

const invoicer = invoicekit({
  seller: {
    name: "Acme Yazılım A.Ş.",
    taxId: "1234567890",
    taxOffice: "Boğaziçi Vergi Dairesi",
    address: "Büyükdere Cad. No:128, Esentepe, Şişli 34394, İstanbul",
  },
  locale: "tr-TR",
  labels: { subtotal: "Ara Toplam", total: "Genel Toplam", taxId: "VKN", taxOffice: "Vergi Dairesi" },
});

const html = invoicer.render({
  payment, // the settled Payment
  documentType: "e-Arşiv Fatura",
  ettn: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  buyer: { name: "Lovelace Ltd. Şti.", taxId: "9876543210", taxOffice: "Beşiktaş V.D." },
  lines: [{ description: "orvacon Pro — yıllık abonelik", quantity: 1, unitPrice: money(200_000, "TRY") }],
  tax: { rate: 0.2, label: "KDV %20" }, // 2.000 matrah → 400 KDV → 2.400 toplam
});
```

Line totals are `unitPrice × quantity`; the `tax` rate is applied to the subtotal (omit it for a
tax-free invoice). Money and dates follow each currency's and locale's real conventions via `Intl`,
the grand total carries its ISO code, and **user-provided strings are HTML-escaped**. `render` returns
a string — you choose how to deliver it (email body, `puppeteer`/`weasyprint` to PDF, an HTTP
response).

See it live: **[orvacon.com/preview/invoice](https://orvacon.com/preview/invoice)**.

> **Not a GİB integration.** invoicekit renders the *document*; filing an e-Arşiv/e-Fatura with the
> tax authority (UBL-TR, the ETTN, the portal) stays with your fiscal provider. It gives you the human-
> readable invoice with the fields a valid one needs.

## License

MIT
