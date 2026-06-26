# @orvacon/subkit

Recurring charges for [orvacon](https://orvacon.com), statelessly. subkit owns the subscription state
machine — deciding when a subscription is due, charging the saved card, advancing the period with
calendar-correct interval math, and routing a failed renewal through dunning — while your database owns the
rows and your cron drives the loop. It never holds money or a store: each charge runs card → your gateway,
and every state change comes back for you to persist.

## Install

```bash
bun add @orvacon/subkit @orvacon/dunningkit
```

## Use

```ts
import { subkit } from "@orvacon/subkit";
import { dunningkit, days } from "@orvacon/dunningkit";

const subs = subkit({
  orva,
  dunning: dunningkit({ schedule: [days(1), days(3), days(7)] }), // optional
});

// open a subscription (you persist the returned row):
let sub = subs.start({
  id: "sub_42",
  amount: money(5_000, "TRY"),
  card, // a vaultkit CardOnFile, or any { token, userKey? }
  interval: { unit: "month", count: 1 },
  firstChargeAt: now, // charge on the next tick; or now + trial; or addInterval(now, interval)
});

// your cron:
if (subs.due(sub, now)) {
  const { subscription } = await subs.run(sub, now);
  await myDb.subscriptions.update(sub.id, subscription); // active | past_due | canceled
}
```

`run` charges the saved card and folds the result into the next state: a success advances
`currentPeriodEnd` by one interval; a failure opens (or advances) dunning — `past_due` while retries remain,
`canceled` once they are spent. `cancel` / `pause` / `resume` round out the lifecycle. Renewal dates are
calendar-correct: a monthly subscription anchored on Jan 31 renews Feb 28, not skipping into March.

## Scope: a recurring charge, not a billing platform

subkit charges the **same amount each period** and handles renewal, dunning, and cancellation. Proration,
plan changes mid-cycle, metered/usage billing, tax (use `@orvacon/taxkit`), and invoicing
(`@orvacon/invoicekit`) live in your code above it — subkit stays the small, correct core they build on.

## License

MIT
