---
"@orvacon/connector-iyzico": minor
---

Add the Iyzico IYZWSv2 request-authentication module — the signing foundation every Iyzico API call requires. `buildIyzwsV2Headers({ apiKey, secretKey, uriPath, body })` returns the `Authorization: IYZWSv2 <base64>` and `x-iyzi-rnd` headers, signing `HEX(HMAC-SHA256(randomKey + uriPath + body))` over cryptokit's RFC-verified `hmacSha256` (no hand-rolled HMAC). Verified against Iyzico's official HMACSHA256 auth docs — including the empty-body rule and the exact `apiKey:…&randomKey:…&signature:…` authorization-string format that gets base64-encoded. The connector's flow methods (authorize / capture / refund / parseWebhook) and capabilities declaration land in follow-ups; `autoCapture` and 3DS callback behavior are deferred until verified against the sandbox.
