import { hmacSha256, toBase64, toBytes, toHex } from "@orvacon/cryptokit";

/**
 * Inputs for one IYZWSv2-signed Iyzico request.
 *
 * `uriPath` is the request path that the signature covers — the path (and query
 * string, when present) exactly as sent, e.g. `/payment/auth`. `body` is the
 * JSON request body **as the exact string transmitted**: re-serializing it after
 * signing changes the bytes and breaks the signature, so the same string must be
 * both signed here and sent on the wire.
 */
export type IyzwsV2Request = {
  apiKey: string;
  secretKey: string;
  uriPath: string;
  /** The exact request body string, or `""`/omitted for a bodyless call. */
  body?: string;
  /** Per-request nonce; defaults to a fresh CSPRNG value. Injectable for tests. */
  randomKey?: string;
};

/**
 * The two headers an IYZWSv2 request carries: the signed `Authorization` value
 * and the `x-iyzi-rnd` nonce the gateway re-uses to recompute the signature.
 */
export type IyzwsV2Headers = {
  Authorization: string;
  "x-iyzi-rnd": string;
};

/**
 * Build the exact string the HMAC covers: `randomKey + uriPath + body`, with the
 * body omitted when empty. Order and the empty-body rule are load-bearing — they
 * match Iyzico's documented `_.isEmpty(body) ? randomKey + path : randomKey +
 * path + body` (verified against the official HMACSHA256 auth docs).
 */
export function iyzwsV2Payload(randomKey: string, uriPath: string, body: string): string {
  return body.length === 0 ? `${randomKey}${uriPath}` : `${randomKey}${uriPath}${body}`;
}

/** A fresh per-request nonce (128 bits of CSPRNG, hex). Unique and unpredictable; the gateway treats it as opaque. */
export function generateRandomKey(): string {
  return toHex(crypto.getRandomValues(new Uint8Array(16)));
}

/**
 * Build the IYZWSv2 authentication headers for an Iyzico request.
 *
 * The scheme (verified against Iyzico's official IYZWSv2 / HMACSHA256
 * authentication specification):
 * 1. `signature = HEX(HMAC-SHA256(randomKey + uriPath + body, secretKey))`.
 * 2. `authorization = "apiKey:<apiKey>&randomKey:<randomKey>&signature:<signature>"`.
 * 3. `Authorization: "IYZWSv2 " + base64(authorization)` (a single space after the scheme).
 * 4. `x-iyzi-rnd: <randomKey>` as a separate header.
 *
 * Built on cryptokit's RFC-verified `hmacSha256` rather than a hand-rolled HMAC.
 */
export async function buildIyzwsV2Headers(request: IyzwsV2Request): Promise<IyzwsV2Headers> {
  const randomKey = request.randomKey ?? generateRandomKey();
  const payload = iyzwsV2Payload(randomKey, request.uriPath, request.body ?? "");
  const signature = toHex(await hmacSha256(request.secretKey, payload));
  const authorization = `apiKey:${request.apiKey}&randomKey:${randomKey}&signature:${signature}`;
  return {
    Authorization: `IYZWSv2 ${toBase64(toBytes(authorization))}`,
    "x-iyzi-rnd": randomKey,
  };
}
