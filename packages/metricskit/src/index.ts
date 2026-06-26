import type { OrvaconPlugin, Payment } from "@orvacon/paykit";

/** The counter metricskit increments — wrap Prometheus, StatsD, OpenTelemetry, or your own. */
export interface MetricsSink {
  inc: (name: string, tags?: Record<string, string>) => void;
}

/** Options for {@link metricskit}. */
export interface MetricskitOptions {
  /** Where the counts go. */
  sink: MetricsSink;
  /** Metric name prefix. Default `"orvacon"`. */
  prefix?: string;
}

/**
 * An orvacon plugin that increments a counter on every payment lifecycle event,
 * tagged with the currency and connector — so you get success / failure / refund
 * rates and volume by gateway in your existing dashboards. Counts only; derive
 * revenue from your own records.
 *
 * ```ts
 * orvacon({ plugins: [metricskit({ sink: prometheus })] });
 * // → orvacon.payment.captured{currency="TRY",connector="iyzico"}
 * ```
 */
export function metricskit(options: MetricskitOptions): OrvaconPlugin {
  const prefix = options.prefix ?? "orvacon";
  const count = (name: string) => (payment: Payment) => {
    options.sink.inc(`${prefix}.payment.${name}`, {
      currency: payment.amount.currency,
      connector: payment.connectorId,
    });
  };
  return {
    name: "metricskit",
    hooks: {
      "payment.authorized": count("authorized"),
      "payment.captured": count("captured"),
      "payment.refunded": count("refunded"),
      "payment.failed": count("failed"),
      "payment.voided": count("voided"),
    },
  };
}
