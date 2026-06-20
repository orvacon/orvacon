# orvacon

## 0.1.0

### Minor Changes

- 7b1267e: Add `orvacon generate` — emits the database schema + default-deny RLS migration. By default it prints the SQL to stdout: the generated RLS is your payment data's security boundary, so it's meant to be read before it's applied. `--write` saves it to `supabase/migrations/<timestamp>_orvacon.sql` (creating the directory if needed) and refuses to overwrite an existing orvacon migration, so hand-customized RLS is never lost; `--force` writes a new timestamped migration instead. Apply with `supabase db push` — orvacon generates the migration and hands off to your database's own tooling rather than shipping a migration engine.
- a0229b7: Add the `keys` command: `npx orvacon keys` generates an Ed25519 webhook signing key pair (wrapping cryptokit's `generateSigningKeyPair`) and writes the `ORVACON_WEBHOOK_SIGNING_KEY` (secret) and `ORVACON_WEBHOOK_PUBLIC_KEY` (public) lines to stdout, with usage guidance on stderr so `orvacon keys >> .env.local` captures just the keys. The secret feeds `orvacon({ webhookSigningKey })`; the public verifies deliveries. This raises the CLI's minimum Node to 20 (Web Crypto Ed25519), matching cryptokit.
