import { PaymentStatus, type PaymentStatusValue } from "@/registry/ui/payment-status";

const ORDERS: { id: string; customer: string; amount: string; status: PaymentStatusValue }[] = [
  { id: "#10293", customer: "Alex Rivera", amount: "₺1,299.00", status: "captured" },
  { id: "#10292", customer: "Jordan Lee", amount: "₺349.50", status: "requires_action" },
  { id: "#10291", customer: "Priya Patel", amount: "₺2,150.00", status: "authorized" },
  { id: "#10290", customer: "Sam Carter", amount: "₺89.90", status: "refunded" },
  { id: "#10289", customer: "Mei Chen", amount: "₺499.00", status: "failed" },
];

/** A realistic orders panel that shows the PaymentStatus component in context. */
export function HomeDemo() {
  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
      <div className="flex items-center gap-1.5 border-b bg-muted/40 px-4 py-3">
        <span className="size-3 rounded-full bg-red-400/70" />
        <span className="size-3 rounded-full bg-amber-400/70" />
        <span className="size-3 rounded-full bg-emerald-400/70" />
        <span className="ml-3 font-mono text-xs text-muted-foreground">app/orders/page.tsx</span>
      </div>
      <div className="p-4 sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold">Recent payments</h3>
          <span className="text-xs text-muted-foreground">{ORDERS.length} orders</span>
        </div>
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-2 font-medium">Order</th>
                <th className="px-4 py-2 font-medium">Customer</th>
                <th className="px-4 py-2 text-right font-medium">Amount</th>
                <th className="px-4 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {ORDERS.map((order) => (
                <tr key={order.id} className="border-t">
                  <td className="px-4 py-2.5 font-mono text-xs">{order.id}</td>
                  <td className="px-4 py-2.5">{order.customer}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{order.amount}</td>
                  <td className="px-4 py-2.5">
                    <PaymentStatus status={order.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
