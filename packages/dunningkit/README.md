# @orvacon/dunningkit

Recover a failed payment with a scheduled, backed-off retry policy — a stateless dunning state machine for
[orvacon](https://orvacon.com). It performs no charge and keeps no store: your cron re-runs the charge and
persists the state; dunningkit owns only the policy — when to retry, when to give up.

## Install

```bash
bun add @orvacon/dunningkit
```

## Use

```ts
import { dunningkit, hours, days } from "@orvacon/dunningkit";

const dunning = dunningkit({ schedule: [hours(1), days(1), days(3)] }); // three retries

// a charge failed — open a cycle and persist the state:
let state = dunning.open(outcome, now); // pass your orva.authorize() result straight in
await myDb.dunning.upsert(paymentId, state);

// your cron, for each due record:
if (dunning.due(state, now)) {
  const retry = await orva.authorize(charge);
  state = dunning.advance(state, retry, now);
  await myDb.dunning.upsert(paymentId, state);
  if (state.status === "exhausted" || state.status === "abandoned") {
    await markUnrecovered(paymentId); // e.g. cancel the subscription
  }
}
```

`open` / `advance` fold a charge outcome into the next `DunningState`:
`scheduled` → `recovered` (a retry succeeded) · `exhausted` (retryable failures ran the schedule out) ·
`abandoned` (a non-retryable error — gave up at once).

## Dunning is not the core's auto-retry

The core's `isRetryableError` governs *immediate* auto-retry (re-send the same request now), and only
`gateway_error` qualifies — a `declined` charge re-sent at once just declines again, risking a double
charge. Dunning is the opposite: a *delayed* re-attempt days later, when the customer may have topped up.
So dunningkit retries `declined` **and** `gateway_error` by default, while merchant-side errors
(`invalid_request`, `auth_error`, `conflict`) are abandoned at once — retrying them never helps. Override
with `shouldRetry: (code) => boolean`.

## License

MIT
