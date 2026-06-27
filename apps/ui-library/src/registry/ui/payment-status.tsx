import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

const paymentStatusVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
  {
    variants: {
      status: {
        created: "border-transparent bg-muted text-muted-foreground",
        authorized:
          "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-300",
        captured:
          "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300",
        refunded:
          "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900 dark:bg-violet-950 dark:text-violet-300",
        requires_action:
          "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300",
        failed: "border-transparent bg-destructive/10 text-destructive",
        voided: "border-transparent bg-muted text-muted-foreground",
      },
    },
    defaultVariants: { status: "created" },
  },
);

const STATUS_LABELS = {
  created: "Created",
  authorized: "Authorized",
  captured: "Captured",
  refunded: "Refunded",
  requires_action: "Requires action",
  failed: "Failed",
  voided: "Voided",
} as const;

export type PaymentStatusValue = keyof typeof STATUS_LABELS;

export interface PaymentStatusProps
  extends ComponentProps<"span">,
    VariantProps<typeof paymentStatusVariants> {}

/**
 * A badge for an orvacon payment's lifecycle state. Pass `status` and the label is
 * derived from it; override the text with `children`. Color is decorative — the
 * text label carries the meaning, so the badge stays legible without relying on it.
 */
export function PaymentStatus({ className, status, children, ...props }: PaymentStatusProps) {
  const value = status ?? "created";
  return (
    <span
      data-slot="payment-status"
      data-status={value}
      className={cn(paymentStatusVariants({ status: value }), className)}
      {...props}
    >
      <span aria-hidden className="size-1.5 rounded-full bg-current opacity-70" />
      {children ?? STATUS_LABELS[value]}
    </span>
  );
}

export { paymentStatusVariants };
