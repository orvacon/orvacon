/**
 * Generate the Supabase migration SQL for orvacon's core tables — schema **and**
 * default-deny row-level security in one statement, the half of the adapter that
 * is Supabase-specific. The CLI (`orvacon generate --adapter supabase`) writes
 * this verbatim into a migration file; the column shapes match what
 * {@link supabaseAdapter} reads and writes at runtime.
 *
 * The RLS posture (payment data is closed by default):
 * - **Writes are service-role only.** No INSERT/UPDATE policy is created for
 *   `anon` / `authenticated`, so RLS-on + no-policy = deny. The server (a
 *   `BYPASSRLS` role) writes; a client cannot forge a `captured` row.
 * - **Reads are narrow.** A client sees only its own payment, via the
 *   `SELECT`-wrapped `auth.uid()` (cached once per query, not per row).
 * - **The ledger is append-only at the privilege level** — `update` / `delete`
 *   revoked from every role including `service_role`, and a `unique (prev_hash)`
 *   constraint rejects a forked chain (genesis included) even if a lock is
 *   somehow bypassed.
 *
 * @remarks The connection that runs the adapter must hold `BYPASSRLS` (Supabase's
 * `service_role`); `force row level security` deliberately applies RLS even to a
 * table owner, so a non-bypassing connection is denied by design. `events` and
 * `webhook_keys` are not emitted — no runtime method touches them in v1.
 */
export function supabaseSchema(): string {
  return `${TABLES}\n${RLS}`;
}

const TABLES = `-- orvacon core tables (v1)

create table if not exists payments (
  id                    text primary key,
  status                text not null,
  amount_minor          bigint not null,
  currency              text not null,
  refunded_total_minor  bigint,
  connector_id          text not null,
  user_id               text,
  gateway_reference     text,
  created_at            timestamptz not null,
  updated_at            timestamptz not null
);
create index if not exists payments_user_id_idx on payments (user_id);

-- Append-only, hash-chained double-entry ledger. seq orders the single global
-- chain; unique(prev_hash) makes a fork impossible at the database level.
create table if not exists ledger (
  seq           bigserial primary key,
  payment_id    text not null,
  direction     text not null,
  account       text not null,
  amount_minor  bigint not null,
  currency      text not null,
  occurred_at   timestamptz not null,
  prev_hash     text not null,
  hash          text not null,
  unique (prev_hash),
  unique (hash)
);
create index if not exists ledger_payment_id_idx on ledger (payment_id);

create table if not exists idempotency_keys (
  key         text primary key,
  payment_id  text,
  status      text not null,
  result      jsonb,
  created_at  timestamptz not null,
  expires_at  timestamptz not null
);`;

const RLS = `-- Row-level security: default-deny, enforced even for the table owner.

alter table payments enable row level security;
alter table payments force row level security;
alter table ledger enable row level security;
alter table ledger force row level security;
alter table idempotency_keys enable row level security;
alter table idempotency_keys force row level security;

-- payments: a client reads only its own row; writes have no policy, so they are
-- denied (server writes via a BYPASSRLS role).
create policy payments_select_own on payments
  for select to authenticated
  using ((select auth.uid())::text = user_id);

-- ledger: append-only privilege; revoke mutation from every role, server too.
revoke update, delete on ledger from anon, authenticated, service_role;

-- idempotency_keys: internal; no policy = denied to every client.`;
