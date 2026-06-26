---
"@orvacon/notifykit": minor
---

Ship `@orvacon/notifykit` — a plugin that calls your `notify(event, payment)` when a payment is captured, refunded, or failed. It reacts through hooks, so a slow or throwing handler is reported through `onError` and never blocks or breaks the payment flow.
