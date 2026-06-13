---
"@orvacon/connector-iyzico": minor
---

Add the `iyzico()` factory — the connector is now **registerable**: `orvacon({ connectors: [iyzico({ apiKey, secretKey, environment? })] })`. It validates config fail-fast, binds one IYZWSv2-signed transport, and wires all four operations (`authorize`, `refund`, `parseWebhook`, plus the declared `capture` boundary) alongside the verified `IYZICO_CAPABILITIES` declaration and a conservative, doc-verified `$ERROR_CODES` seed — well-known card declines → `declined`, credential/signature errors → `auth_error`, and every unlisted code resolves to `unknown` (surfaced for reconciliation, never guessed). This completes Iyzico's four-method v1 surface; a sandbox smoke-test closes the remaining `Unverified` items, and the async webhook notification + dropped-callback reconciliation land after.
