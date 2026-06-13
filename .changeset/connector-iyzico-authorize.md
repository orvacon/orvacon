---
"@orvacon/connector-iyzico": minor
---

Implement the Iyzico `authorize` mapping on the signed transport. It maps `AuthorizeInput` (amount → price/paidPrice, source → paymentCard, buyer/addresses/basket → Iyzico's shapes) onto the gateway request, posting to `/payment/3dsecure/initialize` for a 3-D Secure flow — returning `requires_action` with the decoded challenge HTML — or `/payment/auth` otherwise. It validates Iyzico's required buyer/address/basket subset first and fails fast with a field-named `invalid_request` (e.g. "iyzico authorize requires buyer.nationalId") before any gateway call, and reconciles the basket line-item total against the amount currency-safely.

Honest boundaries, each marked `Unverified — confirm against sandbox`: the trailing-zero `price` format, the auto-capture behavior of the direct (non-3DS) path, and the token (stored-card) flow — which is mapped but only the raw-card 3-D Secure path is the sandbox-verified, first-class v1 flow. `itemType` is derived from `BasketItem.type` (or, as a fallback, the presence of a shipping address) and never blanket-defaulted, since it controls whether a shipping address is mandatory.
