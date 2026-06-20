# @orvacon/adapter-supabase

## 0.1.1

### Patch Changes

- Fix the published packages so they install. Internal `@orvacon/*` dependencies were left as the `workspace:` protocol, which npm cannot resolve — the libraries were uninstallable. They now use explicit semver ranges. Also add a per-package README so the npm page is not bare.
- Updated dependencies
  - @orvacon/paykit@0.1.1

## 0.1.0

### Minor Changes

- dc9b642: The Supabase adapter's runtime half: `supabaseAdapter({ sql })` implements `DatabaseAdapter` over a **direct Postgres connection** (postgres.js), not `@supabase/supabase-js` — the server needs real transactions and advisory locks that PostgREST cannot give, while supabase-js stays the dev's client-side, RLS-scoped tool. Compare-and-swap state transitions, `INSERT … ON CONFLICT` idempotency claims, and `sql.begin` transactions; `getLedgerHead` takes a global, transaction-scoped advisory lock so concurrent appends serialize onto the single global hash chain — genesis-safe, unlike `FOR UPDATE` on an empty table. The serverless connection requirement (transaction-mode pooler, `prepare: false`) is documented loudly. The package now peer-depends on `postgres`, not `@supabase/supabase-js`.

  `Unverified — needs an integration run`: the SQL is type-correct, but its behavior (lock serialization, CAS, dedup) is only proven against a real Postgres — run the `DATABASE_URL`-gated integration tests against a local/Docker Postgres. The single global chain serializes all ledger appends (a deliberate v1 trade-off; per-tenant chains lift it when throughput demands). RLS generation lands next.

- 56920b8: Add `supabaseSchema()` — generates the migration SQL (schema + default-deny RLS) for orvacon's core tables. Emits `payments`, `ledger`, and `idempotency_keys` with the columns the runtime adapter reads, plus the RLS posture: row-level security enabled and forced on every table; client writes denied (no INSERT/UPDATE policy, so the server's BYPASSRLS role is the only writer); a client reads only its own payment via the `(select auth.uid())` wrapper; and the ledger made append-only at the privilege level (`revoke update, delete`) with a `unique (prev_hash)` constraint that refuses a forked hash chain even if the advisory lock were bypassed. The CLI writes this verbatim into a migration.

### Patch Changes

- Updated dependencies [46cc3f8]
- Updated dependencies [57e0933]
- Updated dependencies [66d0558]
- Updated dependencies [28b5c5f]
- Updated dependencies [4555ca9]
- Updated dependencies [e7a0d8a]
- Updated dependencies [d871036]
- Updated dependencies [8eb1cfb]
- Updated dependencies [a0229b7]
- Updated dependencies [8ada81f]
  - @orvacon/paykit@0.1.0
