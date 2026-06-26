---
"@orvacon/fraudkit": minor
---

Ship `@orvacon/fraudkit` — a plugin that vetoes risky authorizes before the gateway. `fraudkit({ maxAmount, blockCountries, rule })` checks each rule in `beforeAuthorize`; the first match rejects the charge with `declined` and creates no payment. `maxAmount` applies only when the currency matches; `rule` is a custom check returning a reason string or `null`.
