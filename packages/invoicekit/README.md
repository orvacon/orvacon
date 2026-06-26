# @orvacon/invoicekit

Render a printable HTML invoice from an [orvacon](https://orvacon.com) payment — a single
self-contained document (inline styles, no external assets) you can email, attach, or print to PDF.

## Install

```bash
bun add @orvacon/invoicekit
```

## Use

```ts
import { money } from "@orvacon/paykit";
import { invoicekit } from "@orvacon/invoicekit";

const invoicer = invoicekit({
  seller: { name: "Acme Ltd", taxId: "1234567890", address: "Levent, Istanbul" },
  locale: "tr-TR",
});

const html = invoicer.render({
  payment, // the settled Payment
  buyer: { name: "Ada Lovelace", email: "ada@example.test" },
  lines: [
    { description: "Pro plan — annual", quantity: 1, unitPrice: money(2_000, "TRY") },
    { description: "Setup fee", quantity: 1, unitPrice: money(360, "TRY") },
  ],
});
```

Line totals are `unitPrice × quantity`; money and dates are formatted to each currency's and locale's
real conventions via `Intl`. **User-provided strings are HTML-escaped** — an invoice carries names and
descriptions you don't control. `render` returns a string; you decide how to deliver it (email body,
`puppeteer`/`weasyprint` to PDF, an HTTP response).

See it live: **[orvacon.com/preview/invoice](https://orvacon.com/preview/invoice)**.

## License

MIT
