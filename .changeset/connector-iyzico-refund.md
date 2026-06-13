---
"@orvacon/connector-iyzico": minor
---

Add the Iyzico `refund` and the capabilities declaration. Refund uses Refund V2, which keys on the payment id (orvacon's stored `gatewayReference`) rather than per-item transaction ids, so a partial or full refund needs only what the core already holds; the core sums refunds and decides `partially_refunded` vs `refunded`. The capabilities declare `autoCapture: true` (so the core gates a separate capture — Iyzico captures at authorize), `partialCapture: false`, `partialRefund: true`, hex signatures, and html 3-D Secure. Price formatting is now shared between authorize and refund.

`Unverified — confirm against sandbox`: Refund V2 is documented as not recommended for multi-item baskets (it cannot target a line), so multi-item partial refunds are deferred (post-v1); the trailing-zero price format is also still unconfirmed.
