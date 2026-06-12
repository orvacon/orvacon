import { timingSafeEqual } from "./compare";
import { type BinaryLike, toBytes } from "./encoding";

async function importHmacKey(key: BinaryLike): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    toBytes(key).slice().buffer,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
}

/**
 * HMAC-SHA256. The single MAC primitive — Iyzico's hex and PayTR's base64
 * signatures are both `hmacSha256` composed with an encoder
 * (`toHex(await hmacSha256(key, payload))` / `toBase64(...)`), never separate
 * functions.
 */
export async function hmacSha256(key: BinaryLike, data: BinaryLike): Promise<Uint8Array> {
  const cryptoKey = await importHmacKey(key);
  const signature = await crypto.subtle.sign("HMAC", cryptoKey, toBytes(data).slice().buffer);
  return new Uint8Array(signature);
}

/**
 * Compute an HMAC-SHA256 over `data` and compare it against `expected` in
 * constant time. The safe verification path packaged as one call, so gateway
 * webhook checks cannot accidentally fall back to `===`. `expected` may be the
 * gateway's hex or base64 string decoded by the caller, or raw bytes.
 */
export async function verifyHmacSha256(
  key: BinaryLike,
  data: BinaryLike,
  expected: BinaryLike,
): Promise<boolean> {
  const computed = await hmacSha256(key, data);
  return timingSafeEqual(computed, expected);
}
