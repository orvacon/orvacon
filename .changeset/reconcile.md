---
"@orvacon/paykit": minor
"@orvacon/connector-iyzico": minor
---

Add `orva.reconcile(paymentId)` — the backstop for the narrow window where the gateway settled a payment (money moved) but the core crashed before persisting it, leaving the payment stuck at `requires_action`. It reads the gateway's authoritative state through a new optional connector method, `retrievePayment` (present only on connectors whose gateway offers a retrieve/inquiry call — its presence is the capability the core gates on), and advances the payment **only** if the gateway reports it settled; a payment the gateway still reports pending is left untouched, so reconciliation never invents money movement that did not happen. New public types: `ReconcileResult`, `ReconcileOutcome`, `RetrievePaymentInput`.

The Iyzico connector implements `retrievePayment` over `/payment/detail`, keying on `paymentStatus` (verified against the sandbox: `SUCCESS` → captured, `INIT_THREEDS` and other non-terminal statuses → pending/untouched).

Note on scope: orvacon never holds funds and Iyzico captures at 3-D Secure *finalize*, so a dropped 3-D Secure callback leaves the payment genuinely un-captured (no money moved) — reconciliation correctly no-ops there. Its job is the crash-window consistency gap (gateway-settled-but-unreflected), not expiring abandoned payments; v1 has no automatic expiry.
