import type { ReactNode } from "react";
import { DotField } from "@/components/section";

export function Sym({
  size = 18,
  className,
  children,
}: {
  size?: number;
  className?: string;
  children: ReactNode;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {children}
    </svg>
  );
}

export function DiagramFrame({
  label,
  width,
  height,
  children,
}: {
  label: string;
  width: number;
  height: number;
  children: ReactNode;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-line bg-bg-2 p-[22px]">
      <DotField />
      <div className="absolute left-4 top-3.5 z-[3] font-mono text-[10.5px] uppercase tracking-[0.14em] text-fg-faint">
        {label}
      </div>
      <div className="relative z-[2] overflow-x-auto pt-3.5">
        <div className="relative mx-auto" style={{ width, height }}>
          {children}
        </div>
      </div>
    </div>
  );
}

export function CornerMarks() {
  return (
    <>
      <span className="absolute -left-[3px] -top-[3px] h-1.5 w-1.5 bg-accent" />
      <span className="absolute -right-[3px] -top-[3px] h-1.5 w-1.5 bg-accent" />
      <span className="absolute -bottom-[3px] -left-[3px] h-1.5 w-1.5 bg-accent" />
      <span className="absolute -bottom-[3px] -right-[3px] h-1.5 w-1.5 bg-accent" />
    </>
  );
}

const NODE_VARIANT = {
  plain: "border border-line-2 bg-bg-3 text-fg",
  accent: "border-[1.5px] border-accent bg-[var(--accent-soft)] text-accent",
  green: "border border-[rgba(63,185,126,0.45)] bg-[rgba(63,185,126,0.08)] text-[#5fce9b]",
  danger: "border border-[rgba(216,103,78,0.45)] bg-[rgba(216,103,78,0.08)] text-[#e08a72]",
} as const;

export function Node({
  x,
  y,
  w,
  variant = "plain",
  corners,
  children,
}: {
  x: number;
  y: number;
  w: number;
  variant?: keyof typeof NODE_VARIANT;
  corners?: boolean;
  children: ReactNode;
}) {
  return (
    <div
      style={{ left: x, top: y, width: w }}
      className={`absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1.5 rounded-[11px] px-4 py-3.5 text-center ${NODE_VARIANT[variant]}`}
    >
      {corners ? <CornerMarks /> : null}
      {children}
    </div>
  );
}

const LABEL_TONE = {
  accent: "text-accent border-[var(--accent-line)]",
  green: "text-[#3fb97e] border-[rgba(63,185,126,0.4)]",
  danger: "text-[#d8674e] border-[rgba(216,103,78,0.4)]",
} as const;

export function Label({
  x,
  y,
  tone = "accent",
  children,
}: {
  x: number;
  y: number;
  tone?: keyof typeof LABEL_TONE;
  children: ReactNode;
}) {
  return (
    <div
      style={{ left: x, top: y }}
      className={`absolute flex -translate-x-1/2 -translate-y-1/2 items-center gap-1.5 whitespace-nowrap rounded-md border bg-bg-2 px-2.5 py-[3px] font-mono text-[11px] ${LABEL_TONE[tone]}`}
    >
      {children}
    </div>
  );
}

export function WhyCallout({ children }: { children: ReactNode }) {
  return (
    <div className="mt-[18px] flex items-start gap-3 rounded-[11px] border border-[var(--accent-line)] bg-[var(--accent-soft)] px-[18px] py-3.5">
      <Sym size={17} className="mt-0.5 shrink-0 text-accent">
        <path d="M12 2l8 3v6c0 5-3.5 8.5-8 11-4.5-2.5-8-6-8-11V5l8-3z" />
        <path d="M9 12l2 2 4-4" />
      </Sym>
      <p className="m-0 text-[14px] leading-[1.6] text-fg-dim">{children}</p>
    </div>
  );
}
