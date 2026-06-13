import { describe, expect, test } from "bun:test";
import { generatePaymentId, money } from "@orvacon/paykit";
import type { AuthorizeInput, ConnectorContext } from "@orvacon/paykit/connector";
import { iyzico } from "../src/iyzico";

/**
 * Live Iyzico **sandbox** smoke-test — the connector's verification threshold,
 * the gateway analogue of the Supabase adapter's Postgres integration test.
 * Gated on real sandbox credentials (`IYZICO_API_KEY` / `IYZICO_SECRET_KEY`), so
 * CI and a credential-less checkout skip it. It drives the full lifecycle against
 * the real gateway — authorize (3DS) → finalize → capture → refund — so the
 * connector's `Unverified — confirm against sandbox` assumptions (IYZWSv2
 * signature, trailing-zero price, 3DS callback encoding, finalize shape, Refund
 * V2) meet reality. Run from the repo root with the creds loaded:
 * `bun --env-file=.env.development.local test`.
 */
const API_KEY = process.env.IYZICO_API_KEY;
const SECRET_KEY = process.env.IYZICO_SECRET_KEY;
const suite = API_KEY && SECRET_KEY ? describe : describe.skip;

// Iyzico's public sandbox test cards (documented; not real PANs).
const CARD_3DS_SUCCESS = {
  number: "5526080000000006",
  expiryMonth: "12",
  expiryYear: "2030",
  cvc: "123",
  holderName: "John Doe",
};
// Reported to fail 3DS at the bank (mdStatus != 1).
const CARD_3DS_FAIL = { ...CARD_3DS_SUCCESS, number: "4131111111111117" };
// Authorizes/captures, but the gateway declines the refund.
const CARD_REFUND_DECLINE = { ...CARD_3DS_SUCCESS, number: "5406670000000009" };
const CALLBACK_URL = "https://orvacon.example/callback";
// The mock confirm page prints this OTP; it is the gateway's value, not a guess.
const MOCK_OTP = "283126";

const ctx: ConnectorContext = {
  logger: { debug() {}, info() {}, warn() {}, error() {} },
  signal: AbortSignal.timeout(60_000),
  classifyError: (code, errs) => errs?.[code]?.code ?? "unknown",
};

/** Pull a form's POST target and hidden fields out of a chunk of HTML. */
function parseForm(html: string): { action: string; fields: Record<string, string> } {
  const action = html.match(/<form[^>]*\saction="([^"]*)"/i)?.[1] ?? "";
  const fields: Record<string, string> = {};
  for (const tag of html.match(/<input[^>]*>/gi) ?? []) {
    const name = tag.match(/\sname="([^"]*)"/i)?.[1];
    if (name) {
      fields[name] = tag.match(/\svalue="([^"]*)"/i)?.[1] ?? "";
    }
  }
  return { action, fields };
}

/**
 * Drive Iyzico's sandbox mock 3DS to completion — follow the auto-submit form
 * chain (init3ds → confirm3ds → success callback), entering the printed mock OTP,
 * and stop at the form that targets the merchant `callbackUrl`. Its fields are
 * the 3DS callback params orvacon's parseWebhook consumes; this stands in for the
 * browser the harness cannot render.
 */
async function complete3DS(html: string, callbackUrl: string): Promise<Record<string, string>> {
  let form = parseForm(html);
  for (let hop = 0; hop < 6; hop++) {
    console.log(`  3DS hop ${hop}: ${form.action}`);
    if (form.action.startsWith(callbackUrl)) {
      return form.fields;
    }
    if ("smsCode" in form.fields) {
      form.fields.smsCode = MOCK_OTP;
    }
    const res = await fetch(form.action, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(form.fields).toString(),
      redirect: "manual",
    });
    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get("location") ?? "";
      if (loc.startsWith(callbackUrl)) {
        return Object.fromEntries(new URL(loc).searchParams);
      }
      form = parseForm(await (await fetch(loc, { redirect: "manual" })).text());
      continue;
    }
    form = parseForm(await res.text());
  }
  throw new Error("3DS chain did not reach the merchant callback in 6 hops");
}

function buildInput(card = CARD_3DS_SUCCESS): AuthorizeInput {
  const amount = money(1000, "TRY"); // 10.00 TRY
  return {
    paymentId: generatePaymentId(),
    amount,
    source: { type: "card", card },
    threeDSecure: true,
    callbackUrl: CALLBACK_URL,
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
        price: amount,
        category: "Electronics",
        type: "physical",
      },
    ],
  };
}

