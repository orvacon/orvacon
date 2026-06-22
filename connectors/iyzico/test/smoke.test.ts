import { expect, test } from "bun:test";
import { money } from "@orvacon/paykit";
import { iyzico } from "../src/iyzico";
import {
  API_KEY,
  buildAuthorizeInput,
  CALLBACK_URL,
  CARD_3DS_FAIL,
  CARD_3DS_SUCCESS,
  CARD_REFUND_DECLINE,
  complete3DS,
  ctx,
  SECRET_KEY,
  suite,
} from "./helpers";

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
suite("iyzico sandbox smoke (requires IYZICO_API_KEY / IYZICO_SECRET_KEY)", () => {
  test("authorize (3DS) → finalize → capture → refund", async () => {
    const connector = iyzico({ apiKey: API_KEY ?? "", secretKey: SECRET_KEY ?? "" });

    // 1. Authorize with 3DS — the first IYZWSv2-signed call. Returns the challenge.
    const auth = await connector.authorize(
      ctx,
      buildAuthorizeInput({ type: "card", card: CARD_3DS_SUCCESS }),
    );
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
  }, 30_000);

  test("3DS-fail card → payment.failed (mdStatus != 1)", async () => {
    const connector = iyzico({ apiKey: API_KEY ?? "", secretKey: SECRET_KEY ?? "" });
    const auth = await connector.authorize(
      ctx,
      buildAuthorizeInput({ type: "card", card: CARD_3DS_FAIL }),
    );
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
  }, 30_000);

  test("refund-decline card → refund returns a 'declined' error", async () => {
    const connector = iyzico({ apiKey: API_KEY ?? "", secretKey: SECRET_KEY ?? "" });
    const auth = await connector.authorize(
      ctx,
      buildAuthorizeInput({ type: "card", card: CARD_REFUND_DECLINE }),
    );
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
  }, 30_000);
});
