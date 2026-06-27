# @orvacon/connector-iyzico

The [Iyzico](https://www.iyzico.com/) gateway connector for **[orvacon](https://github.com/orvacon/orvacon)** — raw-card 3-D Secure authorize → capture → refund → reconcile, verified end-to-end against the sandbox. The token (stored-card) flow ships **experimental**.

**Connector.** Binds via `connectors: []`.

## Install

```bash
bun add @orvacon/connector-iyzico @orvacon/paykit
```

## Use

```ts
import { orvacon } from "@orvacon/paykit";
import { iyzico } from "@orvacon/connector-iyzico";

const orva = orvacon({
  connectors: [iyzico({ apiKey, secretKey })], // environment follows the key prefix (sandbox vs live)
  // …database, webhookSigningKey
});
```

Config is validated fail-fast at construction. Iyzico captures at authorize, so the connector declares that capability and the core adapts — your app code never learns the gateway's quirks (IYZWSv2 signing, the response trailing-zero trap, the two-step 3DS).

## License

MIT
