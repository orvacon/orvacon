# @orvacon/testkit

## 0.1.0

### Minor Changes

- dfb865d: Add `@orvacon/testkit` — drive orvacon flows in a unit test with no gateway and no database. Exports `mockConnector()` (a deterministic in-memory gateway; the card picks the outcome and `threeDSecure: true` returns `requires_action`), `mockDatabase()` (an in-memory `DatabaseAdapter` with its stores exposed for assertions), `mockCallback()` (build the `RawWebhook` that finalizes a 3-D Secure payment), `testCards` / `testToken`, and a ready-to-use `testSigningKey`.

## 1.0.0

### Patch Changes

- Updated dependencies [46cc3f8]
- Updated dependencies [57e0933]
- Updated dependencies [66d0558]
- Updated dependencies [28b5c5f]
- Updated dependencies [4555ca9]
- Updated dependencies [e7a0d8a]
- Updated dependencies [d871036]
- Updated dependencies [8eb1cfb]
- Updated dependencies [a0229b7]
- Updated dependencies [8ada81f]
  - @orvacon/paykit@0.1.0
