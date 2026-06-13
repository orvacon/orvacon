import { describe, expect, test } from "bun:test";
import { supabaseSchema } from "../src/index";

describe("supabaseSchema (SQL generation — no database)", () => {
  const sql = supabaseSchema();

  test("creates the three core tables with the columns the runtime reads", () => {
    expect(sql).toContain("create table if not exists payments");
    expect(sql).toContain("amount_minor");
    expect(sql).toContain("user_id");
    expect(sql).toContain("create table if not exists ledger");
    expect(sql).toContain("create table if not exists idempotency_keys");
  });

  test("enables default-deny RLS — enable + force, owner included", () => {
    expect(sql).toContain("enable row level security");
    expect(sql).toContain("force row level security");
  });

  test("read is own-row via the wrapped auth.uid(); clients have no write policy", () => {
    expect(sql).toContain("(select auth.uid())::text = user_id");
    expect(sql).toContain("for select to authenticated");
    expect(sql).not.toContain("for insert");
    expect(sql).not.toContain("for update");
  });

  test("ledger is append-only and fork-proof at the database level", () => {
    expect(sql).toContain("revoke update, delete on ledger from anon, authenticated, service_role");
    expect(sql).toContain("unique (prev_hash)");
  });
});
