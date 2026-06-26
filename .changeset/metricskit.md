---
"@orvacon/metricskit": minor
---

Ship `@orvacon/metricskit` — a plugin that increments a counter on every payment lifecycle event (`authorized` / `captured` / `refunded` / `failed` / `voided`), tagged with the currency and connector. Wrap any sink (Prometheus, StatsD, OpenTelemetry) behind a single `inc(name, tags?)`; set `prefix` to rename the namespace.
