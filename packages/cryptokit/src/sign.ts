import { type BinaryLike, toBytes } from "./encoding";
import {
  type Ed25519PublicKey,
  type Ed25519SecretKey,
  importSigningKey,
  importVerifyKey,
} from "./keys";

/** Sign `data` with an Ed25519 secret key. Returns the 64-byte signature. */
export async function signEd25519(
  secretKey: Ed25519SecretKey,
  data: BinaryLike,
): Promise<Uint8Array> {
  const key = await importSigningKey(secretKey);
  const signature = await crypto.subtle.sign("Ed25519", key, toBytes(data).slice().buffer);
  return new Uint8Array(signature);
}

/**
 * Verify an Ed25519 signature. Returns `false` for any invalid input —
 * verification never throws on hostile data.
 */
export async function verifyEd25519(
  publicKey: Ed25519PublicKey,
  data: BinaryLike,
  signature: Uint8Array,
): Promise<boolean> {
  try {
    const key = await importVerifyKey(publicKey);
    return await crypto.subtle.verify(
      "Ed25519",
      key,
      signature.slice().buffer,
      toBytes(data).slice().buffer,
    );
  } catch {
    return false;
  }
}