suite("iyzico sandbox smoke (requires IYZICO_API_KEY / IYZICO_SECRET_KEY)", () => {
  test("authorize (3DS) → finalize → capture → refund", async () => {
    const connector = iyzico({ apiKey: API_KEY ?? "", secretKey: SECRET_KEY ?? "" });

    // 1. Authorize with 3DS — the first IYZWSv2-signed call. Returns the challenge.
    const auth = await connector.authorize(ctx, buildInput());
    console.log(
      "\nauthorize:",
      auth.ok ? `${auth.status} ref=${auth.gatewayReference}` : JSON.stringify(auth),
    );
    expect(auth.ok).toBe(true);
    if (!auth.ok || auth.action?.type !== "html") {
      return;
    }
    expect(auth.status).toBe("requires_action");

    // 2. Drive the mock 3DS, then let the connector finalize (a second signed
    //    call) and normalize — capture is read from the finalize response.
    const callbackParams = await complete3DS(auth.action.content, CALLBACK_URL);
    expect(callbackParams.mdStatus).toBe("1");

    const captured = await connector.parseWebhook(ctx, {
      headers: {},
      body: new URLSearchParams(callbackParams).toString(),
    });
    console.log(
      "finalize:",
      captured.type,
      "amount" in captured ? `${captured.amount.amount} ${captured.amount.currency}` : "",
    );
    expect(captured.type).toBe("payment.captured");
    if (captured.type !== "payment.captured") {
      return;
    }
    // Trailing-zero price preimage: parsePrice must yield exactly 1000 minor units.
    expect(captured.amount).toEqual(money(1000, "TRY"));

    // 3. Refund the capture (Refund V2, by the gateway reference the core holds).
    const refunded = await connector.refund(ctx, {
      paymentId: captured.paymentId,
      gatewayReference: captured.gatewayReference,
      amount: money(1000, "TRY"),
    });
    console.log("refund:", refunded.ok ? refunded.status : JSON.stringify(refunded.error));
    expect(refunded.ok).toBe(true);
    if (refunded.ok) {
      expect(refunded.status).toBe("refunded");
    }
  });

  test("3DS-fail card → payment.failed (mdStatus != 1)", async () => {
    const connector = iyzico({ apiKey: API_KEY ?? "", secretKey: SECRET_KEY ?? "" });
    const auth = await connector.authorize(ctx, buildInput(CARD_3DS_FAIL));
    expect(auth.ok).toBe(true);
    if (!auth.ok || auth.action?.type !== "html") {
      return;
    }
    const cb = await complete3DS(auth.action.content, CALLBACK_URL);
    console.log("\n3DS-fail callback mdStatus:", cb.mdStatus);
    expect(cb.mdStatus).not.toBe("1");
    const event = await connector.parseWebhook(ctx, {
      headers: {},
      body: new URLSearchParams(cb).toString(),
    });
    expect(event.type).toBe("payment.failed");
  });

  test("refund-decline card → refund returns a 'declined' error", async () => {
    const connector = iyzico({ apiKey: API_KEY ?? "", secretKey: SECRET_KEY ?? "" });
    const auth = await connector.authorize(ctx, buildInput(CARD_REFUND_DECLINE));
    expect(auth.ok).toBe(true);
    if (!auth.ok || auth.action?.type !== "html") {
      return;
    }
    const cb = await complete3DS(auth.action.content, CALLBACK_URL);
    const captured = await connector.parseWebhook(ctx, {
      headers: {},
      body: new URLSearchParams(cb).toString(),
    });
    expect(captured.type).toBe("payment.captured");
    if (captured.type !== "payment.captured") {
      return;
    }
    const refund = await connector.refund(ctx, {
      paymentId: captured.paymentId,
      gatewayReference: captured.gatewayReference,
      amount: money(1000, "TRY"),
    });
    console.log("\nrefund-decline:", refund.ok ? refund.status : refund.error.code);
    expect(refund.ok).toBe(false);
    // 10220 (errorGroup DECLINED) is now mapped — a real decline classifies as
    // "declined", not the safe-default "unknown".
    if (!refund.ok) {
      expect(refund.error.code).toBe("declined");
    }
  });
});
