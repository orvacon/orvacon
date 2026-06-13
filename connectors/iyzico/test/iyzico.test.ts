import { describe, expect, test } from "bun:test";
import { fromBase64, hmacSha256, toBase64, toBytes, toHex } from "@orvacon/cryptokit";
import { buildIyzwsV2Headers, generateRandomKey, iyzwsV2Payload } from "../src/index";

const decoder = new TextDecoder();

describe("IYZWSv2 payload", () => {
  test("matches Iyzico's documented example (randomKey + uriPath + body)", () => {
    expect(
      iyzwsV2Payload("1722246017090123456789", "/payment/bin/check", '{"binNumber":"589004"}'),
    ).toBe('1722246017090123456789/payment/bin/check{"binNumber":"589004"}');
  });

  test("omits the body when empty", () => {
    expect(iyzwsV2Payload("rnd-1", "/payment/auth", "")).toBe("rnd-1/payment/auth");
  });
});

describe("buildIyzwsV2Headers", () => {
  const apiKey = "sandbox-apikey";
  const secretKey = "sandbox-secret";
  const randomKey = "1722246017090123456789";
  const uriPath = "/payment/auth";
  const body = '{"price":"10.5"}';

  test("produces the verified IYZWSv2 header format with a correct HMAC", async () => {
    const headers = await buildIyzwsV2Headers({ apiKey, secretKey, uriPath, body, randomKey });
    expect(headers["x-iyzi-rnd"]).toBe(randomKey);

    // Signature is HEX(HMAC-SHA256(randomKey + uriPath + body)), computed independently here.
    const expectedSig = toHex(await hmacSha256(secretKey, `${randomKey}${uriPath}${body}`));
    const expectedAuthString = `apiKey:${apiKey}&randomKey:${randomKey}&signature:${expectedSig}`;

    expect(headers.Authorization).toBe(`IYZWSv2 ${toBase64(toBytes(expectedAuthString))}`);

    // The base64 decodes back to the exact documented authorization-string shape.
    const encoded = headers.Authorization.slice("IYZWSv2 ".length);
    expect(decoder.decode(fromBase64(encoded))).toBe(expectedAuthString);
  });

  test("signs the bodyless payload when no body is given", async () => {
    const headers = await buildIyzwsV2Headers({ apiKey, secretKey, uriPath, randomKey });
    const expectedSig = toHex(await hmacSha256(secretKey, `${randomKey}${uriPath}`));
    const encoded = headers.Authorization.slice("IYZWSv2 ".length);
    expect(decoder.decode(fromBase64(encoded))).toBe(
      `apiKey:${apiKey}&randomKey:${randomKey}&signature:${expectedSig}`,
    );
  });

  test("defaults to a fresh nonce per call", async () => {
    const a = await buildIyzwsV2Headers({ apiKey, secretKey, uriPath });
    const b = await buildIyzwsV2Headers({ apiKey, secretKey, uriPath });
    expect(a["x-iyzi-rnd"]).toMatch(/^[0-9a-f]{32}$/);
    expect(a["x-iyzi-rnd"]).not.toBe(b["x-iyzi-rnd"]);
  });
});

describe("generateRandomKey", () => {
  test("is 32 lowercase hex chars and unique across calls", () => {
    const a = generateRandomKey();
    const b = generateRandomKey();
    expect(a).toMatch(/^[0-9a-f]{32}$/);
    expect(a).not.toBe(b);
  });
});
