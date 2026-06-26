---
"@orvacon/paykit": minor
---

Add the plugin system. `orvacon({ plugins: [...] })` accepts `OrvaconPlugin`s that extend the orchestration without touching the connector or the application:

- `beforeAuthorize` runs before the gateway, in registration order (each plugin sees the previous one's transform), and may rewrite the request — e.g. add tax to the amount — or veto it — e.g. a fraud block. A throwing `beforeAuthorize` fails the charge **closed**.
- `hooks` react to persisted lifecycle events, merged with the instance's own `hooks` and each isolated — a throwing handler is reported through `onError`, never breaking the payment flow.

Exports `OrvaconPlugin`, `PluginContext`, and `BeforeAuthorizeResult`.
