---
"orvacon": minor
---

Add the `keys` command: `npx orvacon keys` generates an Ed25519 webhook signing key pair (wrapping cryptokit's `generateSigningKeyPair`) and writes the `ORVACON_WEBHOOK_SIGNING_KEY` (secret) and `ORVACON_WEBHOOK_PUBLIC_KEY` (public) lines to stdout, with usage guidance on stderr so `orvacon keys >> .env.local` captures just the keys. The secret feeds `orvacon({ webhookSigningKey })`; the public verifies deliveries. This raises the CLI's minimum Node to 20 (Web Crypto Ed25519), matching cryptokit.
