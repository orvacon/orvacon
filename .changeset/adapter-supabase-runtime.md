---
"@orvacon/adapter-supabase": minor
---

The Supabase adapter's runtime half: `supabaseAdapter({ sql })` implements `DatabaseAdapter` over a **direct Postgres connection** (postgres.js), not `@supabase/supabase-js` — the server needs real transactions and advisory locks that PostgREST cannot give, while supabase-js stays the dev's client-side, RLS-scoped tool. Compare-and-swap state transitions, `INSERT … ON CONFLICT` idempotency claims, and `sql.begin` transactions; `getLedgerHead` takes a global, transaction-scoped advisory lock so concurrent appends serialize onto the single global hash chain — genesis-safe, unlike `FOR UPDATE` on an empty table. The serverless connection requirement (transaction-mode pooler, `prepare: false`) is documented loudly. The package now peer-depends on `postgres`, not `@supabase/supabase-js`.

`Unverified — needs an integration run`: the SQL is type-correct, but its behavior (lock serialization, CAS, dedup) is only proven against a real Postgres — run the `DATABASE_URL`-gated integration tests against a local/Docker Postgres. The single global chain serializes all ledger appends (a deliberate v1 trade-off; per-tenant chains lift it when throughput demands). RLS generation lands next.
