import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { generatePaymentId, idempotencyKey, money } from "@orvacon/paykit";
import postgres from "postgres";
import { supabaseAdapter } from "../src/index";

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
    await sql`create table payments (
      id text primary key, status text not null, amount_minor bigint not null, currency text not null,
      refunded_total_minor bigint, connector_id text not null, user_id text,
      gateway_reference text, created_at timestamptz not null, updated_at timestamptz not null)`;
    await sql`create table idempotency_keys (
      key text primary key, payment_id text, status text not null, result jsonb,
      created_at timestamptz not null, expires_at timestamptz not null)`;
    await sql`create table ledger (
      seq bigserial primary key, payment_id text not null, direction text not null, account text not null,
      amount_minor bigint not null, currency text not null, occurred_at timestamptz not null,
      prev_hash text not null, hash text not null unique)`;
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
});
