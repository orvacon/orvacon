import { describe, expect, test } from "bun:test";
import { days, dunningkit, hours } from "../src/index";

const NOW = "2026-06-01T00:00:00.000Z";
const ok = { ok: true } as const;
const declined = { ok: false, error: { code: "declined" } } as const;
const gatewayError = { ok: false, error: { code: "gateway_error" } } as const;
const authError = { ok: false, error: { code: "auth_error" } } as const;

describe("dunningkit", () => {
  test("open schedules the first retry at now + the first delay", () => {
    const d = dunningkit({ schedule: [hours(1), days(1)] });
    expect(d.open(declined, NOW)).toEqual({
      status: "scheduled",
      failures: 1,
      nextRetryAt: "2026-06-01T01:00:00.000Z",
    });
  });

  test("a recovered retry ends the cycle", () => {
    const d = dunningkit({ schedule: [hours(1)] });
    const s = d.open(gatewayError, NOW);
    expect(d.advance(s, ok, "2026-06-01T01:00:00.000Z")).toEqual({
      status: "recovered",
      failures: 1,
    });
  });

  test("each failure schedules the next delay, then exhausts", () => {
    const d = dunningkit({ schedule: [hours(1), days(1)] }); // two retries
    let s = d.open(declined, NOW); // failure 1, retry at +1h
    s = d.advance(s, declined, "2026-06-01T01:00:00.000Z"); // failure 2, retry at +1d
    expect(s).toEqual({
      status: "scheduled",
      failures: 2,
      nextRetryAt: "2026-06-02T01:00:00.000Z",
    });
    s = d.advance(s, declined, "2026-06-02T01:00:00.000Z"); // failure 3, schedule spent
    expect(s).toEqual({ status: "exhausted", failures: 3 });
  });

  test("a non-retryable error is abandoned at once, no retries spent", () => {
    const d = dunningkit({ schedule: [hours(1), days(1)] });
    expect(d.open(authError, NOW)).toEqual({
      status: "abandoned",
      failures: 1,
      code: "auth_error",
    });
  });

  test("declined is retried by default — a delayed re-attempt, not the core's auto-retry", () => {
    const d = dunningkit({ schedule: [days(3)] });
    expect(d.open(declined, NOW).status).toBe("scheduled");
  });

  test("shouldRetry overrides which codes are worth a re-attempt", () => {
    const d = dunningkit({ schedule: [hours(1)], shouldRetry: (code) => code === "gateway_error" });
    expect(d.open(declined, NOW).status).toBe("abandoned");
    expect(d.open(gatewayError, NOW).status).toBe("scheduled");
  });

  test("due is true only once the next retry time has arrived", () => {
    const d = dunningkit({ schedule: [hours(1)] });
    const s = d.open(declined, NOW);
    expect(d.due(s, "2026-06-01T00:30:00.000Z")).toBe(false);
    expect(d.due(s, "2026-06-01T01:00:00.000Z")).toBe(true);
  });

  test("rejects an empty or negative schedule at setup", () => {
    expect(() => dunningkit({ schedule: [] })).toThrow(TypeError);
    expect(() => dunningkit({ schedule: [hours(1), -1] })).toThrow(TypeError);
  });
});
