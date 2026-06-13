import { fromBase64 } from "@orvacon/cryptokit";
import { addMoney, compareMoney, type Money, money } from "@orvacon/paykit";
import type {
  AuthorizeInput,
  BasketItem,
  ConnectorContext,
  ConnectorResult,
} from "@orvacon/paykit/connector";
import { formatPrice } from "./format";
import type { IyzicoSuccess, IyzicoTransport } from "./transport";

const INITIALIZE_3DS_PATH = "/payment/3dsecure/initialize";
const AUTH_PATH = "/payment/auth";

/**
 * Map an {@link AuthorizeInput} onto an Iyzico payment and normalize the result.
 * With `threeDSecure`, posts to the 3DS-initialize endpoint and returns
 * `requires_action` carrying the challenge HTML; otherwise posts the direct auth.
 * Iyzico's required buyer/address/basket subset is validated first, so a missing
 * field fails as `invalid_request` (with the field named) before the gateway call.
 *
 * @remarks For 3DS the trust boundary is the authenticated *finalize* response
 * (an IYZWSv2 call over TLS), not the raw initialize or callback — confirmed
 * against the sandbox — so the connector deliberately does not verify a response
 * signature here.
 */
export async function authorize(
  transport: IyzicoTransport,
  ctx: ConnectorContext,
  input: AuthorizeInput,
): Promise<ConnectorResult> {
  const missing = validateRequired(input);
  if (missing) {
    return { ok: false, error: { code: "invalid_request", message: missing } };
  }
  const threeDS = input.threeDSecure === true;
  const result = await transport(ctx, {
    method: "POST",
    path: threeDS ? INITIALIZE_3DS_PATH : AUTH_PATH,
    body: buildRequestBody(input),
  });
  if (!result.ok) {
    return result;
  }
  return threeDS ? mapThreeDS(result.body) : mapDirect(result.body);
}

/**
 * Validate the subset Iyzico requires. The core leaves these optional; the
 * connector declares its own requirement here and names the missing field, so a
 * developer gets "add this" rather than an opaque gateway rejection.
 */
function validateRequired(input: AuthorizeInput): string | null {
  if (!input.buyer) {
    return "iyzico authorize requires buyer";
  }
  for (const field of ["nationalId", "phone", "address", "city", "country"] as const) {
    if (!input.buyer[field]) {
      return `iyzico authorize requires buyer.${field}`;
    }
  }
  if (!input.billingAddress) {
    return "iyzico authorize requires billingAddress";
  }
  if (!input.basket || input.basket.length === 0) {
    return "iyzico authorize requires a non-empty basket";
  }
  for (const item of input.basket) {
    if (item.price.currency !== input.amount.currency) {
      return "iyzico authorize requires every basket item price in the payment currency";
    }
  }
  const total = input.basket.reduce<Money>(
    (sum, item) => addMoney(sum, item.price),
    money(0, input.amount.currency),
  );
  if (compareMoney(total, input.amount) !== 0) {
    return "iyzico authorize requires the basket item total to equal the amount";
  }
  return null;
}

function buildRequestBody(input: AuthorizeInput): Record<string, unknown> {
  return {
    locale: "en",
    conversationId: input.paymentId,
    price: formatPrice(input.amount),
    paidPrice: formatPrice(input.amount),
    currency: input.amount.currency,
    installment: 1,
    paymentChannel: "WEB",
    basketId: input.paymentId,
    paymentGroup: "PRODUCT",
    callbackUrl: input.callbackUrl,
    paymentCard: buildPaymentCard(input.source),
    buyer: buildBuyer(input),
    billingAddress: buildAddress(input.billingAddress),
    shippingAddress: buildAddress(input.shippingAddress ?? input.billingAddress),
    basketItems: (input.basket ?? []).map((item) => buildBasketItem(item, input)),
  };
}

