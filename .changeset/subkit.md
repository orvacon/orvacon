---
"@orvacon/subkit": minor
---

Ship `@orvacon/subkit` — recurring charges, statelessly. `subkit({ orva, dunning })` owns the subscription state machine: `start` → `due` → `run` charges the saved card, advances the period with calendar-correct interval math (month/year clamp to the month end), and routes a failed renewal through an injected dunningkit policy (`past_due` → recovered / canceled). `cancel` / `pause` / `resume` round out the lifecycle, and the per-charge idempotency key is derived from the subscription id + period + dunning attempt so a cron that fires twice never double charges. It holds no money and no store — your database owns the rows, your cron drives the loop. Scope is a recurring charge, not a billing platform: proration, plan changes, and metered usage live above it.
