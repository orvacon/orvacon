---
"@orvacon/adapter-supabase": minor
---

Add `supabaseSchema()` — generates the migration SQL (schema + default-deny RLS) for orvacon's core tables. Emits `payments`, `ledger`, and `idempotency_keys` with the columns the runtime adapter reads, plus the RLS posture: row-level security enabled and forced on every table; client writes denied (no INSERT/UPDATE policy, so the server's BYPASSRLS role is the only writer); a client reads only its own payment via the `(select auth.uid())` wrapper; and the ledger made append-only at the privilege level (`revoke update, delete`) with a `unique (prev_hash)` constraint that refuses a forked hash chain even if the advisory lock were bypassed. The CLI writes this verbatim into a migration.
