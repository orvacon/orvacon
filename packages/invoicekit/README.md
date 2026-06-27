# @orvacon/invoicekit

Render a printable HTML **invoice document** from an [orvacon](https://orvacon.com) payment — a single
self-contained file (inline styles, no external assets) you can email, attach, or print to PDF. It
carries the fields a tax invoice needs: a tax breakdown, both parties' tax id and tax office, units,
and an amount in words.

**Stateless kit.** Standalone — call it directly.

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
  payment,
  documentType: "e-Fatura",
  ettn: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  amountInWords: "İkibindörtyüz Türk Lirası",
  buyer: { name: "Lovelace Ltd. Şti.", taxId: "9876543210", taxOffice: "Beşiktaş V.D." },
  lines: [{ description: "orvacon Pro — yıllık abonelik", quantity: 1, unit: "Yıl", unitPrice: money(200_000, "TRY") }],
  tax: { rate: 0.2, label: "KDV %20" }, // 2.000 matrah → 400 KDV → 2.400 toplam
});
```

The `tax` rate applies to the line subtotal; money uses one consistent symbol via `Intl`; lines carry
a `unit`; labels are overridable (Turkish for a *fatura*); and **user-provided strings are
HTML-escaped**. `render` returns a string — you choose how to deliver it.

See it live: **[orvacon.com/preview/invoice](https://orvacon.com/preview/invoice)**.

## A renderer, not a GİB integration

invoicekit renders the **document**. It does **not** file an e-Fatura / e-Arşiv with the tax authority
(UBL-TR, ETTN allocation, the GİB portal), and it does **not** choose the scenario — a registered
taxpayer (*mükellef*) gets an **e-Fatura**, anyone else an **e-Arşiv**, and that decision needs a GİB
*mükellef* query. Both belong to your e-invoicing provider. orvacon stays out of fiscal regulation by
design — the same reason it never holds money. You pass `documentType` (and the ETTN / amount-in-words
your provider supplies); invoicekit lays it out.

## License

MIT
