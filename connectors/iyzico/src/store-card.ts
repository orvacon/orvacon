import type {
  ConnectorContext,
  DeleteCardInput,
  DeleteCardResult,
  StoreCardInput,
  StoreCardResult,
} from "@orvacon/paykit/connector";
import type { IyzicoTransport } from "./transport";

const STORE_PATH = "/cardstorage/card";
// Iyzico deletes a stored card with HTTP DELETE on the same path (not a /delete
// sub-path); the IYZWSv2 signature covers only the path + body, not the method.
const DELETE_PATH = "/cardstorage/card";

/**
 * Vault a card with Iyzico's card storage. Iyzico groups a customer's cards
 * under a `cardUserKey` keyed by email, so a {@link StoreCardInput.buyer} with an
 * email is required: pass the `userKey` from an earlier result to add a card to
 * that customer, or omit it to start a new one. Returns the `cardToken` +
 * `cardUserKey` pair a later token authorize charges against.
 *
 * @remarks `Card` is toxic — it is sent once over the IYZWSv2-signed transport
 * and never persisted or logged. The conversationId is a per-call tracking value,
 * not orvacon state.
 */
export async function storeCard(
  transport: IyzicoTransport,
  ctx: ConnectorContext,
  input: StoreCardInput,
): Promise<StoreCardResult> {
  const email = input.buyer?.email;
  if (!email) {
    return {
      ok: false,
      error: { code: "invalid_request", message: "iyzico storeCard requires buyer.email" },
    };
  }
  const result = await transport(ctx, {
    method: "POST",
    path: STORE_PATH,
    body: {
      locale: "en",
      conversationId: crypto.randomUUID(),
      email,
      ...(input.userKey ? { cardUserKey: input.userKey } : {}),
      card: {
        cardAlias: input.alias ?? "orvacon card",
        cardHolderName: input.card.holderName,
        cardNumber: input.card.number,
        expireMonth: input.card.expiryMonth,
        expireYear: input.card.expiryYear,
      },
    },
  });
  if (!result.ok) {
    return result;
  }
  const body = result.body;
  const token = typeof body.cardToken === "string" ? body.cardToken : "";
  if (!token) {
    return {
      ok: false,
      error: { code: "unknown", message: "iyzico storeCard returned no cardToken" },
    };
  }
  return {
    ok: true,
    card: {
      token: {
        token,
        userKey: typeof body.cardUserKey === "string" ? body.cardUserKey : undefined,
      },
      last4: typeof body.lastFourDigits === "string" ? body.lastFourDigits : undefined,
      brand: typeof body.cardAssociation === "string" ? body.cardAssociation : undefined,
    },
    raw: body,
  };
}

/**
 * Delete a vaulted card. Iyzico needs both the `cardToken` and its `cardUserKey`,
 * so the token must carry the `userKey` {@link storeCard} minted.
 */
export async function deleteCard(
  transport: IyzicoTransport,
  ctx: ConnectorContext,
  input: DeleteCardInput,
): Promise<DeleteCardResult> {
  if (!input.token.userKey) {
    return {
      ok: false,
      error: { code: "invalid_request", message: "iyzico deleteCard requires the token's userKey" },
    };
  }
  const result = await transport(ctx, {
    method: "DELETE",
    path: DELETE_PATH,
    body: {
      locale: "en",
      conversationId: crypto.randomUUID(),
      cardToken: input.token.token,
      cardUserKey: input.token.userKey,
    },
  });
  if (!result.ok) {
    return result;
  }
  return { ok: true };
}
