---
"@orvacon/invoicekit": minor
---

Ship `@orvacon/invoicekit` — render a printable, self-contained HTML **invoice document** from a payment. `invoicekit({ seller, locale, labels }).render({ payment, buyer, lines, tax })` breaks out the tax (lines are the pre-tax base → tax line → total), carries both parties' tax id and tax office, line units, an amount-in-words, and a `documentType` + ETTN you supply. Money uses one consistent symbol via `Intl`, labels are overridable (Turkish for a *fatura*), and user-provided strings are HTML-escaped. It renders the document; it does not file an e-Fatura / e-Arşiv with GİB or choose the scenario — that stays with your fiscal provider.
