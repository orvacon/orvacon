import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { generatePaymentId, idempotencyKey, money } from "@orvacon/paykit";
import postgres from "postgres";
import { supabaseAdapter, supabaseSchema } from "../src/index";

const DATABASE_URL = process.env.DATABASE_URL;

/**
 * Gated on a real Postgres (local/Docker or a Supabase project). This is the
 * adapter's verification *threshold* — the equivalent of the connector's sandbox
 * smoke-test. Until it runs green, the adapter is type-correct but
 * behavior-unproven (advisory-lock serialization, CAS, `ON CONFLICT` dedup).
 * Run with `DATABASE_URL=postgres://… bun test`.
 */
const suite = DATABASE_URL ? describe : describe.skip;

suite("supabaseAdapter (integration — requires DATABASE_URL)", () => {
  const sql = postgres(DATABASE_URL ?? "", { prepare: false });
  const db = supabaseAdapter({ sql });

  beforeAll(async () => {
    await sql`drop table if exists ledger, idempotency_keys, payments`;
    // The generated RLS references Supabase's auth.uid() and its anon /
    // authenticated / service_role roles. A real Supabase project has them; a
    // bare Postgres does not, so stand them up to prove the schema applies.
    await sql
      .unsafe(`
        create schema if not exists auth;
        create or replace function auth.uid() returns uuid language sql stable as $$ select null::uuid $$;
        do $$ begin
          if not exists (select from pg_roles where rolname = 'anon') then create role anon; end if;
          if not exists (select from pg_roles where rolname = 'authenticated') then create role authenticated; end if;
          if not exists (select from pg_roles where rolname = 'service_role') then create role service_role bypassrls; end if;
        end $$;
      `)
      .simple();
    // Apply the *generated* migration — the exact SQL the CLI will write. The
    // runtime tests below then run against the real schema + RLS; the superuser
    // connection bypasses RLS, as a BYPASSRLS service_role would in production.
    await sql.unsafe(supabaseSchema()).simple();
  });

  afterAll(async () => {
    await sql.end();
  });

  test("createPayment then getPayment round-trips the money and owner", async () => {
    const id = generatePaymentId();
    const now = new Date().toISOString();
    await db.createPayment({
      id,
      status: "created",
      amount: money(10_000, "TRY"),
      connectorId: "iyzico",
      userId: "u1",
      createdAt: now,
      updatedAt: now,
    });
    const stored = await db.getPayment(id);
    expect(stored?.amount).toEqual(money(10_000, "TRY"));
    expect(stored?.userId).toBe("u1");
  });

  test("updatePaymentStatus compare-and-swap rejects a stale from-status", async () => {
    const id = generatePaymentId();
    const now = new Date().toISOString();
    await db.createPayment({
      id,
      status: "created",
      amount: money(1_000, "TRY"),
      connectorId: "iyzico",
      createdAt: now,
      updatedAt: now,
    });
    expect(await db.updatePaymentStatus(id, "created", "captured")).not.toBeNull();
    expect(await db.updatePaymentStatus(id, "created", "captured")).toBeNull();
  });

  test("idempotency claim dedupes on conflict", async () => {
    const now = new Date().toISOString();
    const record = {
      key: idempotencyKey("k-int"),
      status: "in_progress" as const,
      createdAt: now,
      expiresAt: now,
    };
    expect((await db.insertIdempotencyKey(record)).inserted).toBe(true);
    expect((await db.insertIdempotencyKey(record)).inserted).toBe(false);
  });

  test("the ledger's unique(prev_hash) refuses a forked chain", async () => {
    const append = (prev: string, hash: string) =>
      sql`insert into ledger (payment_id, direction, account, amount_minor, currency, occurred_at, prev_hash, hash)
          values ('p_fork', 'debit', 'gateway', 1, 'TRY', now(), ${prev}, ${hash})`;
    await append("genesis", "hash_a");
    // A second link off the same prev_hash is a fork; the constraint rejects it
    // even if the advisory lock were somehow bypassed.
    let forkRejected = false;
    try {
      await append("genesis", "hash_b");
    } catch {
      forkRejected = true;
    }
    expect(forkRejected).toBe(true);
  });
});
