import { expect, test } from "bun:test";
import { money } from "@orvacon/paykit";
import { iyzico } from "../src/iyzico";
import {
  API_KEY,
  buildAuthorizeInput,
  CALLBACK_URL,
  CARD_3DS_SUCCESS,
  complete3DS,
  ctx,
  SECRET_KEY,
  suite,
} from "./helpers";

/**
 * Live Iyzico **sandbox** smoke-test for the stored-card (token) lifecycle — the
 * verification threshold for `storeCard` / token authorize / `deleteCard`, gated
 * on real sandbox credentials like the raw-card smoke. It vaults a card, charges
 * the returned token through the same 3DS flow, refunds it, and deletes the card,
 * proving the connector mints and passes back `cardUserKey` alongside `cardToken`
 * and that a stored card still drives 3DS. Run from the repo root with the creds
 * loaded: `bun --env-file=.env.development.local test`.
 */
suite("iyzico sandbox token smoke (requires IYZICO_API_KEY / IYZICO_SECRET_KEY)", () => {
  test("storeCard → token authorize (3DS) → finalize → refund → deleteCard", async () => {
    const connector = iyzico({ apiKey: API_KEY ?? "", secretKey: SECRET_KEY ?? "" });

    // 1. Vault the card — a direct signed call, no 3DS. Returns the token pair.
    const stored = await connector.storeCard?.(ctx, {
      card: CARD_3DS_SUCCESS,
      buyer: { name: "John", surname: "Doe", email: "email@email.com" },
      alias: "smoke card",
    });
    console.log(
      "\nstoreCard:",
      stored?.ok
        ? `${stored.card.brand} ••${stored.card.last4} token=${stored.card.token.token.slice(0, 8)}…`
        : JSON.stringify(stored),
    );
    expect(stored?.ok).toBe(true);
    if (!stored?.ok) {
      return;
    }
    expect(stored.card.token.token.length).toBeGreaterThan(0);
    expect(stored.card.token.userKey).toBeTruthy();

    // 2. Charge the token through 3DS — the same flow as a raw card, token source.
    const auth = await connector.authorize(
      ctx,
      buildAuthorizeInput({ type: "token", token: stored.card.token }),
    );
    console.log(
      "token authorize:",
      auth.ok ? `${auth.status} ref=${auth.gatewayReference}` : JSON.stringify(auth),
    );
    expect(auth.ok).toBe(true);
    if (!auth.ok || auth.action?.type !== "html") {
      return;
    }
    expect(auth.status).toBe("requires_action");

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
    expect(captured.amount).toEqual(money(1000, "TRY"));

    // 3. Refund the token charge.
    const refunded = await connector.refund(ctx, {
      paymentId: captured.paymentId,
      gatewayReference: captured.gatewayReference,
      amount: money(1000, "TRY"),
    });
    console.log("refund:", refunded.ok ? refunded.status : JSON.stringify(refunded.error));
    expect(refunded.ok).toBe(true);

    // 4. Forget the vaulted card — cleanup, and proves deleteCard.
    const deleted = await connector.deleteCard?.(ctx, { token: stored.card.token });
    console.log("deleteCard:", deleted?.ok ? "ok" : JSON.stringify(deleted));
    expect(deleted?.ok).toBe(true);
  }, 30_000);
});
