import { describe, expect, test } from "bun:test";
import { generatePaymentId, money } from "@orvacon/paykit";
import type { ConnectorContext } from "@orvacon/paykit/connector";
import { retrievePayment } from "../src/retrieve";
import type { IyzicoTransport, TransportResult } from "../src/transport";

const ctx = {} as ConnectorContext;
const input = { paymentId: generatePaymentId(), gatewayReference: "iyz_1" };

const transportReturning =
  (result: TransportResult): IyzicoTransport =>
  async () =>
    result;

describe("retrievePayment", () => {
  test("paymentStatus SUCCESS → resolved capture with the paid amount", async () => {
    const out = await retrievePayment(
      transportReturning({
        ok: true,
        body: {
          status: "success",
          paymentStatus: "SUCCESS",
          paymentId: "iyz_1",
          paidPrice: 10,
          currency: "TRY",
        },
      }),
      ctx,
      input,
    );
    expect(out.ok && out.resolved).toBe(true);
    if (out.ok && out.resolved && out.event.type === "payment.captured") {
      expect(out.event.amount).toEqual(money(1000, "TRY"));
      expect(out.event.gatewayReference).toBe("iyz_1");
    } else {
      throw new Error("expected a resolved capture");
    }
  });

  test("paymentStatus INIT_THREEDS → resolved:false (pending, leave untouched)", async () => {
    const out = await retrievePayment(
      transportReturning({
        ok: true,
        body: { status: "success", paymentStatus: "INIT_THREEDS", itemTransactions: [] },
      }),
      ctx,
      input,
    );
    expect(out).toEqual({ ok: true, resolved: false });
  });

  test("paymentStatus FAILURE → resolved failure event", async () => {
    const out = await retrievePayment(
      transportReturning({ ok: true, body: { status: "success", paymentStatus: "FAILURE" } }),
      ctx,
      input,
    );
    expect(out.ok && out.resolved && out.event.type).toBe("payment.failed");
  });

  test("an unrecognized status falls through to resolved:false (never invents a settlement)", async () => {
    const out = await retrievePayment(
      transportReturning({
        ok: true,
        body: { status: "success", paymentStatus: "CALLBACK_THREEDS" },
      }),
      ctx,
      input,
    );
    expect(out).toEqual({ ok: true, resolved: false });
  });

  test("a transport/gateway error surfaces as ok:false", async () => {
    const out = await retrievePayment(
      transportReturning({ ok: false, error: { code: "gateway_error", message: "boom" } }),
      ctx,
      input,
    );
    expect(out.ok).toBe(false);
  });
});
