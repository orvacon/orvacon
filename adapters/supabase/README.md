# @orvacon/adapter-supabase

The Supabase database adapter for **[orvacon](https://github.com/orvacon/orvacon)** — a direct Postgres connection (real transactions, advisory locks) plus a generator for the schema with default-deny row-level security.

**Adapter.** Binds via `database:`.

## Install

```bash
bun add @orvacon/adapter-supabase @orvacon/paykit postgres
```

## Use

```ts
import { orvacon } from "@orvacon/paykit";
import { supabaseAdapter } from "@orvacon/adapter-supabase";
import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL!);
const orva = orvacon({
  database: supabaseAdapter({ sql }),
  // …connectors, webhookSigningKey
});
```

Generate the schema and its default-deny RLS with `npx orvacon generate --write`, then `supabase db push`. Each state transition and its ledger write share one transaction — a payment can never land half-applied.

## License

MIT
