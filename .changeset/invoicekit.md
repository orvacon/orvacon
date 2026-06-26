---
"@orvacon/invoicekit": minor
---

Ship `@orvacon/invoicekit` — render a printable, self-contained HTML **tax invoice** from a payment. `invoicekit({ seller, locale, labels }).render({ payment, buyer, lines, tax })` breaks out the tax (lines are the pre-tax base → tax line → total), carries both parties' tax id and tax office, and shows a document type + ETTN for a Turkish e-Arşiv / e-Fatura. Money and dates use each currency's and locale's real conventions via `Intl`, the grand total carries its ISO code, labels are overridable (Turkish for a *fatura*), and user-provided strings are HTML-escaped.
