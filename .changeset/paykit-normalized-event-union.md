---
"@orvacon/paykit": minor
---

`NormalizedEvent` is now a discriminated union: `amount` (the moved amount) exists only on the value-moving events (`payment.authorized` / `payment.captured` / `payment.refunded`), while `payment.failed` / `payment.voided` carry no amount. This makes "a capture event without an amount" a compile error rather than a runtime guard — a connector emitting a 3-D Secure failure no longer has to invent an amount. Connectors that build a `NormalizedEvent` now construct the variant matching the event type.

`handleWebhook` also gains an amount-integrity check: a capture/authorize webhook whose amount does not equal the stored payment amount is refused (never applied as captured), surfaced through `onError`, and the payment is moved to `failed` rather than left awaiting action — a mismatched amount is a tampering/bug signal, and failing safe beats either capturing a wrong amount or leaving a zombie payment.
