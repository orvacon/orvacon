---
"@orvacon/fxkit": minor
---

Ship `@orvacon/fxkit` — show a price in the shopper's currency while you charge in the merchant's. `fxkit({ rates, locale }).display(amount, target)` formats an orvacon `Money` in a target currency (decimals follow each currency's real scale via `Intl`). Display-only by design — it never produces an amount you can charge, so it can't move custody.
