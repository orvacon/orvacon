import { describe, expect, test } from "bun:test";
import {
  fromBase64,
  fromBase64Url,
  fromHex,
  generateSigningKeyPair,
  hkdfSha256,
  hmacSha256,
  parsePublicKey,
  parseSecretKey,
  sha256,
  signEd25519,
  signWebhook,
  timingSafeEqual,
  toBase64,
  toBase64Url,
  toHex,
  verifyEd25519,
  verifyHmacSha256,
  verifyWebhook,
} from "../src/index";

describe("encoding", () => {
  test("hex round-trips and rejects malformed input", () => {
    const bytes = new Uint8Array([0, 1, 171, 255]);
    expect(toHex(bytes)).toBe("0001abff");
    expect(fromHex("0001abff")).toEqual(bytes);
    expect(() => fromHex("abc")).toThrow(TypeError);
    expect(() => fromHex("zz")).toThrow(TypeError);
  });

  test("base64 and base64url round-trip and reject malformed input", () => {
    const bytes = new Uint8Array([251, 239, 190, 0, 1]);
    expect(fromBase64(toBase64(bytes))).toEqual(bytes);
    expect(fromBase64Url(toBase64Url(bytes))).toEqual(bytes);
    expect(toBase64Url(bytes)).not.toContain("=");
    expect(toBase64(new Uint8Array([255, 255, 254]))).toBe("///+");
    expect(toBase64Url(new Uint8Array([255, 255, 254]))).toBe("___-");
    expect(() => fromBase64("a$b=")).toThrow(TypeError);
    expect(() => fromBase64Url("a+b")).toThrow(TypeError);
  });
});

describe("sha256 (FIPS 180-4 vector)", () => {
  test('digest of "abc"', async () => {
    expect(toHex(await sha256("abc"))).toBe(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
    );
  });
});

describe("hmacSha256 (RFC 4231 vectors)", () => {
  test("test case 1", async () => {
    const key = fromHex("0b".repeat(20));
    expect(toHex(await hmacSha256(key, "Hi There"))).toBe(
      "b0344c61d8db38535ca8afceaf0bf12b881dc200c9833da726e9376c2e32cff7",
    );
  });

  test("test case 2", async () => {
    expect(toHex(await hmacSha256("Jefe", "what do ya want for nothing?"))).toBe(
      "5bdcc146bf60754e6a042426089575c75a003f089d2739839dec58b964ec3843",
    );
  });

  test("verifyHmacSha256 accepts the right MAC and rejects a forged one", async () => {
    const mac = await hmacSha256("Jefe", "what do ya want for nothing?");
    expect(await verifyHmacSha256("Jefe", "what do ya want for nothing?", mac)).toBe(true);
    mac[0] = (mac[0] ?? 0) ^ 1;
    expect(await verifyHmacSha256("Jefe", "what do ya want for nothing?", mac)).toBe(false);
  });
});

describe("hkdfSha256 (RFC 5869 test case 1)", () => {
  test("derives the documented OKM", async () => {
    const okm = await hkdfSha256(fromHex("0b".repeat(22)), {
      salt: fromHex("000102030405060708090a0b0c"),
      info: fromHex("f0f1f2f3f4f5f6f7f8f9"),
      length: 42,
    });
    expect(toHex(okm)).toBe(
      "3cb25f25faacd57a90434f64d0362f2a2d2d0a90cf1a5a4c5db02d56ecc4c5bf34007208d5b887185865",
    );
  });

  test("rejects a nonsense output length", async () => {
    expect(hkdfSha256("ikm", { length: 0 })).rejects.toThrow(TypeError);
  });
});

describe("timingSafeEqual", () => {
  test("compares contents, tolerates strings and bytes, rejects mismatches", () => {
    expect(timingSafeEqual("secret", "secret")).toBe(true);
    expect(timingSafeEqual("secret", "secreT")).toBe(false);
    expect(timingSafeEqual(new Uint8Array([1, 2]), new Uint8Array([1, 2]))).toBe(true);
    expect(timingSafeEqual("ab", "abc")).toBe(false);
    expect(timingSafeEqual("", "")).toBe(true);
  });
});

