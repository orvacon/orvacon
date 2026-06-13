import type { ConnectorContext, ConnectorError, RawError } from "@orvacon/paykit/connector";
import { buildIyzwsV2Headers } from "./auth";
import type { ResolvedIyzicoConfig } from "./config";

/**
 * Iyzico's common response envelope. Every endpoint wraps its result in this:
 * `status` is `"success"` or `"failure"`, and a failure carries `errorCode` /
 * `errorMessage` / `errorGroup` (field names verified against the API reference).
 */
export type IyzicoEnvelope = {
  status: "success" | "failure";
  errorCode?: string;
  errorMessage?: string;
  errorGroup?: string;
  conversationId?: string;
  locale?: string;
  systemTime?: number;
};

/** A successful Iyzico response body: the envelope plus the endpoint-specific fields the caller reads. */
export type IyzicoSuccess = IyzicoEnvelope & { status: "success" } & Record<string, unknown>;

/** A single Iyzico API call. `body` is serialized once; the exact string is both signed and sent. */
export type IyzicoRequest = {
  method: "POST";
  /** Path beginning with `/`, e.g. `/payment/3dsecure/initialize`. */
  path: string;
  body?: Record<string, unknown>;
};

/**
 * Transport outcome. The transport owns the envelope — transport/network errors
 * and `status: "failure"` become a normalized {@link ConnectorError}; a success
 * body is handed back for the calling method to interpret into a `ConnectorResult`.
 */
export type TransportResult =
  | { ok: true; body: IyzicoSuccess }
  | { ok: false; error: ConnectorError };

/**
 * Bind a signed-request function to resolved config. Every Iyzico call goes
 * through here: it signs the request with IYZWSv2 ({@link buildIyzwsV2Headers}),
 * sends it via the injected `fetch` carrying `ctx.signal` (so the core's
 * per-call timeout cancels a hung gateway), parses the JSON envelope, and maps a
 * `failure` envelope to a normalized error via `ctx.classifyError` + the
 * connector's `$ERROR_CODES`. An unmapped gateway code resolves to `unknown`,
 * which the core never auto-retries — the safe default for an ambiguous outcome.
 */
export function createTransport(
  config: ResolvedIyzicoConfig,
  errorCodes?: Record<string, RawError>,
) {
  return async function request(
    ctx: ConnectorContext,
    req: IyzicoRequest,
  ): Promise<TransportResult> {
    const body = req.body ? JSON.stringify(req.body) : "";
    const auth = await buildIyzwsV2Headers({
      apiKey: config.apiKey,
      secretKey: config.secretKey,
      uriPath: req.path,
      body,
    });

    let response: Response;
    try {
      response = await config.fetch(`${config.baseUrl}${req.path}`, {
        method: req.method,
        headers: { ...auth, "content-type": "application/json", accept: "application/json" },
        body: body.length === 0 ? undefined : body,
        signal: ctx.signal,
      });
    } catch (error) {
      return {
        ok: false,
        error: {
          code: "gateway_error",
          message: error instanceof Error ? error.message : "iyzico request failed",
        },
      };
    }

    if (!response.ok) {
      return {
        ok: false,
        error: { code: "gateway_error", message: `iyzico HTTP ${response.status}` },
      };
    }

    let parsed: IyzicoEnvelope & Record<string, unknown>;
    try {
      parsed = (await response.json()) as IyzicoEnvelope & Record<string, unknown>;
    } catch {
      return {
        ok: false,
        error: { code: "gateway_error", message: "iyzico returned a non-JSON response" },
      };
    }

    if (parsed.status === "failure") {
      return {
        ok: false,
        error: {
          code: ctx.classifyError(parsed.errorCode ?? "", errorCodes),
          message: parsed.errorMessage ?? "iyzico request failed",
          raw: parsed,
        },
      };
    }
    return { ok: true, body: parsed as IyzicoSuccess };
  };
}
