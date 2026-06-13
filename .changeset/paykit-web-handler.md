---
"@orvacon/paykit": minor
---

Add `toWebHandler` — a framework-agnostic `Request → Response` handler for the gateway callback route, the seam framework adapters wrap. It parses the request into a webhook, runs `handleWebhook` **synchronously** (finalize + state + ledger settle before the response, so the result is durable and the user sees the real outcome), and redirects the browser to a configured `returnUrl.success` / `returnUrl.failure` based on the payment's resolved status — the orchestrator already knows the result, so the app does not have to decide. The signed outbound delivery it schedules stays fire-and-forget for the adapter to drain after the response, and the async server-to-server notification response (a plain acknowledgement, post-v1) has its seam left in place.

`Unverified — confirm against sandbox`: *that* the browser is redirected is settled; whether the gateway expects orvacon to 302 the callback itself or to use separate success/failure URLs configured up front (panel or request) is confirmed against the sandbox.
