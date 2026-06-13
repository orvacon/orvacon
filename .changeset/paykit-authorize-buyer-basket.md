---
"@orvacon/paykit": minor
---

Add normalized buyer, address, and basket context to `AuthorizeInput`. New optional types — `Buyer`, `Address`, `BasketItem` — let the application pass the customer, billing/shipping addresses, and an itemized basket that real gateways require for 3-D Secure, fraud scoring, and address verification. All four fields are optional: a gateway or flow that doesn't need them ignores them, and a connector that does validates its required subset and rejects with `invalid_request` before calling the gateway. The fields are normalized by concept, not by any one gateway's naming — e.g. `Buyer.nationalId` (the buyer's government identity number, where a gateway requires it) rather than a gateway-specific field name — and `BasketItem.price` is `Money`, so line-item totals stay integer-safe. The core forwards these verbatim to the connector's `authorize`.
