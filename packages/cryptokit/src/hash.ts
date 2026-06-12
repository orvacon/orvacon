import { type BinaryLike, toBytes } from "./encoding";

/**
 * SHA-256 digest. The single hash primitive in orvacon — pair it with the
 * encoding helpers (`toHex(await sha256(x))`) instead of minting per-encoding
 * variants.
 */
export async function sha256(data: BinaryLike): Promise<Uint8Array> {
  const input = toBytes(data);
  const digest = await crypto.subtle.digest("SHA-256", input.slice().buffer);
  return new Uint8Array(digest);
}
