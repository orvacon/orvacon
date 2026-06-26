import type { ConnectorErrorCode } from "@orvacon/paykit";

/** `n` minutes in milliseconds, for building a {@link DunningkitOptions.schedule}. */
export const minutes = (n: number): number => n * 60_000;
/** `n` hours in milliseconds, for building a {@link DunningkitOptions.schedule}. */
export const hours = (n: number): number => n * 3_600_000;
/** `n` days in milliseconds, for building a {@link DunningkitOptions.schedule}. */
export const days = (n: number): number => n * 86_400_000;

/**
 * A charge outcome dunning folds in. Your `orva.authorize(...)` result is assignable
 * to this — pass it straight through — but tests can pass the minimal shape too.
 */
export type ChargeOutcome = { ok: true } | { ok: false; error: { code: ConnectorErrorCode } };

/**
 * The state of one dunning cycle. Persist it against the failed payment; it is a
 * plain value, never held by the kit.
 *
 * - `scheduled` — a retry is queued for `nextRetryAt`.
 * - `recovered` — a retry succeeded; stop.
 * - `exhausted` — retryable failures ran the schedule out; give up.
 * - `abandoned` — a non-retryable error (a merchant-side `code`); gave up at once.
 */
export type DunningState =
  | { status: "scheduled"; failures: number; nextRetryAt: string }
  | { status: "recovered"; failures: number }
  | { status: "exhausted"; failures: number }
  | { status: "abandoned"; failures: number; code: ConnectorErrorCode };

/** Configuration for {@link dunningkit}. */
export interface DunningkitOptions {
  /**
   * The delay before each retry, in milliseconds — one entry per retry.
   * `[hours(1), days(1), days(3)]` retries three times: an hour after the failure,
   * then a day, then three days. Once the last delay's retry fails, dunning is
   * `exhausted`. Build it with {@link hours} / {@link days}.
   */
  schedule: readonly number[];
  /**
   * Which failure codes are worth a *delayed* re-attempt. Dunning is not the core's
   * immediate auto-retry: a `declined` charge must not be retried at once (it just
   * declines again), but it is worth re-attempting days later — the customer may
   * have topped up. Defaults to `declined` + `gateway_error`; `invalid_request`,
   * `auth_error`, and `conflict` are merchant-side and abandoned at once.
   */
  shouldRetry?: (code: ConnectorErrorCode) => boolean;
}

/** What {@link dunningkit} returns. */
export interface Dunningkit {
  /** Open a dunning cycle from the first charge's outcome. */
  open(outcome: ChargeOutcome, now: string): DunningState;
  /** Fold a retry's outcome into the next state. Pass the `scheduled` state you stored. */
  advance(state: DunningState, outcome: ChargeOutcome, now: string): DunningState;
  /** Whether a `scheduled` state is due to retry at `now`. */
  due(state: DunningState, now: string): boolean;
}

const DEFAULT_RETRYABLE: ReadonlySet<ConnectorErrorCode> = new Set(["declined", "gateway_error"]);

/**
 * A stateless dunning state machine: recover a failed charge with a backed-off
 * retry schedule. It performs no charge and keeps no store — your cron re-runs the
 * charge and persists the {@link DunningState}; dunningkit owns only the policy
 * (when to retry, when to give up). Drive it `open` → `due` → `advance`.
 *
 * ```ts
 * const dunning = dunningkit({ schedule: [hours(1), days(1), days(3)] });
 *
 * // a charge failed:
 * let state = dunning.open(outcome, now);
 *
 * // your cron, for each due record:
 * if (dunning.due(state, now)) {
 *   const retry = await orva.authorize(charge);
 *   state = dunning.advance(state, retry, now);
 *   if (state.status !== "scheduled") await stopDunning(payment, state);
 * }
 * ```
 */
export function dunningkit(options: DunningkitOptions): Dunningkit {
  const { schedule } = options;
  if (schedule.length === 0) {
    throw new TypeError("dunningkit: schedule needs at least one retry delay");
  }
  if (schedule.some((delay) => !Number.isFinite(delay) || delay < 0)) {
    throw new TypeError(
      "dunningkit: every schedule delay must be a finite, non-negative number of milliseconds",
    );
  }
  const retryable =
    options.shouldRetry ?? ((code: ConnectorErrorCode) => DEFAULT_RETRYABLE.has(code));

  const at = (now: string, delayMs: number): string =>
    new Date(Date.parse(now) + delayMs).toISOString();

  const afterFailure = (failures: number, code: ConnectorErrorCode, now: string): DunningState => {
    if (!retryable(code)) {
      return { status: "abandoned", failures, code };
    }
    const delay = schedule[failures - 1];
    if (delay === undefined) {
      return { status: "exhausted", failures };
    }
    return { status: "scheduled", failures, nextRetryAt: at(now, delay) };
  };

  return {
    open: (outcome, now) =>
      outcome.ok ? { status: "recovered", failures: 0 } : afterFailure(1, outcome.error.code, now),

    advance: (state, outcome, now) =>
      outcome.ok
        ? { status: "recovered", failures: state.failures }
        : afterFailure(state.failures + 1, outcome.error.code, now),

    due: (state, now) =>
      state.status === "scheduled" && Date.parse(now) >= Date.parse(state.nextRetryAt),
  };
}
