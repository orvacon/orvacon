/** Iyzico API environment. Sandbox keys carry a `sandbox-` prefix; the only runtime difference is the base URL. */
export type IyzicoEnvironment = "sandbox" | "production";

/**
 * The slice of `fetch` the connector relies on — just the call signature, so any
 * platform's `fetch` (Node, Bun, Workers) or a test double satisfies it, and a
 * future retry/timeout layer can wrap it without changing callers.
 */
export type FetchLike = (input: string | URL, init?: RequestInit) => Promise<Response>;

/** Configuration for the Iyzico connector, passed to its factory. */
export type IyzicoConfig = {
  apiKey: string;
  secretKey: string;
  /** Defaults to `"sandbox"`. */
  environment?: IyzicoEnvironment;
  /**
   * HTTP client, injectable. Defaults to the platform `fetch`. Tests pass a
   * double, a smoke-test passes the real `fetch`, and a future retry/timeout
   * layer will wrap this same seam — so testability and infrastructure enter
   * through one door.
   */
  fetch?: FetchLike;
};

const BASE_URLS = {
  sandbox: "https://sandbox-api.iyzipay.com",
  production: "https://api.iyzipay.com",
} as const satisfies Record<IyzicoEnvironment, string>;

/** The documented API base URL for an environment (verified against Iyzico's Live-vs-Sandbox docs). */
export function resolveBaseUrl(environment: IyzicoEnvironment): string {
  return BASE_URLS[environment];
}

/** Config with defaults applied and the base URL + fetch resolved — what the connector runs against. */
export type ResolvedIyzicoConfig = {
  apiKey: string;
  secretKey: string;
  environment: IyzicoEnvironment;
  baseUrl: string;
  fetch: FetchLike;
};

/**
 * Validate config fail-fast and resolve defaults: `environment` → `"sandbox"`,
 * the base URL, and `fetch` → the platform default. Missing credentials or an
 * invalid environment throw at construction, not at the first payment.
 */
export function resolveIyzicoConfig(config: IyzicoConfig): ResolvedIyzicoConfig {
  if (typeof config?.apiKey !== "string" || config.apiKey.length === 0) {
    throw new TypeError("iyzico: apiKey is required");
  }
  if (typeof config.secretKey !== "string" || config.secretKey.length === 0) {
    throw new TypeError("iyzico: secretKey is required");
  }
  const environment = config.environment ?? "sandbox";
  if (environment !== "sandbox" && environment !== "production") {
    throw new TypeError('iyzico: environment must be "sandbox" or "production"');
  }
  return {
    apiKey: config.apiKey,
    secretKey: config.secretKey,
    environment,
    baseUrl: resolveBaseUrl(environment),
    fetch: config.fetch ?? fetch,
  };
}
