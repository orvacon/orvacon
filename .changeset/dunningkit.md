---
"@orvacon/dunningkit": minor
---

Ship `@orvacon/dunningkit` — a stateless dunning state machine for recovering failed charges. `dunningkit({ schedule })` opens a cycle from a failed charge, schedules backed-off retries (`open` → `due` → `advance`), and lands on `recovered` / `exhausted` / `abandoned`. Dunning's delayed re-attempt differs from the core's immediate auto-retry: a `declined` charge is retried days later (the customer may have topped up), while merchant-side errors (`invalid_request`, `auth_error`) are abandoned at once. The dev owns the store and the cron; dunningkit owns the policy.
