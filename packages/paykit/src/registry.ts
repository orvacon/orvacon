import type { Brand } from "./brand";
import type { OrvaconConnector } from "./connector";

/**
 * A connector id proven to be registered on this orvacon instance. Unlike
 * `PaymentId`, this brand is registry-dependent — there is no global "valid
 * connector id", only "registered on this instance" — which is why it is
 * validated against a {@link ConnectorRegistry} rather than a format.
 */
export type ConnectorId = Brand<string, "ConnectorId">;

/** Registered connectors, keyed by their stable id. */
export type ConnectorRegistry = ReadonlyMap<string, OrvaconConnector>;

/**
 * Build the id → connector map from config. Fail-fast: an empty connector
 * list, a connector without an id, or two connectors sharing one id is a
 * configuration bug and throws at construction, not at the first payment.
 */
export function buildConnectorRegistry(connectors: readonly OrvaconConnector[]): ConnectorRegistry {
  if (connectors.length === 0) {
    throw new TypeError("orvacon: at least one connector is required");
  }
  const registry = new Map<string, OrvaconConnector>();
  for (const connector of connectors) {
    if (typeof connector.id !== "string" || connector.id.length === 0) {
      throw new TypeError("orvacon: every connector must declare a non-empty id");
    }
    if (registry.has(connector.id)) {
      throw new TypeError(`orvacon: duplicate connector id "${connector.id}"`);
    }
    registry.set(connector.id, connector);
  }
  return registry;
}

/**
 * Validate that `value` names a connector registered in `registry` and brand it.
 *
 * @throws TypeError when the id is not registered.
 */
export function connectorId(value: string, registry: ConnectorRegistry): ConnectorId {
  if (!registry.has(value)) {
    throw new TypeError(`Unknown connector id "${value}"`);
  }
  return value as ConnectorId;
}
