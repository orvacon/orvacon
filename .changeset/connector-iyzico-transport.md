---
"@orvacon/connector-iyzico": minor
---

Add the Iyzico HTTP foundation that every flow method builds on: a config contract and the signed transport layer. `IyzicoConfig` (`{ apiKey, secretKey, environment?, fetch? }`) is validated fail-fast and resolves `environment` (`"sandbox"` | `"production"`) to the documented base URL. The transport signs each request with IYZWSv2, sends it through an injectable `fetch` (defaulting to the platform global) carrying the core's `ctx.signal` for the per-call timeout, and normalizes Iyzico's response envelope: a `status: "failure"` body (with `errorCode` / `errorMessage`) and network/HTTP errors become a `ConnectorError` via `ctx.classifyError`, while an unmapped gateway code resolves to `unknown` and is never auto-retried. The injectable `fetch` is the single seam tests stub, smoke-tests pass real credentials through, and ADR-016 retry/timeout will wrap. Base URLs and the envelope field names are verified against Iyzico's official docs.
