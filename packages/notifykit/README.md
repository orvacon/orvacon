# @orvacon/notifykit

Notify customers on payment lifecycle events — an [orvacon](https://orvacon.com) plugin. It reacts to
captures, refunds, and failures without ever touching the charge.

**Plugin kit.** Binds via `plugins: []` — lifecycle hooks.

## Install

```bash
bun add @orvacon/notifykit
```

## Use

```ts
import { orvacon } from "@orvacon/paykit";
import { notifykit } from "@orvacon/notifykit";

const orva = orvacon({
  // … database, connectors, webhookSigningKey
  plugins: [
    notifykit({
      notify: async (event, payment) => {
        await mailer.send(payment.userId, `Your payment was ${event}`); // "captured" | "refunded" | "failed"
      },
    }),
  ],
});
```

`notify` fires after the transition is persisted, with the friendly event name and the stored
`Payment`. It runs through orvacon's hooks, so a slow or throwing `notify` is reported through
`onError` and never blocks or breaks the payment flow.

## License

MIT
