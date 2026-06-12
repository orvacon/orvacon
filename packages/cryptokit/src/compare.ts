import { type BinaryLike, toBytes } from "./encoding";

/**
 * Constant-time equality for secrets — signatures, tokens, MACs. Never compare
 * a secret with `===` / `==`: a short-circuiting comparison returns faster the
 * earlier it mismatches and leaks the secret byte by byte (both Iyzico's and
 * PayTR's official samples make this mistake; do not copy them).
 *
 * The comparison time depends only on the inputs' lengths, never on their
 * contents. Lengths themselves are not secret for MACs and signatures (the
 * expected length is public), so a length mismatch simply returns `false`.
 */
export function timingSafeEqual(a: BinaryLike, b: BinaryLike): boolean {
  const aBytes = toBytes(a);
  const bBytes = toBytes(b);
  const length = Math.max(aBytes.length, bBytes.length, 1);
  let diff = aBytes.length ^ bBytes.length;
  for (let i = 0; i < length; i++) {
    diff |= (aBytes[i % aBytes.length] ?? 0) ^ (bBytes[i % bBytes.length] ?? 0);
  }
  return diff === 0;
}
