# @orvacon/connector-iyzico

## 0.1.1

### Patch Changes

- Fix the published packages so they install. Internal `@orvacon/*` dependencies were left as the `workspace:` protocol, which npm cannot resolve — the libraries were uninstallable. They now use explicit semver ranges. Also add a per-package README so the npm page is not bare.
- Updated dependencies
  - @orvacon/paykit@0.1.1
  - @orvacon/cryptokit@0.1.1

## 0.1.0

### Minor Changes

- 2a288c8: Add the Iyzico IYZWSv2 request-authentication module — the signing foundation every Iyzico API call requires. `buildIyzwsV2Headers({ apiKey, secretKey, uriPath, body })` returns the `Authorization: IYZWSv2 <base64>` and `x-iyzi-rnd` headers, signing `HEX(HMAC-SHA256(randomKey + uriPath + body))` over cryptokit's RFC-verified `hmacSha256` (no hand-rolled HMAC). Verified against Iyzico's official HMACSHA256 auth docs — including the empty-body rule and the exact `apiKey:…&randomKey:…&signature:…` authorization-string format that gets base64-encoded. The connector's flow methods (authorize / capture / refund / parseWebhook) and capabilities declaration land in follow-ups; `autoCapture` and 3DS callback behavior are deferred until verified against the sandbox.
- 6f15136: Implement the Iyzico `authorize` mapping on the signed transport. It maps `AuthorizeInput` (amount → price/paidPrice, source → paymentCard, buyer/addresses/basket → Iyzico's shapes) onto the gateway request, posting to `/payment/3dsecure/initialize` for a 3-D Secure flow — returning `requires_action` with the decoded challenge HTML — or `/payment/auth` otherwise. It validates Iyzico's required buyer/address/basket subset first and fails fast with a field-named `invalid_request` (e.g. "iyzico authorize requires buyer.nationalId") before any gateway call, and reconciles the basket line-item total against the amount currency-safely.

  Honest boundaries, each marked `Unverified — confirm against sandbox`: the trailing-zero `price` format, the auto-capture behavior of the direct (non-3DS) path, and the token (stored-card) flow — which is mapped but only the raw-card 3-D Secure path is the sandbox-verified, first-class v1 flow. `itemType` is derived from `BasketItem.type` (or, as a fallback, the presence of a shipping address) and never blanket-defaulted, since it controls whether a shipping address is mandatory.

- 11146fb: Add the `iyzico()` factory — the connector is now **registerable**: `orvacon({ connectors: [iyzico({ apiKey, secretKey, environment? })] })`. It validates config fail-fast, binds one IYZWSv2-signed transport, and wires all four operations (`authorize`, `refund`, `parseWebhook`, plus the declared `capture` boundary) alongside the verified `IYZICO_CAPABILITIES` declaration and a conservative, doc-verified `$ERROR_CODES` seed — well-known card declines → `declined`, credential/signature errors → `auth_error`, and every unlisted code resolves to `unknown` (surfaced for reconciliation, never guessed). This completes Iyzico's four-method v1 surface; a sandbox smoke-test closes the remaining `Unverified` items, and the async webhook notification + dropped-callback reconciliation land after.
- 4555ca9: Add `parseWebhook` — the Iyzico 3-D Secure callback handler that closes the payment loop, the connector's fourth and final operation. It gates on `mdStatus` (a bank-side 3DS failure → `payment.failed`, no gateway call); on success it calls the finalize endpoint (`/payment/3dsecure/auth`), and the authenticated finalize response is authoritative — so `payment.captured` (with the charged `paidPrice`) is emitted from it, never from the untrusted callback POST. A definite finalize failure → `payment.failed`; a transient/network finalize failure (`gateway_error`, outcome unknown) throws and leaves the payment for reconciliation rather than guessing. Adds `parsePrice` (gateway decimal → branded `Money`).

  `Unverified — confirm against sandbox`: the exact callback field encoding, the finalize response shape, and the trailing-zero price format. The async X-IYZ-SIGNATURE-V3 webhook notification is a separate, deferred path (post-v1); the dropped-callback backstop arrives with reconciliation (the next piece).

- 57e0933: Add the Iyzico `refund` and the capabilities declaration. Refund uses Refund V2, which keys on the payment id (orvacon's stored `gatewayReference`) rather than per-item transaction ids, so a partial or full refund needs only what the core already holds; the core sums refunds and decides `partially_refunded` vs `refunded`. The capabilities declare `autoCapture: true` (so the core gates a separate capture — Iyzico captures at authorize), `partialCapture: false`, `partialRefund: true`, hex signatures, and html 3-D Secure. Price formatting is now shared between authorize and refund.

  `Unverified — confirm against sandbox`: Refund V2 is documented as not recommended for multi-item baskets (it cannot target a line), so multi-item partial refunds are deferred (post-v1); the trailing-zero price format is also still unconfirmed.

- 8abbb63: Add the Iyzico HTTP foundation that every flow method builds on: a config contract and the signed transport layer. `IyzicoConfig` (`{ apiKey, secretKey, environment?, fetch? }`) is validated fail-fast and resolves `environment` (`"sandbox"` | `"production"`) to the documented base URL. The transport signs each request with IYZWSv2, sends it through an injectable `fetch` (defaulting to the platform global) carrying the core's `ctx.signal` for the per-call timeout, and normalizes Iyzico's response envelope: a `status: "failure"` body (with `errorCode` / `errorMessage`) and network/HTTP errors become a `ConnectorError` via `ctx.classifyError`, while an unmapped gateway code resolves to `unknown` and is never auto-retried. The injectable `fetch` is the single seam tests stub, smoke-tests pass real credentials through, and a future retry/timeout layer will wrap. Base URLs and the envelope field names are verified against Iyzico's official documentation.
- 8ada81f: Add `orva.reconcile(paymentId)` — the backstop for the narrow window where the gateway settled a payment (money moved) but the core crashed before persisting it, leaving the payment stuck at `requires_action`. It reads the gateway's authoritative state through a new optional connector method, `retrievePayment` (present only on connectors whose gateway offers a retrieve/inquiry call — its presence is the capability the core gates on), and advances the payment **only** if the gateway reports it settled; a payment the gateway still reports pending is left untouched, so reconciliation never invents money movement that did not happen. New public types: `ReconcileResult`, `ReconcileOutcome`, `RetrievePaymentInput`.

  The Iyzico connector implements `retrievePayment` over `/payment/detail`, keying on `paymentStatus` (verified against the sandbox: `SUCCESS` → captured, `INIT_THREEDS` and other non-terminal statuses → pending/untouched).

  Note on scope: orvacon never holds funds and Iyzico captures at 3-D Secure _finalize_, so a dropped 3-D Secure callback leaves the payment genuinely un-captured (no money moved) — reconciliation correctly no-ops there. Its job is the crash-window consistency gap (gateway-settled-but-unreflected), not expiring abandoned payments; v1 has no automatic expiry.

### Patch Changes

- 91c7ad2: Classify Iyzico error code `10220` (errorGroup `DECLINED`) as `declined` rather than the safe-default `unknown`. The sandbox smoke-test surfaced it on a declined refund: a definite decline was being reported as an ambiguous `unknown`, which is needlessly imprecise for consumers handling the result. This is the error-code table's intended sandbox-driven expansion — real codes added as they appear, not guessed up front.
- Updated dependencies [8602f28]
- Updated dependencies [46cc3f8]
- Updated dependencies [57e0933]
- Updated dependencies [66d0558]
- Updated dependencies [28b5c5f]
- Updated dependencies [4555ca9]
- Updated dependencies [e7a0d8a]
- Updated dependencies [d871036]
- Updated dependencies [8eb1cfb]
- Updated dependencies [a0229b7]
- Updated dependencies [8ada81f]
  - @orvacon/cryptokit@0.1.0
  - @orvacon/paykit@0.1.0
