# @orvacon/taxkit

Add tax (VAT / KDV) to every authorize — an [orvacon](https://orvacon.com) plugin. Your application
code calls `orva.authorize(...)` with the pre-tax amount; taxkit adds the tax before the gateway sees
it.

## Install

```bash
bun add @orvacon/taxkit
```

## Use

```ts
import { orvacon } from "@orvacon/paykit";
import { taxkit } from "@orvacon/taxkit";

const orva = orvacon({
  // … database, connectors, webhookSigningKey
  plugins: [taxkit({ rate: 0.2 })], // +20% on every authorize
});
```

`rate` is a fraction of the amount (`0.18` for Turkey's standard KDV). It's **tax-exclusive**: the
request `amount` is the pre-tax base, and `rate × amount` — rounded to whole minor units — is added.
An invalid rate throws at setup, not at the first payment.

## License

MIT
