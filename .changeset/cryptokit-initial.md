---
"@orvacon/cryptokit": minor
---

Implement the cryptographic core — zero-dependency, Web Crypto only (Node ≥ 20, Bun, Workers, Deno): `sha256` and `hmacSha256` byte primitives composed with one encoding module (`toHex` / `toBase64` / `toBase64Url` and decoders — per-encoding function variants deliberately don't exist), constant-time `timingSafeEqual` plus the packaged-safe `verifyHmacSha256`, `hkdfSha256` (RFC 5869), Ed25519 signing with branded single-line key strings (`orvsk_…` / `orvpk_…`, parse-once factories — no PEM anywhere), `generateSigningKeyPair`, and the versioned signed-webhook envelope (`signWebhook` / `verifyWebhook`: `v1,<base64url>` over `id.timestamp.payload`, replay-window verification with reasoned verdicts). Verified against RFC 8032 / RFC 4231 / RFC 5869 / FIPS 180-4 test vectors.
