import { beforeAll, describe, expect, test } from "bun:test";
import { generateSigningKeyPair } from "@orvacon/cryptokit";
import {
  type DatabaseAdapter,
  generatePaymentId,
  type LedgerEntry,
  money,
  orvacon,
  type Payment,
  type TransactionScope,
} from "@orvacon/paykit";
import type { AuthorizeInput, ConnectorContext } from "@orvacon/paykit/connector";
import { iyzico } from "../src/iyzico";

/**
 * Live sandbox proof that `reconcile` resolves the real gap — *settled at the
 * gateway but not yet reflected in the core* — and, just as importantly, that it
 * does NOT touch a payment the gateway still reports pending (a false-positive
 * capture would invent money movement). Gated on `IYZICO_API_KEY` /
 * `IYZICO_SECRET_KEY`. Run from the repo root: `bun --env-file=.env.development.local test`.
 */
const API_KEY = process.env.IYZICO_API_KEY ?? "";
const SECRET_KEY = process.env.IYZICO_SECRET_KEY ?? "";
const suite = API_KEY && SECRET_KEY ? describe : describe.skip;

const ctx: ConnectorContext = {
  logger: { debug() {}, info() {}, warn() {}, error() {} },
  signal: AbortSignal.timeout(60_000),
  classifyError: (c, e) => e?.[c]?.code ?? "unknown",
};

/** A minimal in-memory DatabaseAdapter — isolates the gateway (real) from the DB (controlled). */
function memoryDb(): { db: DatabaseAdapter; ledger: LedgerEntry[] } {
  const payments = new Map<string, Payment>();
  const ledger: LedgerEntry[] = [];
  const scope: TransactionScope = {
    id: "memory",
    async createPayment(p) {
      payments.set(p.id, p);
      return p;
    },
    async getPayment(id) {
      return payments.get(id) ?? null;
    },
    async updatePaymentStatus(id, from, to, patch) {
      const p = payments.get(id);
      if (!p || p.status !== from) {
        return null;
      }
      const updated: Payment = {
        ...p,
        status: to,
        gatewayReference: patch?.gatewayReference ?? p.gatewayReference,
        refundedTotal: patch?.refundedTotal ?? p.refundedTotal,
        updatedAt: new Date().toISOString(),
      };
      payments.set(id, updated);
      return updated;
    },
    async insertIdempotencyKey() {
      return { inserted: true };
    },
    async getIdempotencyKey() {
      return null;
    },
    async reclaimIdempotencyKey() {
      return false;
    },
    async completeIdempotencyKey() {},
    async getLedgerHead() {
      return ledger.at(-1) ?? null;
    },
    async appendLedger(entries) {
      ledger.push(...entries);
    },
  };
  return { db: { ...scope, transaction: (fn) => fn(scope) }, ledger };
}

const card = {
  number: "5526080000000006",
  expiryMonth: "12",
  expiryYear: "2030",
  cvc: "123",
  holderName: "John Doe",
};
const buyerBasket = {
  buyer: {
    name: "John",
    surname: "Doe",
    email: "email@email.com",
    nationalId: "74300864791",
    phone: "+905350000000",
    address: "Nidakule Goztepe, Merdivenkoy Mah. Bora Sok. No:1",
    city: "Istanbul",
    country: "Turkey",
    ip: "85.34.78.112",
  },
  billingAddress: {
    contactName: "John Doe",
    address: "Nidakule Goztepe, Merdivenkoy Mah. Bora Sok. No:1",
    city: "Istanbul",
    country: "Turkey",
    zipCode: "34732",
  },
  basket: [
    {
      referenceId: "BI101",
      name: "Test Item",
      price: money(1000, "TRY"),
      category: "Electronics",
      type: "physical" as const,
    },
  ],
};

const input = (
  id: ReturnType<typeof generatePaymentId>,
  threeDSecure: boolean,
): AuthorizeInput => ({
  paymentId: id,
  amount: money(1000, "TRY"),
  source: { type: "card", card },
  threeDSecure,
  callbackUrl: "https://orvacon.example/callback",
  ...buyerBasket,
});

let signingKey: string;
beforeAll(async () => {
  signingKey = (await generateSigningKeyPair()).secretKey;
});

suite("iyzico reconcile (sandbox — requires IYZICO_API_KEY / IYZICO_SECRET_KEY)", () => {
  test("settled-but-unreflected → reconcile resolves to captured and ledgers", async () => {
    const { db, ledger } = memoryDb();
    const connector = iyzico({ apiKey: API_KEY, secretKey: SECRET_KEY });
    const orva = orvacon({ database: db, connectors: [connector], webhookSigningKey: signingKey });

    const id = generatePaymentId();
    // Mint a payment that is captured (SUCCESS) on Iyzico.
    const auth = await connector.authorize(ctx, input(id, false));
    expect(auth.ok).toBe(true);
    if (!auth.ok) {
      return;
    }
    // Simulate the crash window: the gateway captured, but the core is still at
    // requires_action (the persist after finalize never landed).
    const now = new Date().toISOString();
    await db.createPayment({
      id,
      status: "requires_action",
      amount: money(1000, "TRY"),
      connectorId: "iyzico",
      gatewayReference: auth.gatewayReference,
      createdAt: now,
      updatedAt: now,
    });

    const result = await orva.reconcile(id);
    console.log(
      "\n[reconcile settled]",
      JSON.stringify(result.ok ? { resolved: result.resolved } : result.error),
    );
    expect(result.ok && result.resolved).toBe(true);
    const settled = await db.getPayment(id);
    expect(settled?.status).toBe("captured");
    expect(ledger.length).toBeGreaterThan(0);
  });

  test("genuinely pending (INIT_THREEDS) → reconcile no-op, payment untouched", async () => {
    const { db, ledger } = memoryDb();
    const connector = iyzico({ apiKey: API_KEY, secretKey: SECRET_KEY });
    const orva = orvacon({ database: db, connectors: [connector], webhookSigningKey: signingKey });

    const id = generatePaymentId();
    // 3DS authorize but never drive 3DS — Iyzico leaves it INIT_THREEDS.
    const auth = await connector.authorize(ctx, input(id, true));
    expect(auth.ok && auth.status).toBe("requires_action");
    if (!auth.ok) {
      return;
    }
    const now = new Date().toISOString();
    await db.createPayment({
      id,
      status: "requires_action",
      amount: money(1000, "TRY"),
      connectorId: "iyzico",
      gatewayReference: auth.gatewayReference,
      createdAt: now,
      updatedAt: now,
    });

    const result = await orva.reconcile(id);
    console.log(
      "[reconcile pending]",
      JSON.stringify(result.ok ? { resolved: result.resolved } : result.error),
    );
    // The gateway has not settled — reconcile must leave the payment exactly as it was.
    expect(result.ok && !result.resolved).toBe(true);
    const untouched = await db.getPayment(id);
    expect(untouched?.status).toBe("requires_action");
    expect(ledger.length).toBe(0);
  });
});
