---
"@orvacon/ledgerkit": minor
---

Ship `@orvacon/ledgerkit` — export orvacon's hash-chained ledger and audit it. `ledgerkit()` turns a `LedgerEntry[]` into double-entry rows (`toRows`) or an RFC 4180 CSV (`toCsv`, amounts as plain major-unit decimals), and `verifyChain` confirms each entry's `prevHash` equals the previous entry's `hash`, pointing at the first break. Stateless — the core's ledger stays the source of truth.
