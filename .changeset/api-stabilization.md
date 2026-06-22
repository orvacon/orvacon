---
"@orvacon/paykit": minor
---

API stabilization toward 1.0.

- **Breaking — every operation outcome discriminates on `ok` at the top.**
  `authorize` / `capture` / `refund` now return
  `{ ok: true, paymentId, status, action?, ... } | { ok: false, paymentId?, error }`
  instead of `{ paymentId, result }`, so they are checked the same way as
  `reconcile` / `storeCard` / `deleteCard`: `if (outcome.ok)` rather than
  `if (outcome.result.ok)`. Migration: drop the `.result` hop — `outcome.result.ok`
  → `outcome.ok`, `outcome.result.error` → `outcome.error`, etc.
- **Breaking — the unfinished `plugins` contract is removed.** The placeholder
  `OrvaconPlugin` type and the `plugins` option on `OrvaconConfig` are gone until
  the plugin system is actually designed; they did nothing.
- The stored-card vault types (`StoreCardInput`, `StoreCardResult`, `StoredCard`,
  `DeleteCardInput`, `DeleteCardResult`) are now exported from the package entry,
  matching `Card` / `CardToken` / `AuthorizeInput` and the rest.
