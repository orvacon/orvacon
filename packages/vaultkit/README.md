# @orvacon/vaultkit

Saved cards on file, statelessly. The gateway vaults the card and [orvacon](https://orvacon.com) returns a
token; vaultkit normalizes that into a `CardOnFile` you persist against your own customer, hands it back as
a charge `PaymentSource`, and deletes it when asked. It keeps no store of its own — your database stays the
single home for which customer owns which card.

**Service kit.** Wraps `orva`.

## Install

```bash
bun add @orvacon/vaultkit
```

## Use

```ts
import { vaultkit } from "@orvacon/vaultkit";

const vault = vaultkit({ orva });

// vault a card → a persist-ready record
const saved = await vault.save({ card, buyer, customerRef: "cus_42" });
if (saved.ok) {
  await myDb.cards.insert(saved.card); // { token, userKey?, brand, last4, label, ... }
}

// charge it again later
await orva.authorize({ ...req, source: vault.toSource(saved.card) });

// and forget it
await vault.forget(saved.card);
```

`save` returns a discriminated result (`{ ok: true, card } | { ok: false, error }`) — the gateway's error
passes through, never thrown. `label` renders `"Visa •••• 4242"` (falling back to `"Card •••• 4242"`, then
`"Saved card"`). `toSource` and `forget` also accept a bare `{ token, userKey? }`, so a row read straight
back from your database works without rebuilding a `CardOnFile`.

vaultkit holds no store: orvacon never persists card tokens, so the card number reaches the gateway and is
gone — only the token and display detail come back for you to keep.

## License

MIT
