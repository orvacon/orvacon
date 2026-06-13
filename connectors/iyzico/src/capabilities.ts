import type { ConnectorCapabilities } from "@orvacon/paykit/connector";

/**
 * Iyzico's declared capabilities — the core adapts to these instead of branching
 * on the connector's identity. `autoCapture: true` means Iyzico captures at
 * authorize, so the core rejects a separate `capture()`; `partialCapture: false`
 * blocks partial captures; `partialRefund: true` permits partial refunds. The
 * signature, callback, 3-D Secure, and webhook-response shapes match Iyzico's
 * documented behavior.
 */
export const IYZICO_CAPABILITIES = {
  signatureEncoding: "hex",
  callbackUrl: "api",
  threeDSecure: "html",
  webhookResponse: "standard",
  partialCapture: false,
  partialRefund: true,
  fraudStatus: true,
  autoCapture: true,
} satisfies ConnectorCapabilities;
