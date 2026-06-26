# @orvacon/testkit

Drive [orvacon](https://orvacon.com) payment flows in a unit test — **no gateway account, no database, no network.**

The mock connector and database productize orvacon's own proven test doubles, so a test exercises the real orchestrator rather than a stand-in.

## Install

```bash
bun add -D @orvacon/testkit
```

## Use

```ts
import { idempotencyKey, money, orvacon } from "@orvacon/paykit";
import { mockConnector, mockDatabase, mockCallback, testCards, testSigningKey } from "@orvacon/testkit";

const db = mockDatabase();
const orva = orvacon({
  database: db,
  connectors: [mockConnector()],
  webhookSigningKey: testSigningKey,
});

const outcome = await orva.authorize({
  idempotencyKey: idempotencyKey(crypto.randomUUID()),
  amount: money(2500, "TRY"),
  source: { type: "card", card: testCards.success },
  threeDSecure: true,
});

// 3-D Secure: finalize with the callback the gateway would have POSTed.
if (outcome.ok && outcome.status === "requires_action") {
  await orva.handleWebhook(
    "mock",
    mockCallback({ paymentId: outcome.paymentId, amount: money(2500, "TRY") }),
  );
  // db.payments.get(outcome.paymentId)?.status === "captured"
}
```

## Exports

| Export | What it does |
| --- | --- |
| `mockConnector(opts?)` | A deterministic in-memory gateway. The card decides the outcome; `threeDSecure: true` returns `requires_action`. Capabilities (`autoCapture`, …) and the `reconcile` outcome are overridable. |
| `mockDatabase()` | An in-memory `DatabaseAdapter` with its `payments` / `ledger` / `idempotency` stores exposed for assertions. |
| `mockCallback(input)` | The `RawWebhook` a 3-D Secure callback delivers — feed it to `handleWebhook`. |
| `mockReconcile(input)` | A resolved `ReconcileOutcome` for the `mockConnector({ reconcile })` option, to drive `reconcile()`. |
| `testCards` / `testToken` | Magic fixtures: `success`, `declined`, `gatewayError`. |
| `testSigningKey` / `testPublicKey` | A throwaway Ed25519 pair, so no `orvacon keys` is needed in a test. |

## Test cards

| Card | Outcome |
| --- | --- |
| `testCards.success` | authorizes (and returns a challenge under `threeDSecure`) |
| `testCards.declined` | `{ ok: false, error: { code: "declined" } }` — final |
| `testCards.gatewayError` | `{ ok: false, error: { code: "gateway_error" } }` — the one auto-retry class |

> `testSigningKey` is a real Ed25519 secret published in this package — for tests only, never production.

Full reference: **[orvacon.com/docs/testkit](https://orvacon.com/docs/testkit)**.

## License

MIT
