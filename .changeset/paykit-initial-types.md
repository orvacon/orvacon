---
"@orvacon/paykit": minor
---

Add the initial public type surface: the branded, non-negative `Money` type with currency-safe arithmetic (`addMoney` / `subtractMoney` / `compareMoney`), the `OrvaconConnector` contract with `ConnectorCapabilities`, the payment state machine (`PaymentStatus`, compile-time `AllowedTransitions`, runtime `canTransition` / `assertTransition`), client-generated idempotency keys (`IdempotencyKey`, `Idempotent<I>` on every mutating call), selective-retry classification (`isRetryableError`), `NormalizedEvent`, `ConnectorError`, `ConnectorResult` / `ConnectorAction`, and the `orvacon()` factory signature. Types and guards only — the orchestration body is not implemented yet.
