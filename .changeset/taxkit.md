---
"@orvacon/taxkit": minor
---

Ship `@orvacon/taxkit` — a plugin that adds tax (VAT / KDV) to every authorize. `taxkit({ rate })` runs in `beforeAuthorize` and adds `rate × amount` (rounded to whole minor units) on top of the pre-tax base, so the tax lands in the authorized, captured, refunded, and ledgered amount with no separate line to reconcile. Fail-fast on an invalid rate.
