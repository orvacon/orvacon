---
"@orvacon/paykit": minor
"@orvacon/connector-iyzico": minor
---

Add stored-card tokens — vault a card and charge it later.

`orva.storeCard(...)` vaults a card with the gateway and returns a `CardToken`
(the token plus a `userKey`) that a later `token` payment source charges;
`orva.deleteCard(...)` forgets it. orvacon persists nothing — the token is
returned for you to store against your own customer. Both gate on the connector
supporting card storage (its presence is the capability), so a connector whose
gateway has no vault rejects them as `invalid_request`.

The Iyzico connector implements the capability against Iyzico's card storage,
and a token authorize now passes `cardUserKey` alongside `cardToken`. The
stored-card 3-D Secure lifecycle — store → token authorize → capture → refund →
delete — is verified end-to-end against the sandbox.
