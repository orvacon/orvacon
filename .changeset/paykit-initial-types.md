---
"@orvacon/paykit": minor
---

Add the initial public type surface: the branded, non-negative `Money` type with currency-safe arithmetic (`addMoney` / `subtractMoney` / `compareMoney`), the `OrvaconConnector` contract with `ConnectorCapabilities`, the payment state machine (`PaymentStatus` + compile-time `AllowedTransitions`), `NormalizedEvent`, `ConnectorError`, and `ConnectorResult` / `ConnectorAction`, plus the `orvacon()` factory signature. Types only — the orchestration body is not implemented yet.
