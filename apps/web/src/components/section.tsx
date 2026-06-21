import type { ReactNode } from "react";

export function SectionHeader({
  eyebrow,
  title,
  lead,
}: {
  eyebrow: string;
  title: ReactNode;
  lead: ReactNode;
}) {
  return (
    <div className="mb-10 grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] items-start gap-x-14 gap-y-[30px]">
      <div className="min-w-0">
        <div className="orv-eyebrow">{eyebrow}</div>
        <h2 className="mt-4 max-w-[16ch] text-[clamp(26px,3.4vw,42px)] font-semibold leading-[1.08] tracking-[-0.03em]">
          {title}
        </h2>
      </div>
      <div className="flex h-full min-w-0 items-end">
        <p className="m-0 max-w-[52ch] text-[16.5px] leading-[1.62] text-fg-dim">{lead}</p>
      </div>
    </div>
  );
}

export function DotField() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 opacity-70 [background-image:radial-gradient(circle,var(--guide)_1px,transparent_1.2px)] [background-size:22px_22px]"
    />
  );
}