describe("Ed25519 (RFC 8032 test 1)", () => {
  const secretKey = parseSecretKey(
    `orvsk_${toBase64Url(fromHex("9d61b19deffd5a60ba844af492ec2cc44449c5697b326919703bac031cae7f60"))}`,
  );
  const publicKey = parsePublicKey(
    `orvpk_${toBase64Url(fromHex("d75a980182b10ab7d54bfed3c964073a0ee172f3daa62325af021a68f707511a"))}`,
  );

  test("produces the documented signature for the empty message", async () => {
    const signature = await signEd25519(secretKey, new Uint8Array(0));
    expect(toHex(signature)).toBe(
      "e5564300c360ac729086e2cc806e828a84877f1eb8e5d974d873e065224901555fb8821590a33bacc61e39701cf9b46bd25bf5f0595bbe24655141438e7a100b",
    );
    expect(await verifyEd25519(publicKey, new Uint8Array(0), signature)).toBe(true);
  });

  test("rejects a tampered message and malformed signatures without throwing", async () => {
    const signature = await signEd25519(secretKey, "hello");
    expect(await verifyEd25519(publicKey, "hello", signature)).toBe(true);
    expect(await verifyEd25519(publicKey, "hellO", signature)).toBe(false);
    expect(await verifyEd25519(publicKey, "hello", new Uint8Array(3))).toBe(false);
  });
});

describe("keys", () => {
  test("generates parseable pairs that sign and verify", async () => {
    const pair = await generateSigningKeyPair();
    expect(pair.publicKey.startsWith("orvpk_")).toBe(true);
    expect(pair.secretKey.startsWith("orvsk_")).toBe(true);
    expect(parsePublicKey(pair.publicKey)).toBe(pair.publicKey);
    expect(parseSecretKey(pair.secretKey)).toBe(pair.secretKey);
    const signature = await signEd25519(pair.secretKey, "payload");
    expect(await verifyEd25519(pair.publicKey, "payload", signature)).toBe(true);
  });

  test("rejects wrong prefixes, lengths, and encodings", () => {
    expect(() => parsePublicKey("orvsk_AAAA")).toThrow(TypeError);
    expect(() => parseSecretKey("orvpk_AAAA")).toThrow(TypeError);
    expect(() => parsePublicKey(`orvpk_${toBase64Url(new Uint8Array(16))}`)).toThrow(TypeError);
    expect(() => parseSecretKey("orvsk_!!!!")).toThrow(TypeError);
  });
});

describe("webhook envelope", () => {
  const NOW = 1_750_000_000;

  test("signs and verifies a delivery", async () => {
    const pair = await generateSigningKeyPair();
    const payload = { id: "evt_1", timestamp: NOW, payload: '{"type":"payment.captured"}' };
    const signature = await signWebhook(pair.secretKey, payload);
    expect(signature.startsWith("v1,")).toBe(true);
    expect(await verifyWebhook(pair.publicKey, { ...payload, signature, now: NOW })).toEqual({
      valid: true,
    });
  });

  test("rejects tampered payloads, foreign keys, and replays — with reasons", async () => {
    const pair = await generateSigningKeyPair();
    const other = await generateSigningKeyPair();
    const payload = { id: "evt_2", timestamp: NOW, payload: '{"amount":1000}' };
    const signature = await signWebhook(pair.secretKey, payload);

    expect(
      await verifyWebhook(pair.publicKey, {
        ...payload,
        payload: '{"amount":9000}',
        signature,
        now: NOW,
      }),
    ).toEqual({ valid: false, reason: "signature_mismatch" });
    expect(await verifyWebhook(other.publicKey, { ...payload, signature, now: NOW })).toEqual({
      valid: false,
      reason: "signature_mismatch",
    });
    expect(await verifyWebhook(pair.publicKey, { ...payload, signature, now: NOW + 301 })).toEqual({
      valid: false,
      reason: "timestamp_out_of_tolerance",
    });
    expect(
      await verifyWebhook(pair.publicKey, { ...payload, signature: "v2,abc", now: NOW }),
    ).toEqual({ valid: false, reason: "unsupported_version" });
    expect(
      await verifyWebhook(pair.publicKey, { ...payload, signature: "v1,$$$", now: NOW }),
    ).toEqual({ valid: false, reason: "malformed_signature" });
  });
});
