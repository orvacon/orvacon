import type {
  AuthorizeInput,
  CaptureInput,
  ConnectorAction,
  ConnectorCapabilities,
  ConnectorContext,
  ConnectorResult,
  DeleteCardInput,
  DeleteCardResult,
  NormalizedEvent,
  OrvaconConnector,
  PaymentSource,
  RawWebhook,
  RefundInput,
  StoreCardInput,
  StoreCardResult,
} from "@orvacon/paykit";
import { decodeMockWebhook } from "./callback";
import { type MockOutcome, outcomeForNumber } from "./cards";

const DEFAULT_CAPABILITIES = {
  signatureEncoding: "base64",
  callbackUrl: "api",
  threeDSecure: "html",
  webhookResponse: "standard",
  partialCapture: true,
  partialRefund: true,
  fraudStatus: false,
  autoCapture: false,
} satisfies ConnectorCapabilities;

/** Options for {@link mockConnector}. */
export interface MockConnectorOptions {
  /** Id used in `connectors: []` and `handleWebhook(id, …)`. Default `"mock"`. */
  id?: string;
  /** Override any capability — e.g. `{ autoCapture: true }` to capture at authorize. */
  capabilities?: Partial<ConnectorCapabilities>;
}

function outcomeFor(source: PaymentSource): MockOutcome {
  return source.type === "token" ? "success" : outcomeForNumber(source.card.number);
}

function challenge(
  threeDSecure: ConnectorCapabilities["threeDSecure"],
  paymentId: string,
): ConnectorAction {
  if (threeDSecure === "iframe") {
    return { type: "iframe", token: `mock_3ds_${paymentId}` };
  }
  if (threeDSecure === "redirect") {
    return { type: "redirect", url: `https://mock.orvacon.test/3ds/${paymentId}` };
  }
  return { type: "html", content: "<!doctype html><title>Mock 3-D Secure challenge</title>" };
}

/**
 * An in-memory gateway that never makes a network call. Register it like any
 * connector — `orvacon({ connectors: [mockConnector()] })` — and drive real
 * flows. Outcomes are deterministic: the card decides them ({@link testCards}),
 * and `threeDSecure: true` returns `requires_action` for you to finalize with
 * {@link mockCallback}.
 */
export function mockConnector(options: MockConnectorOptions = {}): OrvaconConnector {
  const capabilities = { ...DEFAULT_CAPABILITIES, ...options.capabilities };
  const id = options.id ?? "mock";

  return {
    id,
    version: "0.0.0",
    capabilities,

    async authorize(_ctx: ConnectorContext, input: AuthorizeInput): Promise<ConnectorResult> {
      const outcome = outcomeFor(input.source);
      if (outcome === "declined") {
        return { ok: false, error: { code: "declined", message: "The mock card was declined." } };
      }
      if (outcome === "gateway_error") {
        return {
          ok: false,
          error: { code: "gateway_error", message: "The mock gateway is unavailable." },
        };
      }
      const gatewayReference = `mock_${input.paymentId}`;
      if (input.threeDSecure) {
        return {
          ok: true,
          status: "requires_action",
          gatewayReference,
          action: challenge(capabilities.threeDSecure, input.paymentId),
          raw: {},
        };
      }
      return {
        ok: true,
        status: capabilities.autoCapture ? "captured" : "authorized",
        gatewayReference,
        raw: {},
      };
    },

    async capture(_ctx: ConnectorContext, input: CaptureInput): Promise<ConnectorResult> {
      return { ok: true, status: "captured", gatewayReference: input.gatewayReference, raw: {} };
    },

    async refund(_ctx: ConnectorContext, input: RefundInput): Promise<ConnectorResult> {
      return { ok: true, status: "refunded", gatewayReference: input.gatewayReference, raw: {} };
    },

    async parseWebhook(_ctx: ConnectorContext, raw: RawWebhook): Promise<NormalizedEvent> {
      return decodeMockWebhook(raw);
    },

    async storeCard(_ctx: ConnectorContext, input: StoreCardInput): Promise<StoreCardResult> {
      const last4 = input.card.number.slice(-4);
      return {
        ok: true,
        card: {
          token: { token: `mock_tok_${last4}`, userKey: input.userKey ?? "mock_user_key" },
          last4,
          brand: "Visa",
        },
        raw: {},
      };
    },

    async deleteCard(_ctx: ConnectorContext, _input: DeleteCardInput): Promise<DeleteCardResult> {
      return { ok: true };
    },
  };
}
