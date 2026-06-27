# @orvacon/cryptokit

Zero-dependency cryptographic primitives for **[orvacon](https://github.com/orvacon/orvacon)**: Ed25519 signing, HMAC-SHA256, SHA-256, HKDF, timing-safe comparison, and the signed-webhook envelope. Web Crypto only — it runs anywhere.

**Primitive.** Imported and run; it binds nowhere.

## Install

```bash
bun add @orvacon/cryptokit
```

## Use

```ts
import { generateSigningKeyPair, signWebhook, verifyWebhook } from "@orvacon/cryptokit";

const { publicKey, secretKey } = await generateSigningKeyPair(); // Ed25519

const signature = await signWebhook(secretKey, { id, timestamp, payload }); // outbound
const verdict = await verifyWebhook(publicKey, { timestamp, signature, payload }); // inbound — a verdict, never throws
if (verdict.valid) {
  // trust the event
}
```

Every signature and token comparison is constant-time (`timingSafeEqual`) — never `===`. `verifyWebhook` checks the replay window before the signature and returns a reasoned `{ valid: false, reason }` rather than throwing on hostile input.

## License

MIT
