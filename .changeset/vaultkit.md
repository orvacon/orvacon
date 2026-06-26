---
"@orvacon/vaultkit": minor
---

Ship `@orvacon/vaultkit` — saved cards on file, statelessly. `vaultkit({ orva })` vaults a card into a persist-ready `CardOnFile` (gateway token + display label), turns it back into a charge `PaymentSource` with `toSource`, and deletes it with `forget`. It keeps no store of its own; your database stays the single home for which customer owns which card.
