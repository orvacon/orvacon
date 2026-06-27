import { PaymentStatus, type PaymentStatusValue } from "@/registry/ui/payment-status";

const STATUSES: PaymentStatusValue[] = [
  "created",
  "authorized",
  "captured",
  "refunded",
  "requires_action",
  "failed",
  "voided",
];

export default function PaymentStatusDemo() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      {STATUSES.map((status) => (
        <PaymentStatus key={status} status={status} />
      ))}
    </div>
  );
}
