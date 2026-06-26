import { parseSecretKey } from "@orvacon/cryptokit";
import type {
  ConnectorContext,
  ConnectorError,
  ConnectorErrorCode,
  ConnectorResult,
  DeleteCardResult,
  Logger,
  NormalizedEvent,
  NormalizedEventType,
  OrvaconConnector,
  RawError,
  RawWebhook,
  StoreCardResult,
} from "./connector";
import type { TransactionScope } from "./database";
import { createWebhookDeliverer } from "./delivery";
import { generatePaymentId, type IdempotencyKey, type PaymentId } from "./ids";
import { buildLedgerPair, LEDGER_GENESIS } from "./ledger";
import type { Money } from "./money";
import { addMoney, compareMoney, isZeroMoney, money, sameCurrency, subtractMoney } from "./money";
import { buildConnectorRegistry, type ConnectorRegistry } from "./registry";
import { assertTransition, canTransition, type Payment, type PaymentStatus } from "./state";
import type {
  AuthorizeRequest,
  BeforeAuthorizeResult,
  CaptureRequest,
  DeleteCardRequest,
  HookHandler,
  Hooks,
  OperationOutcome,
  Orvacon,
  OrvaconConfig,
  OrvaconPlugin,
  PluginContext,
  ReconcileResult,
  RefundRequest,
  StoreCardRequest,
  WebhookOutcome,
} from "./types";

export type {
  AuthorizeRequest,
  BeforeAuthorizeResult,
  CaptureRequest,
  DeleteCardRequest,
  HookHandler,
  Hooks,
  OperationOutcome,
  Orvacon,
  OrvaconConfig,
  OrvaconPlugin,
  PluginContext,
  ReconcileResult,
  RefundRequest,
  StoreCardRequest,
  WebhookOutcome,
} from "./types";

const noopLogger = {
  debug() {},
  info() {},
  warn() {},
  error() {},
} satisfies Logger;

const DEFAULT_TIMEOUT_MS = 30_000;
const DEFAULT_IDEMPOTENCY_TTL_MS = 24 * 60 * 60 * 1000;

function fail(code: ConnectorErrorCode, message: string): { ok: false; error: ConnectorError } {
  return { ok: false, error: { code, message } };
}

/** Attach the orvacon paymentId to a connector result, forming an {@link OperationOutcome}. */
function withPaymentId(result: ConnectorResult, paymentId: PaymentId): OperationOutcome {
  return { ...result, paymentId };
}

/** A rejected operation on a known payment — the {@link OperationOutcome} failure shape. */
function bad(paymentId: PaymentId, code: ConnectorErrorCode, message: string): OperationOutcome {
  return { ok: false, paymentId, error: { code, message } };
}

function classifyError(rawCode: string, errorCodes?: Record<string, RawError>): ConnectorErrorCode {
  return errorCodes?.[rawCode]?.code ?? "unknown";
}

function validateConfig(config: OrvaconConfig): void {
  if (typeof config !== "object" || config === null) {
    throw new TypeError("orvacon: config object is required");
  }
  if (typeof config.database !== "object" || config.database === null) {
    throw new TypeError("orvacon: config.database (a database adapter) is required");
  }
  if (!Array.isArray(config.connectors)) {
    throw new TypeError("orvacon: config.connectors must be an array");
  }
  if (config.plugins !== undefined) {
    if (!Array.isArray(config.plugins)) {
      throw new TypeError("orvacon: config.plugins must be an array");
    }
    for (const plugin of config.plugins) {
      if (typeof plugin !== "object" || plugin === null || typeof plugin.name !== "string") {
        throw new TypeError("orvacon: each plugin must be an object with a string name");
      }
    }
  }
  if (typeof config.webhookSigningKey !== "string" || config.webhookSigningKey.length === 0) {
    throw new TypeError("orvacon: config.webhookSigningKey is required (no unsigned-webhook mode)");
  }
  if (config.timeout !== undefined && (!Number.isFinite(config.timeout) || config.timeout <= 0)) {
    throw new TypeError("orvacon: config.timeout must be a positive number of milliseconds");
  }
  if (config.webhookUrl !== undefined) {
    let parsed: URL | undefined;
    try {
      parsed = typeof config.webhookUrl === "string" ? new URL(config.webhookUrl) : undefined;
    } catch {
      parsed = undefined;
    }
    if (!parsed || (parsed.protocol !== "http:" && parsed.protocol !== "https:")) {
      throw new TypeError("orvacon: config.webhookUrl must be an http(s) URL");
    }
  }
}

