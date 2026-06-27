# @orvacon/paykit

Provider-agnostic, TypeScript-first payment orchestration — the core of **[orvacon](https://github.com/orvacon/orvacon)**. Gateways plug in as connectors behind one type-safe API; your application never knows which gateway runs a payment.

**The core.** Connectors, adapters, and kits all bind to the instance it creates.

## Install

```bash
bun add @orvacon/paykit
```

## Use

```ts
import { idempotencyKey, money, orvacon } from "@orvacon/paykit";
import { iyzico } from "@orvacon/connector-iyzico";
import { supabaseAdapter } from "@orvacon/adapter-supabase";

const orva = orvacon({
  connectors: [iyzico({ apiKey, secretKey })],
  database: supabaseAdapter({ sql }),
  webhookSigningKey,
});

const payment = await orva.authorize({
  idempotencyKey: idempotencyKey("order-42"),
  amount: money(2_000, "TRY"),
  source: { type: "card", card },
  threeDSecure: true,
});
// payment.ok === false → payment.error; status "requires_action" carries the 3-D Secure challenge.
```

Money is integer minor units + currency (the branded `Money`, never a float). Every operation returns a discriminated `{ ok: true, … } | { ok: false, error }` — connectors never throw — and the state machine (`created → authorized → captured → refunded`, plus `requires_action` / `failed` / `voided`) is enforced at compile time.

## License

MIT
