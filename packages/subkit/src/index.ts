import { type DunningState, dunningkit } from "@orvacon/dunningkit";
import {
  type Buyer,
  type ConnectorErrorCode,
  idempotencyKey,
  type Money,
  type OperationOutcome,
  type Orvacon,
} from "@orvacon/paykit";

export type { DunningState } from "@orvacon/dunningkit";
export { days, hours, minutes } from "@orvacon/dunningkit";

/** How often a subscription renews. Month/year billing clamps to the month end (Jan 31 → Feb 28). */
export type Interval =
  | { unit: "day"; count: number }
  | { unit: "week"; count: number }
  | { unit: "month"; count: number }
  | { unit: "year"; count: number };

/** A reference to the saved card to charge — a vaultkit `CardOnFile` satisfies it. */
export interface CardRef {
  token: string;
  userKey?: string;
}

/** Where a subscription is in its lifecycle. */
export type SubscriptionStatus = "active" | "past_due" | "paused" | "canceled";

/**
 * One subscription's state. It is a plain value you persist against your own
 * customer — subkit keeps no store. Fold each {@link Subkit.run} result back into
 * your row.
 */
export interface Subscription {
  /** Your identifier for the subscription; subkit derives the per-charge idempotency key from it. */
  id: string;
  /** The amount charged each period. */
  amount: Money;
  /** The saved card charged each period. */
  card: CardRef;
  /** How often it renews. */
  interval: Interval;
  /** The cardholder, where the gateway requires one to charge a token. */
  buyer?: Buyer;
  /** Which gateway to charge, when several connectors are configured. */
  connectorId?: string;
  /** Lifecycle status. */
  status: SubscriptionStatus;
  /** When the current period ends — the next charge is due at or after this (ISO). */
  currentPeriodEnd: string;
  /** Dunning state while a renewal is failing; cleared once recovered. */
  dunning?: DunningState;
}

/** Input to {@link Subkit.start}. */
export interface StartInput {
  id: string;
  amount: Money;
  card: CardRef;
  interval: Interval;
  /**
   * When the first subkit-managed charge falls due (ISO). Pass `now` to charge on
   * the next tick, `now + trial` for a trial, or `addInterval(now, interval)` when
   * signup already collected the first period.
   */
  firstChargeAt: string;
  buyer?: Buyer;
  connectorId?: string;
}

/** Outcome of {@link Subkit.run}: the next subscription state and the charge result. */
export interface RunResult {
  subscription: Subscription;
  outcome: OperationOutcome;
}

/** Configuration for {@link subkit}. */
export interface SubkitOptions {
  /** The orvacon instance that charges the saved card. */
  orva: Pick<Orvacon, "authorize">;
  /**
   * The dunning retry schedule (ms per retry) for a failed renewal — build it with
   * the re-exported {@link days} / {@link hours}. Omit it and a failed charge cancels
   * the subscription at once.
   */
  retries?: readonly number[];
  /** Which failure codes a renewal retries; defaults to dunningkit's policy (`declined` + `gateway_error`). */
  shouldRetry?: (code: ConnectorErrorCode) => boolean;
}

/** What {@link subkit} returns. */
export interface Subkit {
  /** Open a subscription. Persist the returned state. */
  start(input: StartInput): Subscription;
  /** Whether a charge is due at `now` — a renewal (active) or a dunning retry (past_due). */
  due(subscription: Subscription, now: string): boolean;
  /** Charge a due subscription and fold the result into its next state. */
  run(subscription: Subscription, now: string): Promise<RunResult>;
  /** Cancel a subscription. */
  cancel(subscription: Subscription): Subscription;
  /** Pause billing; `due` returns false until resumed. */
  pause(subscription: Subscription): Subscription;
  /** Resume a paused subscription; the next charge falls one interval after `now`. */
  resume(subscription: Subscription, now: string): Subscription;
}

/**
 * Advance an ISO timestamp by an {@link Interval}. Day/week add fixed spans;
 * month/year use calendar math and clamp to the month end, so a renewal anchored
 * on Jan 31 lands on Feb 28 (or 29), not skipping into March.
 */
export function addInterval(iso: string, interval: Interval): string {
  const base = new Date(Date.parse(iso));
  if (interval.unit === "day") {
    base.setUTCDate(base.getUTCDate() + interval.count);
    return base.toISOString();
  }
  if (interval.unit === "week") {
    base.setUTCDate(base.getUTCDate() + interval.count * 7);
    return base.toISOString();
  }
  const months = interval.unit === "year" ? interval.count * 12 : interval.count;
  return addMonths(base, months).toISOString();
}

