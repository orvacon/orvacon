---
"orvacon": minor
---

Add `orvacon generate` — emits the database schema + default-deny RLS migration. By default it prints the SQL to stdout: the generated RLS is your payment data's security boundary, so it's meant to be read before it's applied. `--write` saves it to `supabase/migrations/<timestamp>_orvacon.sql` (creating the directory if needed) and refuses to overwrite an existing orvacon migration, so hand-customized RLS is never lost; `--force` writes a new timestamped migration instead. Apply with `supabase db push` — orvacon generates the migration and hands off to your database's own tooling rather than shipping a migration engine.
