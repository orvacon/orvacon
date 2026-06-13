---
"@orvacon/paykit": minor
---

`capture()` is now capability-gated by `autoCapture`. A connector that declares `autoCapture: true` captures at authorize and has no separate authorize-then-capture step, so the core rejects a `capture()` call for it as `invalid_request` before reaching the connector — mirroring the way `partialCapture: false` gates partial captures. This keeps the gateway difference in the capability declaration rather than in application code or a connector body.
