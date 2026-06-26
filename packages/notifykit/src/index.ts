import type { OrvaconPlugin, Payment } from "@orvacon/paykit";

/** A notable payment moment, normalized to a friendly name. */
export type NotifyEvent = "captured" | "refunded" | "failed";

/** Options for {@link notifykit}. */
export interface NotifykitOptions {
  /**
   * Called after the event's state change is persisted. Wire it to email, SMS,
   * Slack — anything. A slow or throwing `notify` never blocks or breaks the
   * payment flow (it is reported through `onError`).
   */
  notify: (event: NotifyEvent, payment: Payment) => void | Promise<void>;
}

/**
 * An orvacon plugin that calls `notify` when a payment is captured, refunded, or
 * fails. It reacts through `hooks`, so it observes the lifecycle without ever
 * touching the charge.
 *
 * ```ts
 * orvacon({ plugins: [notifykit({ notify: (event, p) => mailer.send(p.userId, event) })] });
 * ```
 */
export function notifykit(options: NotifykitOptions): OrvaconPlugin {
  const on = (event: NotifyEvent) => (payment: Payment) => options.notify(event, payment);
  return {
    name: "notifykit",
    hooks: {
      "payment.captured": on("captured"),
      "payment.refunded": on("refunded"),
      "payment.failed": on("failed"),
    },
  };
}
