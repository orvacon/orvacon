import { describe } from "bun:test";
import { generatePaymentId, money } from "@orvacon/paykit";
import type { AuthorizeInput, ConnectorContext, PaymentSource } from "@orvacon/paykit/connector";

export const API_KEY = process.env.IYZICO_API_KEY;
export const SECRET_KEY = process.env.IYZICO_SECRET_KEY;

/** Run a suite only with real sandbox credentials; CI and a credential-less checkout skip it. */
export const suite = API_KEY && SECRET_KEY ? describe : describe.skip;

export const CALLBACK_URL = "https://orvacon.example/callback";
// The mock confirm page prints this OTP; it is the gateway's value, not a guess.
const MOCK_OTP = "283126";

// Iyzico's public sandbox test cards (documented; not real PANs).
export const CARD_3DS_SUCCESS = {
  number: "5526080000000006",
  expiryMonth: "12",
  expiryYear: "2030",
  cvc: "123",
  holderName: "John Doe",
};
// Reported to fail 3DS at the bank (mdStatus != 1).
export const CARD_3DS_FAIL = { ...CARD_3DS_SUCCESS, number: "4131111111111117" };
// Authorizes/captures, but the gateway declines the refund.
export const CARD_REFUND_DECLINE = { ...CARD_3DS_SUCCESS, number: "5406670000000009" };

export const ctx: ConnectorContext = {
  logger: { debug() {}, info() {}, warn() {}, error() {} },
  signal: AbortSignal.timeout(60_000),
  classifyError: (code, errs) => errs?.[code]?.code ?? "unknown",
};

const BUYER = {
  name: "John",
  surname: "Doe",
  email: "email@email.com",
  nationalId: "74300864791",
  phone: "+905350000000",
  address: "Nidakule Goztepe, Merdivenkoy Mah. Bora Sok. No:1",
  city: "Istanbul",
  country: "Turkey",
  ip: "85.34.78.112",
};

/**
 * A complete Iyzico authorize input for the given source — the buyer, billing
 * address, and single-item basket Iyzico requires, charging 10.00 TRY with 3DS.
 */
export function buildAuthorizeInput(source: PaymentSource): AuthorizeInput {
  const amount = money(1000, "TRY"); // 10.00 TRY
  return {
    paymentId: generatePaymentId(),
    amount,
    source,
    threeDSecure: true,
    callbackUrl: CALLBACK_URL,
    buyer: { ...BUYER },
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
 * and stop at the form that targets the merchant `callbackUrl`. Its fields are the
 * 3DS callback params orvacon's parseWebhook consumes; this stands in for the
 * browser the harness cannot render.
 */
export async function complete3DS(
  html: string,
  callbackUrl: string,
): Promise<Record<string, string>> {
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
