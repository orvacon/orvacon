import { type BinaryLike, toBytes } from "./encoding";

/** Options for {@link hkdfSha256}. */
export type HkdfOptions = {
  /** Optional non-secret salt; improves extraction when available. */
  salt?: BinaryLike;
  /** Context/application tag binding the derived key to one purpose. */
  info?: BinaryLike;
  /** Output length in bytes. Default 32. */
  length?: number;
};

/**
 * HKDF-SHA256 (RFC 5869) key derivation: expand one input keying material into
 * purpose-bound keys. Always pass a distinct `info` per purpose, so two
 * derivations from the same secret can never collide.
 */
export async function hkdfSha256(ikm: BinaryLike, options: HkdfOptions = {}): Promise<Uint8Array> {
  const length = options.length ?? 32;
  if (!Number.isSafeInteger(length) || length <= 0 || length > 255 * 32) {
    throw new TypeError(`HKDF output length must be 1-${255 * 32} bytes, got ${length}`);
  }
  const key = await crypto.subtle.importKey("raw", toBytes(ikm).slice().buffer, "HKDF", false, [
    "deriveBits",
  ]);
  const bits = await crypto.subtle.deriveBits(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt: toBytes(options.salt ?? new Uint8Array(0)).slice().buffer,
      info: toBytes(options.info ?? new Uint8Array(0)).slice().buffer,
    },
    key,
    length * 8,
  );
  return new Uint8Array(bits);
}
