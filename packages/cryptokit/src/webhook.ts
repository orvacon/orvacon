import { fromBase64Url, toBase64Url } from "./encoding";
import type { Ed25519PublicKey, Ed25519SecretKey } from "./keys";
import { signEd25519, verifyEd25519 } from "./sign";

/**
 * What a webhook signature covers: the delivery id, the send time, and the
 * exact payload string. Signing `id.timestamp.payload` (rather than the
 * payload alone) makes every delivery's signature unique and lets the receiver
 * reject replays by timestamp.
 */
export type WebhookSignaturePayload = {
  /** Unique delivery id (e.g. an `evt_…` id). */
  id: string;
  /** Unix time in seconds when the webhook was signed. */
  timestamp: number;
  /** The raw body string exactly as transmitted — re-serializing breaks the signature. */
  payload: string;
};

/** Options for {@link verifyWebhook}. */
export type VerifyWebhookOptions = WebhookSignaturePayload & {
  /** The `v1,…` signature value received with the delivery. */
  signature: string;
  /** Allowed clock skew/replay window in seconds. Default 300. */
  toleranceSeconds?: number;
  /** Injectable current time (unix seconds) for tests. */
  now?: number;
};

/** Outcome of {@link verifyWebhook} — a reasoned result, never a thrown error. */
export type WebhookVerification =
  | { valid: true }
  | {
      valid: false;
      reason:
        | "unsupported_version"
        | "malformed_signature"
        | "timestamp_out_of_tolerance"
        | "signature_mismatch";
    };

const SIGNATURE_VERSION = "v1";
const DEFAULT_TOLERANCE_SECONDS = 300;

function message(payload: WebhookSignaturePayload): string {
  return `${payload.id}.${payload.timestamp}.${payload.payload}`;
}

/**
 * Sign an outgoing webhook. Returns the versioned signature value
 * (`v1,<base64url>`) carried in the delivery's signature header; the version
 * tag lets the scheme rotate later without breaking existing receivers.
 */
export async function signWebhook(
  secretKey: Ed25519SecretKey,
  payload: WebhookSignaturePayload,
): Promise<string> {
  const signature = await signEd25519(secretKey, message(payload));
  return `${SIGNATURE_VERSION},${toBase64Url(signature)}`;
}

/**
 * Verify an inbound orvacon webhook: checks the timestamp against the replay
 * window first, then the Ed25519 signature over `id.timestamp.payload`.
 * Returns a reasoned verdict; hostile input can never make it throw.
 */
export async function verifyWebhook(
  publicKey: Ed25519PublicKey,
  options: VerifyWebhookOptions,
): Promise<WebhookVerification> {
  const tolerance = options.toleranceSeconds ?? DEFAULT_TOLERANCE_SECONDS;
  const now = options.now ?? Math.floor(Date.now() / 1000);
  if (!Number.isSafeInteger(options.timestamp) || Math.abs(now - options.timestamp) > tolerance) {
    return { valid: false, reason: "timestamp_out_of_tolerance" };
  }
  const [version, encoded, ...rest] = options.signature.split(",");
  if (version !== SIGNATURE_VERSION) {
    return { valid: false, reason: "unsupported_version" };
  }
  if (encoded === undefined || encoded.length === 0 || rest.length > 0) {
    return { valid: false, reason: "malformed_signature" };
  }
  let signature: Uint8Array;
  try {
    signature = fromBase64Url(encoded);
  } catch {
    return { valid: false, reason: "malformed_signature" };
  }
  const valid = await verifyEd25519(publicKey, message(options), signature);
  return valid ? { valid: true } : { valid: false, reason: "signature_mismatch" };
}
