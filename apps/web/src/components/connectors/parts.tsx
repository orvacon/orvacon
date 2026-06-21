import type { ReactNode } from "react";

export type Status = "verified" | "shipped" | "roadmap" | "required";

export type ConnectorItem = {
  id: string;
  name: string;
  status: Status;
  icon: ReactNode;
  desc: ReactNode;
  footer: ReactNode;
  featured?: boolean;
};

export function Icon({ children }: { children: ReactNode }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export function StatusBadge({ status }: { status: Status }) {
  if (status === "verified" || status === "shipped") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(63,185,126,0.3)] bg-[rgba(63,185,126,0.12)] px-2.5 py-[3px] font-mono text-[11px] text-[#3fb97e]">
        {status === "verified" ? (
          <span className="h-[5px] w-[5px] rounded-full bg-[#3fb97e]" />
        ) : null}
        {status}
      </span>
    );
  }
  return (
    <span
      className={`inline-flex items-center rounded-full border border-line-2 px-2.5 py-[3px] font-mono text-[11px] ${
        status === "required" ? "text-fg-dim" : "text-fg-faint"
      }`}
    >
      {status}
    </span>
  );
}

export function ConnectorCard({ item }: { item: ConnectorItem }) {
  return (
    <div
      className={`flex flex-col rounded-2xl border bg-bg-2 p-6 ${
        item.featured ? "border-[var(--accent-line)]" : "border-line"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex h-[42px] w-[42px] items-center justify-center rounded-[9px] border border-line bg-bg-3 text-fg-dim">
          {item.icon}
        </div>
        <StatusBadge status={item.status} />
      </div>
      <h3 className="mt-[18px] text-[17px] font-semibold tracking-[-0.01em]">{item.name}</h3>
      <p className="mt-2 flex-1 text-[14px] leading-[1.58] text-fg-dim">{item.desc}</p>
      <div className="mt-4 border-t border-line pt-3.5">{item.footer}</div>
    </div>
  );
}

export function CardGrid({ children }: { children: ReactNode }) {
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-[18px]">{children}</div>
  );
}

export function SectionBar({ index, right }: { index: string; right: string }) {
  return (
    <div className="mb-7 flex flex-wrap items-baseline justify-between gap-4">
      <div className="orv-eyebrow">{index}</div>
      <div className="font-mono text-[12px] text-fg-faint">{right}</div>
    </div>
  );
}

export function Pkg({ name, accent }: { name: string; accent?: boolean }) {
  return (
    <span className={`font-mono text-[12px] ${accent ? "text-accent" : "text-fg-faint"}`}>
      {name}
    </span>
  );
}
