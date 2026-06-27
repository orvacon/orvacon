# @orvacon/metricskit

Emit payment metrics to your observability sink — an [orvacon](https://orvacon.com) plugin. It
increments a counter on every lifecycle event, tagged with the currency and connector, so you get
success / failure / refund rates and volume by gateway in your existing dashboards.

**Plugin kit.** Binds via `plugins: []` — lifecycle hooks.

## Install

```bash
bun add @orvacon/metricskit
```

## Use

```ts
import { orvacon } from "@orvacon/paykit";
import { metricskit } from "@orvacon/metricskit";

const orva = orvacon({
  // … database, connectors, webhookSigningKey
  plugins: [metricskit({ sink: { inc: (name, tags) => prometheus.inc(name, tags) } })],
});
// → orvacon.payment.captured{currency="TRY",connector="iyzico"}
```

The `sink` is a single `inc(name, tags?)` — wrap Prometheus, StatsD, OpenTelemetry, or your own
counter. metricskit counts `authorized` / `captured` / `refunded` / `failed` / `voided`; set `prefix`
to rename the metric namespace (default `"orvacon"`). Counts only — derive revenue from your own
records.

## License

MIT
