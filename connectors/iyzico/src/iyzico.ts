import type { OrvaconConnector } from "@orvacon/paykit/connector";
import { authorize } from "./authorize";
import { IYZICO_CAPABILITIES } from "./capabilities";
import { type IyzicoConfig, resolveIyzicoConfig } from "./config";
import { IYZICO_ERROR_CODES } from "./error-codes";
import { parseWebhook } from "./parse-webhook";
import { refund } from "./refund";
import { retrievePayment } from "./retrieve";
import { createTransport } from "./transport";

/**
 * Construct the Iyzico connector. Register it with
 * `orvacon({ connectors: [iyzico({ apiKey, secretKey, environment? })] })`.
 *
 * Validates config fail-fast, binds one IYZWSv2-signed transport, and exposes
 * the four operations. `capture` is a declared boundary: Iyzico captures at
 * authorize, so the core gates a separate capture via `autoCapture: true` and
 * this fallback is reached only if that gate is bypassed.
 *
 * @remarks Several gateway specifics carry an `Unverified — confirm against
 * sandbox` note in the individual operations (trailing-zero price, callback
 * encoding, finalize shape); a sandbox smoke-test closes them. The async
 * X-IYZ-SIGNATURE-V3 notification and a dropped-callback reconciliation backstop
 * land after.
 */
export function iyzico(config: IyzicoConfig): OrvaconConnector {
  const resolved = resolveIyzicoConfig(config);
  const transport = createTransport(resolved, IYZICO_ERROR_CODES);
  return {
    id: "iyzico",
    version: "0.1.0",
    capabilities: IYZICO_CAPABILITIES,
    authorize: (ctx, input) => authorize(transport, ctx, input),
    capture: async () => ({
      ok: false,
      error: {
        code: "invalid_request",
        message:
          "iyzico captures at authorize; a separate capture requires the pre-authorization flow (post-v1)",
      },
    }),
    refund: (ctx, input) => refund(transport, ctx, input),
    parseWebhook: (ctx, raw) => parseWebhook(transport, ctx, raw),
    retrievePayment: (ctx, input) => retrievePayment(transport, ctx, input),
    $ERROR_CODES: IYZICO_ERROR_CODES,
  };
}
