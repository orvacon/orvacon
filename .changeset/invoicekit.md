---
"@orvacon/invoicekit": minor
---

Ship `@orvacon/invoicekit` — render a printable, self-contained HTML invoice from a payment. `invoicekit({ seller }).render({ payment, buyer, lines })` returns a styled document (inline CSS, no external assets); line totals are `unitPrice × quantity`, money and dates follow each currency's and locale's real conventions via `Intl`, and user-provided strings are HTML-escaped.
