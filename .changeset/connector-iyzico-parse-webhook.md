---
"@orvacon/connector-iyzico": minor
---

Add `parseWebhook` — the Iyzico 3-D Secure callback handler that closes the payment loop, the connector's fourth and final operation. It gates on `mdStatus` (a bank-side 3DS failure → `payment.failed`, no gateway call); on success it calls the finalize endpoint (`/payment/3dsecure/auth`), and the authenticated finalize response is authoritative — so `payment.captured` (with the charged `paidPrice`) is emitted from it, never from the untrusted callback POST. A definite finalize failure → `payment.failed`; a transient/network finalize failure (`gateway_error`, outcome unknown) throws and leaves the payment for reconciliation rather than guessing. Adds `parsePrice` (gateway decimal → branded `Money`).

`Unverified — confirm against sandbox`: the exact callback field encoding, the finalize response shape, and the trailing-zero price format. The async X-IYZ-SIGNATURE-V3 webhook notification is a separate, deferred path (post-v1); the dropped-callback backstop arrives with reconciliation (the next piece).
