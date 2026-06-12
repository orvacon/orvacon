export type {
  AuthorizeInput,
  CaptureInput,
  Card,
  ConnectorAction,
  ConnectorCapabilities,
  ConnectorContext,
  ConnectorError,
  ConnectorErrorCode,
  Logger,
  NormalizedEvent,
  NormalizedEventType,
  OrvaconConnector,
  RawError,
  RawWebhook,
  RefundInput,
  SetupResult,
} from "./connector";
export * from "./money";
export * from "./state";

import type {
  AuthorizeInput,
  CaptureInput,
  ConnectorResult,
  Logger,
  NormalizedEvent,
  OrvaconConnector,
  RawWebhook,
  RefundInput,
} from "./connector";

/**
 * Configuration for an orvacon instance. Validated fail-fast in {@link orvacon};
 * missing or invalid config throws at setup, not at the first payment.
 */
export type OrvaconConfig = {
  /** Registered gateway connectors, e.g. `[iyzico({ ... })]`. */
  connectors: OrvaconConnector[];
  /** Optional logger. Defaults to a no-op. */
  logger?: Logger;
  /** Per-gateway-call timeout in milliseconds. */
  timeout?: number;
};

/**
 * The application-facing orchestrator. The app calls these without knowing which
 * gateway is behind a payment.
 */
export interface Orvacon {
  authorize(input: AuthorizeInput): Promise<ConnectorResult>;
  capture(input: CaptureInput): Promise<ConnectorResult>;
  refund(input: RefundInput): Promise<ConnectorResult>;
  handleWebhook(connectorId: string, raw: RawWebhook): Promise<NormalizedEvent>;
}

/**
 * Construct an orvacon instance from a connector set and options.
 *
 * @remarks Skeleton — the orchestration body is not implemented yet.
 */
export function orvacon(_config: OrvaconConfig): Orvacon {
  throw new Error("orvacon(): not implemented");
}
