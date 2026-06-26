import { describe, expect, test } from "bun:test";
import { days, dunningkit } from "@orvacon/dunningkit";
import { money, type OperationOutcome, orvacon } from "@orvacon/paykit";
import { mockConnector, mockDatabase, testSigningKey } from "@orvacon/testkit";
import { addInterval, subkit } from "../src/index";

const NOW = "2026-01-15T00:00:00.000Z";
const monthly = { unit: "month", count: 1 } as const;
const card = { token: "tok_test", userKey: "uk_test" };
const amount = money(5_000, "TRY");

function realOrva() {
  return orvacon({
    connectors: [mockConnector()],
    database: mockDatabase(),
    webhookSigningKey: testSigningKey,
  });
}

function failingOrva(code: "declined" | "gateway_error") {
  return {
    authorize: async (): Promise<OperationOutcome> => ({
      ok: false,
      error: { code, message: `mock ${code}` },
    }),
  };
}

function newSub(subs: ReturnType<typeof subkit>, firstChargeAt: string, id = "s1") {
  return subs.start({ id, amount, card, interval: monthly, firstChargeAt });
}

describe("subkit", () => {
  test("start opens an active subscription due at firstChargeAt", () => {
    const subs = subkit({ orva: realOrva() });
    const sub = newSub(subs, "2026-02-01T00:00:00.000Z");
    expect(sub.status).toBe("active");
    expect(sub.currentPeriodEnd).toBe("2026-02-01T00:00:00.000Z");
    expect(subs.due(sub, NOW)).toBe(false);
    expect(subs.due(sub, "2026-02-01T00:00:00.000Z")).toBe(true);
  });

  test("a successful run charges the card and advances the period", async () => {
    const subs = subkit({ orva: realOrva() });
    const { subscription, outcome } = await subs.run(newSub(subs, NOW), NOW);
    expect(outcome.ok).toBe(true);
    expect(subscription.status).toBe("active");
    expect(subscription.currentPeriodEnd).toBe("2026-02-15T00:00:00.000Z");
    expect(subscription.dunning).toBeUndefined();
  });

  test("monthly renewal clamps to the month end (Jan 31 → Feb 28)", async () => {
    const subs = subkit({ orva: realOrva() });
    const sub = newSub(subs, "2026-01-31T00:00:00.000Z");
    const { subscription } = await subs.run(sub, "2026-01-31T00:00:00.000Z");
    expect(subscription.currentPeriodEnd).toBe("2026-02-28T00:00:00.000Z");
  });

  test("a failed renewal enters dunning, then cancels once the schedule is spent", async () => {
    const subs = subkit({
      orva: failingOrva("declined"),
      dunning: dunningkit({ schedule: [days(1)] }),
    });
    const first = await subs.run(newSub(subs, NOW), NOW);
    expect(first.subscription.status).toBe("past_due");
    expect(first.subscription.dunning).toMatchObject({ status: "scheduled", failures: 1 });

    const dueAt =
      first.subscription.dunning?.status === "scheduled"
        ? first.subscription.dunning.nextRetryAt
        : NOW;
    expect(subs.due(first.subscription, NOW)).toBe(false);
    expect(subs.due(first.subscription, dueAt)).toBe(true);

    const second = await subs.run(first.subscription, dueAt);
    expect(second.subscription.status).toBe("canceled");
  });

  test("without a dunning policy, a failed renewal cancels at once", async () => {
    const subs = subkit({ orva: failingOrva("declined") });
    const { subscription } = await subs.run(newSub(subs, NOW), NOW);
    expect(subscription.status).toBe("canceled");
  });

  test("the per-charge idempotency key is stable, so a re-run does not double charge", async () => {
    const subs = subkit({ orva: realOrva() });
    const sub = newSub(subs, NOW, "idem");
    const first = await subs.run(sub, NOW);
    const second = await subs.run(sub, NOW); // same input state → same key
    expect(first.outcome.ok && second.outcome.ok).toBe(true);
    if (first.outcome.ok && second.outcome.ok) {
      expect(second.outcome.paymentId).toBe(first.outcome.paymentId);
    }
  });

  test("cancel, pause, and resume drive the lifecycle", () => {
    const subs = subkit({ orva: realOrva() });
    const sub = newSub(subs, "2026-02-01T00:00:00.000Z");
    expect(subs.cancel(sub).status).toBe("canceled");

    const paused = subs.pause(sub);
    expect(paused.status).toBe("paused");
    expect(subs.due(paused, "2026-03-01T00:00:00.000Z")).toBe(false);

    const resumed = subs.resume(paused, "2026-02-10T00:00:00.000Z");
    expect(resumed.status).toBe("active");
    expect(resumed.currentPeriodEnd).toBe("2026-03-10T00:00:00.000Z");
  });

  test("start rejects a non-positive interval", () => {
    const subs = subkit({ orva: realOrva() });
    expect(() =>
      subs.start({
        id: "x",
        amount,
        card,
        interval: { unit: "month", count: 0 },
        firstChargeAt: NOW,
      }),
    ).toThrow(TypeError);
  });

  test("addInterval does day/week/month/year with month-end and leap clamping", () => {
    expect(addInterval(NOW, { unit: "day", count: 10 })).toBe("2026-01-25T00:00:00.000Z");
    expect(addInterval(NOW, { unit: "week", count: 2 })).toBe("2026-01-29T00:00:00.000Z");
    expect(addInterval("2026-01-31T00:00:00.000Z", { unit: "month", count: 1 })).toBe(
      "2026-02-28T00:00:00.000Z",
    );
    expect(addInterval("2024-02-29T00:00:00.000Z", { unit: "year", count: 1 })).toBe(
      "2025-02-28T00:00:00.000Z",
    );
  });
});
