# @orvacon/fraudkit

Veto risky authorizes with simple rules — an [orvacon](https://orvacon.com) plugin. Rules are checked
before the gateway; the first match rejects the charge and no payment is created.

**Plugin kit.** Binds via `plugins: []` — vetoes the charge.

## Install

```bash
bun add @orvacon/fraudkit
```

## Use

```ts
import { money, orvacon } from "@orvacon/paykit";
import { fraudkit } from "@orvacon/fraudkit";

const orva = orvacon({
  // … database, connectors, webhookSigningKey
  plugins: [
    fraudkit({
      maxAmount: money(50_000, "TRY"), // reject anything bigger
      blockCountries: ["NK"], // by billing address
      rule: (req) => (req.buyer?.email?.endsWith("@spam.test") ? "blocklisted sender" : null),
    }),
  ],
});
```

Every rule is optional. `maxAmount` only applies when the currency matches the charge; `rule` is a
custom check that returns a reason string to reject or `null` to allow. A vetoed authorize returns
`{ ok: false, error: { code: "declined" } }` — the gateway is never called.

## License

MIT
