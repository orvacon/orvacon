---
"@orvacon/paykit": minor
---

Add the `DatabaseAdapter` contract — what the core requires from the dev's database, implemented by `@orvacon/adapter-*` packages: `createPayment` / `getPayment`, compare-and-swap `updatePaymentStatus`, atomic idempotency claims (`insertIdempotencyKey` with ON-CONFLICT semantics, `getIdempotencyKey`, `completeIdempotencyKey`), append-only `appendLedger` (double-entry, hash-chained `LedgerEntry`), and a `transaction` scope that forbids nesting at compile time. Also reserves id prefixes in one place (`ID_PREFIXES`: `pay`, `re`, `evt`, `sub`) and moves `IdempotencyKey` / `Idempotent` into the ids module (public API unchanged via the barrel).
