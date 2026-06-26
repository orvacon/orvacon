# @orvacon/fxkit

Show a price in the shopper's currency while you still charge in the merchant's. fxkit **never moves
custody** — it only formats, so it can't change what's authorized.

## Install

```bash
bun add @orvacon/fxkit
```

## Use

```ts
import { money } from "@orvacon/paykit";
import { fxkit } from "@orvacon/fxkit";

const fx = fxkit({
  rates: { rate: (from, to) => myRates.get(from, to) }, // your provider / cache / table
  locale: "tr-TR",
});

await fx.display(money(2999, "TRY"), "EUR"); // "≈ €0.83" — you still charge 29.99 TRY
```

`rate(from, to)` returns how many `to` units equal one `from` unit (major units); it may be async.
Decimals follow each currency's real scale via `Intl` — so a `JPY` display has none, and a `JPY`
base is read as whole yen. There is no `convert`-to-`Money`: fxkit is display-only by design, never a
step in a charge.

## License

MIT
