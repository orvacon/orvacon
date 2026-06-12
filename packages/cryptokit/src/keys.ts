import type { Brand } from "./brand";
import { fromBase64Url, fromHex, toBase64Url } from "./encoding";

/**
 * An Ed25519 public (verify) key in orvacon's string format:
 * `orvpk_<base64url of the 32 raw key bytes>`.
 *
 * One canonical key format across the ecosystem — single-line and env-var
 * friendly, self-describing (a public key can never be mistaken for a secret),
 * and greppable by secret scanners. PEM/JWK import-export is deliberately not
 * supported: these keys never leave the orvacon world, and the parse-once
 * branded type is what keeps raw key material from floating around the
 * codebase.
 */
export type Ed25519PublicKey = Brand<string, "Ed25519PublicKey">;

/**
 * An Ed25519 secret (signing) key in orvacon's string format:
 * `orvsk_<base64url of the 32-byte seed>`.
 *
 * **Secret.** Lives in an environment variable; never logged, never committed,
 * never sent anywhere. Generate with {@link generateSigningKeyPair} (the CLI
 * wraps it); the receiver side only ever sees the {@link Ed25519PublicKey}.
 */
export type Ed25519SecretKey = Brand<string, "Ed25519SecretKey">;

const PUBLIC_PREFIX = "orvpk_";
const SECRET_PREFIX = "orvsk_";
const KEY_BYTES = 32;

function decodeKeyPayload(value: string, prefix: string): Uint8Array | null {
  if (!value.startsWith(prefix)) {
    return null;
  }
  try {
    const bytes = fromBase64Url(value.slice(prefix.length));
    return bytes.length === KEY_BYTES ? bytes : null;
  } catch {
    return null;
  }
}

/**
 * Validate and brand a public key string (`orvpk_…`).
 *
 * @throws TypeError when the prefix, encoding, or length is wrong.
 */
export function parsePublicKey(value: string): Ed25519PublicKey {
  if (decodeKeyPayload(value, PUBLIC_PREFIX) === null) {
    throw new TypeError('Invalid public key: expected "orvpk_" + base64url of 32 bytes');
  }
  return value as Ed25519PublicKey;
}

/**
 * Validate and brand a secret key string (`orvsk_…`). The error message never
 * echoes the input — a near-miss secret must not end up in logs.
 *
 * @throws TypeError when the prefix, encoding, or length is wrong.
 */
export function parseSecretKey(value: string): Ed25519SecretKey {
  if (decodeKeyPayload(value, SECRET_PREFIX) === null) {
    throw new TypeError('Invalid secret key: expected "orvsk_" + base64url of 32 bytes');
  }
  return value as Ed25519SecretKey;
}

/**
 * DER prefix of a PKCS#8-wrapped Ed25519 private key (OID 1.3.101.112). The
 * wrapper is constant for this algorithm, so "seed → PKCS#8" is a fixed
 * 16-byte prepend — WebCrypto can only import private keys as PKCS#8, and this
 * keeps ASN.1 libraries (and PEM files) out of the codebase entirely.
 */
const PKCS8_ED25519_PREFIX = fromHex("302e020100300506032b657004220420");

function concatBytes(a: Uint8Array, b: Uint8Array): Uint8Array<ArrayBuffer> {
  const out = new Uint8Array(a.length + b.length);
  out.set(a, 0);
  out.set(b, a.length);
  return out;
}

/** Package-internal: import a secret key string as a non-extractable WebCrypto signing key. */
export async function importSigningKey(secretKey: Ed25519SecretKey): Promise<CryptoKey> {
  const seed = decodeKeyPayload(secretKey, SECRET_PREFIX);
  if (seed === null) {
    throw new TypeError("Invalid secret key");
  }
  const pkcs8 = concatBytes(PKCS8_ED25519_PREFIX, seed);
  return crypto.subtle.importKey("pkcs8", pkcs8.buffer, { name: "Ed25519" }, false, ["sign"]);
}

/** Package-internal: import a public key string as a non-extractable WebCrypto verify key. */
export async function importVerifyKey(publicKey: Ed25519PublicKey): Promise<CryptoKey> {
  const bytes = decodeKeyPayload(publicKey, PUBLIC_PREFIX);
  if (bytes === null) {
    throw new TypeError("Invalid public key");
  }
  return crypto.subtle.importKey("raw", bytes.slice().buffer, { name: "Ed25519" }, false, [
    "verify",
  ]);
}

/** A freshly generated Ed25519 key pair in orvacon's string format. */
export type SigningKeyPair = {
  publicKey: Ed25519PublicKey;
  secretKey: Ed25519SecretKey;
};

/**
 * Generate an Ed25519 key pair (CSPRNG via WebCrypto). The public half is safe
 * to store anywhere; the secret half goes to an environment variable and
 * nowhere else. There is deliberately no "derive public key from secret"
 * helper — WebCrypto cannot do it without hand-rolled curve math, and the pair
 * is produced together here, so the need never arises.
 */
export async function generateSigningKeyPair(): Promise<SigningKeyPair> {
  const pair = await crypto.subtle.generateKey({ name: "Ed25519" }, true, ["sign", "verify"]);
  const pkcs8 = new Uint8Array(await crypto.subtle.exportKey("pkcs8", pair.privateKey));
  const rawPublic = new Uint8Array(await crypto.subtle.exportKey("raw", pair.publicKey));
  const seed = pkcs8.slice(-KEY_BYTES);
  if (pkcs8.length !== PKCS8_ED25519_PREFIX.length + KEY_BYTES || rawPublic.length !== KEY_BYTES) {
    throw new Error("Unexpected Ed25519 key export shape from the WebCrypto runtime");
  }
  return {
    publicKey: parsePublicKey(`${PUBLIC_PREFIX}${toBase64Url(rawPublic)}`),
    secretKey: parseSecretKey(`${SECRET_PREFIX}${toBase64Url(seed)}`),
  };
}