/**
 * Merge the instance's own hooks with every plugin's hooks into one handler list
 * per event, so a `payment.captured` (say) fires the app hook *and* each plugin's
 * — each isolated, a throw in one reported while the rest still run.
 */
function collectHooks(
  configHooks: Hooks | undefined,
  plugins: readonly OrvaconPlugin[],
): Partial<Record<NormalizedEventType, HookHandler[]>> {
  const handlers: Partial<Record<NormalizedEventType, HookHandler[]>> = {};
  const add = (source: Hooks | undefined): void => {
    for (const [type, handler] of Object.entries(source ?? {}) as [
      NormalizedEventType,
      HookHandler,
    ][]) {
      (handlers[type] ??= []).push(handler);
    }
  };
  add(configHooks);
  for (const plugin of plugins) {
    add(plugin.hooks);
  }
  return handlers;
}

/**
 * Construct an orvacon instance: validates config fail-fast, builds the
 * connector registry, and wires the orchestration over the database adapter.
 */
export function orvacon(config: OrvaconConfig): Orvacon {
  validateConfig(config);
  const registry: ConnectorRegistry = buildConnectorRegistry(config.connectors);
  const db = config.database;
  const logger = config.logger ?? noopLogger;
  const plugins = config.plugins ?? [];
  const pluginContext: PluginContext = { logger };
  const hookHandlers = collectHooks(config.hooks, plugins);
  const onError = config.onError;
  const timeoutMs = config.timeout ?? DEFAULT_TIMEOUT_MS;
  const signingKey = parseSecretKey(config.webhookSigningKey);
  const deliverer = config.webhookUrl
    ? createWebhookDeliverer({
        url: config.webhookUrl,
        secretKey: signingKey,
        retry: config.retry,
        timeoutMs,
        report,
        logger,
      })
    : undefined;

  function makeContext(): ConnectorContext {
    return { logger, signal: AbortSignal.timeout(timeoutMs), classifyError };
  }

  function report(error: unknown): void {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error(err.message);
    onError?.(err);
  }

  async function fireHook(payment: Payment, event: NormalizedEvent): Promise<void> {
    const handlers = hookHandlers[event.type];
    if (!handlers) {
      return;
    }
    for (const handler of handlers) {
      try {
        await handler(payment, event);
      } catch (error) {
        report(error);
      }
    }
  }

  /**
   * Run the plugin before-authorize chain: each plugin may rewrite the request
   * (the next sees the rewrite) or veto it. A plugin that throws fails the charge
   * closed — a fraud or tax step that errored must not be silently skipped.
   */
  async function runBeforeAuthorize(
    request: AuthorizeRequest,
  ): Promise<{ ok: true; request: AuthorizeRequest } | { ok: false; error: ConnectorError }> {
    let current = request;
    for (const plugin of plugins) {
      if (!plugin.beforeAuthorize) {
        continue;
      }
      let result: BeforeAuthorizeResult;
      try {
        result = await plugin.beforeAuthorize(pluginContext, current);
      } catch (error) {
        report(error);
        return {
          ok: false,
          error: { code: "unknown", message: `plugin "${plugin.name}" failed in beforeAuthorize` },
        };
      }
      if ("reject" in result) {
        return { ok: false, error: result.reject };
      }
      current = result;
    }
    return { ok: true, request: current };
  }

  /**
   * Surface a persisted transition: run the in-process hook (awaited — the
   * ordering contract callers rely on) and then schedule the signed outbound
   * webhook (fire-and-forget, so a slow endpoint never blocks the payment flow).
   */
  async function emit(payment: Payment, event: NormalizedEvent): Promise<void> {
    await fireHook(payment, event);
    deliverer?.deliver(payment, event);
  }

  function syntheticEvent(
    type: NormalizedEventType,
    payment: Payment,
    amount: Money,
    raw: unknown,
  ): NormalizedEvent {
    const base = {
      paymentId: payment.id,
      gatewayReference: payment.gatewayReference ?? "",
      occurredAt: new Date().toISOString(),
      raw,
    };
    return type === "payment.failed" || type === "payment.voided"
      ? { ...base, type }
      : { ...base, type, amount };
  }

  /**
   * Claim-or-replay wrapper around a mutating operation. The replay path casts
   * the stored `result` back to `ConnectorResult` — sound because the only
   * writer is `completeIdempotencyKey` below, which stores exactly the
   * `ConnectorResult` this function produced (a serialization boundary, the
   * one place outside brand factories where a cast is permitted).
   */
  async function withIdempotency(
    key: IdempotencyKey,
    run: () => Promise<OperationOutcome>,
  ): Promise<OperationOutcome> {
    const now = Date.now();
    const claim = await db.insertIdempotencyKey({
      key,
      status: "in_progress",
      createdAt: new Date(now).toISOString(),
      expiresAt: new Date(now + DEFAULT_IDEMPOTENCY_TTL_MS).toISOString(),
    });
    if (!claim.inserted) {
      const existing = claim.existing;
      if (existing.status === "completed") {
        return {
          ...(existing.result as ConnectorResult),
          paymentId: existing.paymentId,
        } as OperationOutcome;
      }
      if (Date.parse(existing.expiresAt) > now) {
        return {
          ok: false,
          paymentId: existing.paymentId,
          error: {
            code: "conflict",
            message:
              "another request with this idempotency key is in progress; retry after it settles",
          },
        };
      }
      const reclaimed = await db.reclaimIdempotencyKey(
        key,
        new Date(now + DEFAULT_IDEMPOTENCY_TTL_MS).toISOString(),
      );
      if (!reclaimed) {
        return {
          ok: false,
          paymentId: existing.paymentId,
          error: {
            code: "conflict",
            message:
              "another request just took over this stale idempotency key; retry after it settles",
          },
        };
      }
    }
    const outcome = await run();
    const { paymentId, ...result } = outcome;
    if (paymentId) {
      await db.completeIdempotencyKey(key, paymentId, result);
    }
    return outcome;
  }

  async function persistWithLedger(
    paymentId: PaymentId,
    from: PaymentStatus,
    to: PaymentStatus,
    patch: Partial<Pick<Payment, "gatewayReference" | "refundedTotal">> | undefined,
    movement: { amount: Money; kind: "capture" | "refund" } | undefined,
  ): Promise<Payment | null> {
    assertTransition(from, to);
    return db.transaction(async (tx: TransactionScope) => {
      const updated = await tx.updatePaymentStatus(paymentId, from, to, patch);
      if (updated && movement) {
        const head = await tx.getLedgerHead();
        const pair = await buildLedgerPair(head?.hash ?? LEDGER_GENESIS, {
          paymentId,
          amount: movement.amount,
          occurredAt: new Date().toISOString(),
          kind: movement.kind,
        });
        await tx.appendLedger(pair);
      }
      return updated;
    });
  }

  function resolveConnector(
    requested: string | undefined,
  ): OrvaconConnector | { ok: false; error: ConnectorError } {
    if (requested !== undefined) {
      const connector = registry.get(requested);
      return connector ?? fail("invalid_request", `unknown connector "${requested}"`);
    }
    if (registry.size > 1) {
      return fail(
        "invalid_request",
        "multiple connectors are registered; specify connectorId on the request",
      );
    }
    const sole = registry.values().next().value;
    return sole ?? fail("invalid_request", "no connector is registered");
  }

  async function authorize(request: AuthorizeRequest): Promise<OperationOutcome> {
    const resolved = resolveConnector(request.connectorId);
    if ("ok" in resolved) {
      return resolved;
    }
    const connector = resolved;
    if (request.threeDSecure && connector.capabilities.threeDSecure === "none") {
      return fail("invalid_request", `connector "${connector.id}" does not support 3-D Secure`);
    }
    return withIdempotency(request.idempotencyKey, async () => {
      const intercepted = await runBeforeAuthorize(request);
      if (!intercepted.ok) {
        return { ok: false, error: intercepted.error };
      }
      const req = intercepted.request;
      const id = generatePaymentId();
      const nowIso = new Date().toISOString();
      const _payment = await db.createPayment({
        id,
        status: "created",
        amount: req.amount,
        connectorId: connector.id,
        userId: req.userId,
        createdAt: nowIso,
        updatedAt: nowIso,
      });
      const result = await connector.authorize(makeContext(), {
        paymentId: id,
        amount: req.amount,
        source: req.source,
        threeDSecure: req.threeDSecure,
        callbackUrl: req.callbackUrl,
        buyer: req.buyer,
        billingAddress: req.billingAddress,
        shippingAddress: req.shippingAddress,
        basket: req.basket,
      });
      if (!result.ok) {
        const failed = await db.updatePaymentStatus(id, "created", "failed");
        if (failed) {
          await emit(
            failed,
            syntheticEvent("payment.failed", failed, req.amount, result.error.raw),
          );
        }
        return withPaymentId(result, id);
      }
      if (result.status === "requires_action") {
        await db.updatePaymentStatus(id, "created", "requires_action", {
          gatewayReference: result.gatewayReference,
        });
        return withPaymentId(result, id);
      }
      if (result.status !== "authorized" && result.status !== "captured") {
        report(new Error(`connector "${connector.id}" returned "${result.status}" from authorize`));
        return withPaymentId(result, id);
      }
      const updated = await persistWithLedger(
        id,
        "created",
        result.status,
        { gatewayReference: result.gatewayReference },
        result.status === "captured" ? { amount: req.amount, kind: "capture" } : undefined,
      );
      if (updated) {
        const type = result.status === "captured" ? "payment.captured" : "payment.authorized";
        await emit(updated, syntheticEvent(type, updated, req.amount, result.raw));
      }
      return withPaymentId(result, id);
    });
  }

  type LoadedPayment = { payment: Payment; connector: OrvaconConnector; gatewayReference: string };

  async function loadForOperation(paymentId: PaymentId): Promise<LoadedPayment | ConnectorResult> {
    const payment = await db.getPayment(paymentId);
    if (!payment) {
      return fail("invalid_request", `unknown payment "${paymentId}"`);
    }
    const connector = registry.get(payment.connectorId);
    if (!connector) {
      return fail(
        "invalid_request",
        `connector "${payment.connectorId}" is not registered on this instance`,
      );
    }
    if (!payment.gatewayReference) {
      return fail("invalid_request", `payment "${paymentId}" has no gateway reference yet`);
    }
    return { payment, connector, gatewayReference: payment.gatewayReference };
  }

  async function capture(request: CaptureRequest): Promise<OperationOutcome> {
    const loaded = await loadForOperation(request.paymentId);
    if ("ok" in loaded) {
      return withPaymentId(loaded, request.paymentId);
    }
    const { payment, connector, gatewayReference } = loaded;
    if (connector.capabilities.autoCapture) {
      return bad(
        payment.id,
        "invalid_request",
        `connector "${connector.id}" auto-captures at authorize and has no separate capture step`,
      );
    }
    if (!canTransition(payment.status, "captured")) {
      return bad(
        payment.id,
        "invalid_request",
        `cannot capture a payment in status "${payment.status}"`,
      );
    }
    if (request.amount) {
      if (!sameCurrency(request.amount, payment.amount)) {
        return bad(payment.id, "invalid_request", "currency mismatch");
      }
      const isPartial = compareMoney(request.amount, payment.amount) === -1;
      if (compareMoney(request.amount, payment.amount) === 1) {
        return bad(payment.id, "invalid_request", "capture amount exceeds the authorized amount");
      }
      if (isPartial && !connector.capabilities.partialCapture) {
        return bad(
          payment.id,
          "invalid_request",
          `connector "${connector.id}" does not support partial capture`,
        );
      }
    }
    const captureAmount = request.amount ?? payment.amount;
    return withIdempotency(request.idempotencyKey, async () => {
      const result = await connector.capture(makeContext(), {
        paymentId: payment.id,
        gatewayReference,
        amount: request.amount,
      });
      if (!result.ok) {
        return withPaymentId(result, payment.id);
      }
      const updated = await persistWithLedger(payment.id, payment.status, "captured", undefined, {
        amount: captureAmount,
        kind: "capture",
      });
      if (updated) {
        await emit(updated, syntheticEvent("payment.captured", updated, captureAmount, result.raw));
      } else {
        logger.warn(`capture race on payment "${payment.id}": state moved concurrently`);
      }
      return withPaymentId(result, payment.id);
    });
  }

  async function refund(request: RefundRequest): Promise<OperationOutcome> {
    const loaded = await loadForOperation(request.paymentId);
    if ("ok" in loaded) {
      return withPaymentId(loaded, request.paymentId);
    }
    const { payment, connector, gatewayReference } = loaded;
    if (!canTransition(payment.status, "refunded")) {
      return bad(
        payment.id,
        "invalid_request",
        `cannot refund a payment in status "${payment.status}"`,
      );
    }
    const refundedTotal = payment.refundedTotal ?? money(0, payment.amount.currency);
    const remaining = subtractMoney(payment.amount, refundedTotal);
    if (isZeroMoney(remaining)) {
      return bad(payment.id, "invalid_request", "payment is already fully refunded");
    }
    const delta = request.amount ?? remaining;
    if (!sameCurrency(delta, payment.amount)) {
      return bad(payment.id, "invalid_request", "currency mismatch");
    }
    if (compareMoney(delta, remaining) === 1) {
      return bad(payment.id, "invalid_request", "refund amount exceeds the refundable remainder");
    }
    if (compareMoney(delta, remaining) === -1 && !connector.capabilities.partialRefund) {
      return bad(
        payment.id,
        "invalid_request",
        `connector "${connector.id}" does not support partial refund`,
      );
    }
    return withIdempotency(request.idempotencyKey, async () => {
      const result = await connector.refund(makeContext(), {
        paymentId: payment.id,
        gatewayReference,
        amount: delta,
      });
      if (!result.ok) {
        return withPaymentId(result, payment.id);
      }
      const newTotal = addMoney(refundedTotal, delta);
      const to: PaymentStatus =
        compareMoney(newTotal, payment.amount) === 0 ? "refunded" : "partially_refunded";
      const updated = await persistWithLedger(
        payment.id,
        payment.status,
        to,
        { refundedTotal: newTotal },
        { amount: delta, kind: "refund" },
      );
      if (updated) {
        await emit(updated, syntheticEvent("payment.refunded", updated, delta, result.raw));
      } else {
        logger.warn(`refund race on payment "${payment.id}": state moved concurrently`);
      }
      return withPaymentId(result, payment.id);
    });
  }

  function webhookTarget(event: NormalizedEvent, payment: Payment): PaymentStatus {
    switch (event.type) {
      case "payment.authorized":
        return "authorized";
      case "payment.captured":
        return "captured";
      case "payment.failed":
        return "failed";
      case "payment.voided":
        return "voided";
      case "payment.refunded": {
        const total = addMoney(
          payment.refundedTotal ?? money(0, payment.amount.currency),
          event.amount,
        );
        return compareMoney(total, payment.amount) === -1 ? "partially_refunded" : "refunded";
      }
    }
  }

  async function handleWebhook(connectorIdValue: string, raw: RawWebhook): Promise<WebhookOutcome> {
    const connector = registry.get(connectorIdValue);
    if (!connector) {
      throw new Error(`orvacon: webhook for unknown connector "${connectorIdValue}"`);
    }
    const event = await connector.parseWebhook(makeContext(), raw);
    const payment = await db.getPayment(event.paymentId);
    if (!payment) {
      throw new Error(`orvacon: webhook for unknown payment "${event.paymentId}"`);
    }
    return settleEvent(payment, event);
  }

  /**
   * Apply a settled {@link NormalizedEvent} to its payment — the shared tail of
   * webhook handling and reconciliation. Both reach "the gateway moved this
   * payment" by different routes (an inbound webhook vs a retrieve) and then do
   * the identical thing: skip duplicates, refuse a captured/authorized amount
   * that disagrees with the stored amount (moving the payment to `failed`), and
   * otherwise transition + ledger + emit in one transaction.
   */
  async function settleEvent(payment: Payment, event: NormalizedEvent): Promise<WebhookOutcome> {
    const to = webhookTarget(event, payment);
    if (payment.status === to || !canTransition(payment.status, to)) {
      return { event, payment, duplicate: true };
    }
    if (
      (event.type === "payment.captured" || event.type === "payment.authorized") &&
      (!sameCurrency(event.amount, payment.amount) ||
        compareMoney(event.amount, payment.amount) !== 0)
    ) {
      report(
        new Error(
          `orvacon: webhook amount mismatch on payment "${payment.id}" — gateway reported ${event.amount.amount} ${event.amount.currency}, expected ${payment.amount.amount} ${payment.amount.currency}`,
        ),
      );
      if (canTransition(payment.status, "failed")) {
        const failed = await persistWithLedger(
          payment.id,
          payment.status,
          "failed",
          undefined,
          undefined,
        );
        if (failed) {
          await emit(failed, syntheticEvent("payment.failed", failed, payment.amount, event.raw));
          return { event, payment: failed, duplicate: false };
        }
      }
      return { event, payment, duplicate: false };
    }
    const movement =
      event.type === "payment.captured"
        ? ({ amount: event.amount, kind: "capture" } as const)
        : event.type === "payment.refunded"
          ? ({ amount: event.amount, kind: "refund" } as const)
          : undefined;
    const patch =
      event.type === "payment.refunded"
        ? {
            refundedTotal: addMoney(
              payment.refundedTotal ?? money(0, payment.amount.currency),
              event.amount,
            ),
          }
        : event.type === "payment.authorized" || event.type === "payment.captured"
          ? { gatewayReference: event.gatewayReference }
          : undefined;
    const updated = await persistWithLedger(payment.id, payment.status, to, patch, movement);
    if (!updated) {
      const current = await db.getPayment(payment.id);
      return { event, payment: current ?? payment, duplicate: true };
    }
    await emit(updated, event);
    return { event, payment: updated, duplicate: false };
  }

  async function reconcile(paymentId: PaymentId): Promise<ReconcileResult> {
    const payment = await db.getPayment(paymentId);
    if (!payment) {
      return {
        ok: false,
        error: { code: "invalid_request", message: `unknown payment "${paymentId}"` },
      };
    }
    const connector = registry.get(payment.connectorId);
    if (!connector?.retrievePayment) {
      return {
        ok: false,
        error: {
          code: "invalid_request",
          message: `connector "${payment.connectorId}" does not support reconciliation`,
        },
      };
    }
    // Only a payment awaiting its gateway result is reconcilable: `created` has no
    // gateway reference yet, and terminal states have nothing left to settle.
    if (payment.status !== "requires_action") {
      return {
        ok: false,
        error: {
          code: "invalid_request",
          message: `payment "${paymentId}" is not awaiting reconciliation (status "${payment.status}")`,
        },
      };
    }
    if (!payment.gatewayReference) {
      return {
        ok: false,
        error: {
          code: "invalid_request",
          message: `payment "${paymentId}" has no gateway reference`,
        },
      };
    }
    const outcome = await connector.retrievePayment(makeContext(), {
      paymentId: payment.id,
      gatewayReference: payment.gatewayReference,
    });
    if (!outcome.ok) {
      return { ok: false, error: outcome.error };
    }
    // The gateway still reports it pending — leave the payment untouched. Marking
    // a pending payment captured would invent money movement that never happened.
    if (!outcome.resolved) {
      return { ok: true, resolved: false, payment };
    }
    const settled = await settleEvent(payment, outcome.event);
    return { ok: true, resolved: true, payment: settled.payment, event: settled.event };
  }

  async function storeCard(request: StoreCardRequest): Promise<StoreCardResult> {
    const resolved = resolveConnector(request.connectorId);
    if ("ok" in resolved) {
      return resolved;
    }
    if (!resolved.storeCard) {
      return fail("invalid_request", `connector "${resolved.id}" does not support card storage`);
    }
    return resolved.storeCard(makeContext(), request);
  }

  async function deleteCard(request: DeleteCardRequest): Promise<DeleteCardResult> {
    const resolved = resolveConnector(request.connectorId);
    if ("ok" in resolved) {
      return resolved;
    }
    if (!resolved.deleteCard) {
      return fail("invalid_request", `connector "${resolved.id}" does not support card storage`);
    }
    return resolved.deleteCard(makeContext(), request);
  }

  return {
    authorize,
    capture,
    refund,
    handleWebhook,
    reconcile,
    storeCard,
    deleteCard,
    drainWebhooks: deliverer ? () => deliverer.idle() : () => Promise.resolve(),
  };
}