function addMonths(date: Date, months: number): Date {
  const dayOfMonth = date.getUTCDate();
  const shifted = new Date(date);
  shifted.setUTCDate(1);
  shifted.setUTCMonth(shifted.getUTCMonth() + months);
  const daysInTargetMonth = new Date(
    Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth() + 1, 0),
  ).getUTCDate();
  shifted.setUTCDate(Math.min(dayOfMonth, daysInTargetMonth));
  return shifted;
}

/**
 * Recurring charges, statelessly. subkit owns the billing state machine — when a
 * subscription is due, charging the saved card, advancing the period, and routing a
 * failed renewal through a built-in dunning schedule — while your database owns the
 * subscription rows and your cron drives the loop. It never holds money or a store:
 * each charge runs card → your gateway, and every state change comes back to persist.
 *
 * Scope is deliberately a recurring *charge*, not a billing platform: same amount
 * each period, calendar-correct renewal, dunning on failure. Proration, plan
 * changes, metered usage, tax (taxkit), and invoicing (invoicekit) live above it.
 *
 * ```ts
 * import { subkit, days } from "@orvacon/subkit";
 *
 * const subs = subkit({ orva, retries: [days(1), days(3), days(7)] });
 * let sub = subs.start({ id, amount, card, interval: { unit: "month", count: 1 }, firstChargeAt: now });
 *
 * // your cron:
 * if (subs.due(sub, now)) {
 *   const { subscription } = await subs.run(sub, now);
 *   await myDb.subscriptions.update(sub.id, subscription); // persist the next state
 * }
 * ```
 */
export function subkit(options: SubkitOptions): Subkit {
  const { orva } = options;
  const dunning =
    options.retries && options.retries.length > 0
      ? dunningkit({ schedule: options.retries, shouldRetry: options.shouldRetry })
      : undefined;

  return {
    start(input) {
      if (!Number.isInteger(input.interval.count) || input.interval.count < 1) {
        throw new TypeError("subkit: interval.count must be a positive integer");
      }
      return {
        id: input.id,
        amount: input.amount,
        card: input.card,
        interval: input.interval,
        buyer: input.buyer,
        connectorId: input.connectorId,
        status: "active",
        currentPeriodEnd: input.firstChargeAt,
      };
    },

    due(subscription, now) {
      if (subscription.status === "active") {
        return Date.parse(now) >= Date.parse(subscription.currentPeriodEnd);
      }
      if (subscription.status === "past_due") {
        return (
          subscription.dunning?.status === "scheduled" &&
          Date.parse(now) >= Date.parse(subscription.dunning.nextRetryAt)
        );
      }
      return false;
    },

    async run(subscription, now) {
      if (subscription.status !== "active" && subscription.status !== "past_due") {
        throw new Error(`subkit: cannot charge a ${subscription.status} subscription`);
      }
      const failures = subscription.dunning?.failures ?? 0;
      const outcome = await orva.authorize({
        idempotencyKey: idempotencyKey(
          `sub:${subscription.id}:${subscription.currentPeriodEnd}:${failures}`,
        ),
        amount: subscription.amount,
        source: {
          type: "token",
          token: { token: subscription.card.token, userKey: subscription.card.userKey },
        },
        buyer: subscription.buyer,
        connectorId: subscription.connectorId,
      });

      if (outcome.ok) {
        return {
          outcome,
          subscription: {
            ...subscription,
            status: "active",
            currentPeriodEnd: addInterval(subscription.currentPeriodEnd, subscription.interval),
            dunning: undefined,
          },
        };
      }

      const prior = subscription.status === "past_due" ? subscription.dunning : undefined;
      const next = dunning
        ? prior
          ? dunning.advance(prior, outcome, now)
          : dunning.open(outcome, now)
        : undefined;
      if (next?.status === "scheduled") {
        return { outcome, subscription: { ...subscription, status: "past_due", dunning: next } };
      }
      return {
        outcome,
        subscription: {
          ...subscription,
          status: "canceled",
          dunning: next ?? subscription.dunning,
        },
      };
    },

    cancel(subscription) {
      return { ...subscription, status: "canceled" };
    },

    pause(subscription) {
      return { ...subscription, status: "paused" };
    },

    resume(subscription, now) {
      return {
        ...subscription,
        status: "active",
        currentPeriodEnd: addInterval(now, subscription.interval),
      };
    },
  };
}
