---
"@orvacon/testkit": minor
---

Add `@orvacon/testkit` — drive orvacon flows in a unit test with no gateway and no database. Exports `mockConnector()` (a deterministic in-memory gateway; the card picks the outcome and `threeDSecure: true` returns `requires_action`), `mockDatabase()` (an in-memory `DatabaseAdapter` with its stores exposed for assertions), `mockCallback()` (build the `RawWebhook` that finalizes a 3-D Secure payment), `testCards` / `testToken`, and a ready-to-use `testSigningKey`.
