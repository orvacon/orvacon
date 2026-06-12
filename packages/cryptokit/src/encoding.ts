/**
 * Input accepted by every cryptokit primitive: a UTF-8 string or raw bytes.
 * Strings are encoded exactly once, here — no other module touches
 * `TextEncoder`.
 */
export type BinaryLike = string | Uint8Array;

const textEncoder = new TextEncoder();

/** Normalize a {@link BinaryLike} to bytes (strings are UTF-8 encoded). */
export function toBytes(data: BinaryLike): Uint8Array {
  return typeof data === "string" ? textEncoder.encode(data) : data;
}

const HEX = "0123456789abcdef";

/** Encode bytes as lowercase hex. */
export function toHex(bytes: Uint8Array): string {
  let out = "";
  for (const b of bytes) {
    out += HEX.charAt(b >> 4) + HEX.charAt(b & 15);
  }
  return out;
}

/**
 * Decode lowercase/uppercase hex to bytes.
 *
 * @throws TypeError on odd length or a non-hex character.
 */
export function fromHex(hex: string): Uint8Array {
  if (hex.length % 2 !== 0 || /[^0-9a-fA-F]/.test(hex)) {
    throw new TypeError("Invalid hex string");
  }
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

const B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

/** Encode bytes as standard base64 (with padding). */
export function toBase64(bytes: Uint8Array): string {
  let out = "";
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i] ?? 0;
    const b = bytes[i + 1] ?? 0;
    const c = bytes[i + 2] ?? 0;
    const group = (a << 16) | (b << 8) | c;
    out += B64.charAt((group >> 18) & 63);
    out += B64.charAt((group >> 12) & 63);
    out += i + 1 < bytes.length ? B64.charAt((group >> 6) & 63) : "=";
    out += i + 2 < bytes.length ? B64.charAt(group & 63) : "=";
  }
  return out;
}

/**
 * Decode standard base64 (padding optional) to bytes.
 *
 * @throws TypeError on a character outside the base64 alphabet.
 */
export function fromBase64(value: string): Uint8Array {
  const stripped = value.replace(/=+$/, "");
  if (/[^A-Za-z0-9+/]/.test(stripped)) {
    throw new TypeError("Invalid base64 string");
  }
  const out = new Uint8Array(Math.floor((stripped.length * 3) / 4));
  let acc = 0;
  let bits = 0;
  let index = 0;
  for (const char of stripped) {
    acc = (acc << 6) | B64.indexOf(char);
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      out[index++] = (acc >> bits) & 255;
    }
  }
  return out;
}

/** Encode bytes as base64url (RFC 4648 §5, no padding). */
export function toBase64Url(bytes: Uint8Array): string {
  return toBase64(bytes).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/**
 * Decode base64url to bytes.
 *
 * @throws TypeError on a character outside the base64url alphabet.
 */
export function fromBase64Url(value: string): Uint8Array {
  if (/[^A-Za-z0-9_-]/.test(value)) {
    throw new TypeError("Invalid base64url string");
  }
  return fromBase64(value.replace(/-/g, "+").replace(/_/g, "/"));
}
