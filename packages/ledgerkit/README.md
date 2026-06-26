# @orvacon/ledgerkit

Export [orvacon](https://orvacon.com)'s hash-chained ledger to CSV / double-entry rows, and verify the
chain. The core already keeps a tamper-evident double-entry ledger; ledgerkit turns a slice of it into
something your accountant can import, and re-checks the links. It's stateless — you fetch the entries,
it formats and verifies.

## Install

```bash
bun add @orvacon/ledgerkit
```

## Use

```ts
import { ledgerkit } from "@orvacon/ledgerkit";

const lk = ledgerkit();

// `entries` is the LedgerEntry[] you read from your database
const csv = lk.toCsv(entries); // date,paymentId,account,debit,credit,currency,hash
const rows = lk.toRows(entries); // the same as structured objects

const check = lk.verifyChain(entries);
// { ok: true } | { ok: false, brokenAt: 4 }
```

Each entry becomes a double-entry row (exactly one of `debit` / `credit` filled); amounts are plain
decimal strings in major units (`"24.00"`, machine-parseable, not localized); CSV is RFC 4180 (cells
with commas are quoted). `verifyChain` confirms each entry's `prevHash` equals the previous entry's
`hash` and points at the first break.

## License

MIT