/**
 * Map the payment source to Iyzico's `paymentCard`. The raw-card flow is
 * first-class.
 *
 * @remarks **Unverified** — the token (stored-card) flow is mapped but only the
 * raw-card 3DS path is sandbox-verified in v1. Iyzico's stored-card flow may also
 * require `cardUserKey` and may change the 3DS requirement; confirm against the
 * sandbox before relying on it.
 */
function buildPaymentCard(source: AuthorizeInput["source"]): Record<string, unknown> {
  if (source.type === "card") {
    return {
      cardHolderName: source.card.holderName,
      cardNumber: source.card.number,
      expireMonth: source.card.expiryMonth,
      expireYear: source.card.expiryYear,
      cvc: source.card.cvc,
    };
  }
  return { cardToken: source.token.token };
}

function buildBuyer(input: AuthorizeInput): Record<string, unknown> {
  const buyer = input.buyer;
  return {
    id: buyer?.referenceId ?? input.paymentId,
    name: buyer?.name,
    surname: buyer?.surname,
    email: buyer?.email,
    identityNumber: buyer?.nationalId,
    gsmNumber: buyer?.phone,
    registrationAddress: buyer?.address,
    city: buyer?.city,
    country: buyer?.country,
    ip: buyer?.ip,
  };
}

function buildAddress(
  address: AuthorizeInput["billingAddress"],
): Record<string, unknown> | undefined {
  if (!address) {
    return undefined;
  }
  return {
    contactName: address.contactName,
    address: address.address,
    city: address.city,
    country: address.country,
    zipCode: address.zipCode,
  };
}

function buildBasketItem(item: BasketItem, input: AuthorizeInput): Record<string, unknown> {
  return {
    id: item.referenceId,
    name: item.name,
    price: formatPrice(item.price),
    // category1 is cosmetic (Iyzico analytics) — a blanket default is harmless.
    category1: item.category ?? "General",
    itemType: resolveItemType(item, input),
  };
}

/**
 * Map the normalized item type to Iyzico's `PHYSICAL` / `VIRTUAL`. This is
 * **behavioral**, not cosmetic — `PHYSICAL` makes a shipping address mandatory —
 * so it is never blanket-defaulted: it comes from {@link BasketItem.type}, or is
 * derived from whether a shipping address was supplied.
 *
 * @remarks **Unverified** — the derive-from-shipping fallback is a heuristic to
 * confirm against the sandbox; pass `BasketItem.type` explicitly to avoid it.
 */
function resolveItemType(item: BasketItem, input: AuthorizeInput): "PHYSICAL" | "VIRTUAL" {
  if (item.type === "physical") {
    return "PHYSICAL";
  }
  if (item.type === "virtual") {
    return "VIRTUAL";
  }
  return input.shippingAddress ? "PHYSICAL" : "VIRTUAL";
}

function mapThreeDS(body: IyzicoSuccess): ConnectorResult {
  const html =
    typeof body.threeDSHtmlContent === "string" ? decodeHtml(body.threeDSHtmlContent) : "";
  return {
    ok: true,
    status: "requires_action",
    gatewayReference: typeof body.paymentId === "string" ? body.paymentId : undefined,
    action: { type: "html", content: html },
    raw: body,
  };
}

/**
 * Map a direct (non-3DS) auth response. Iyzico's `/payment/auth` completes
 * (auth + capture) in one step, so this returns `captured` — confirmed against
 * the sandbox. The raw-card 3DS path is the v1 first-class flow.
 */
function mapDirect(body: IyzicoSuccess): ConnectorResult {
  return {
    ok: true,
    status: "captured",
    gatewayReference: typeof body.paymentId === "string" ? body.paymentId : undefined,
    raw: body,
  };
}

/** Iyzico delivers the 3DS challenge as base64-encoded HTML; decode it to renderable markup. */
function decodeHtml(value: string): string {
  try {
    return new TextDecoder().decode(fromBase64(value));
  } catch {
    return value;
  }
}
