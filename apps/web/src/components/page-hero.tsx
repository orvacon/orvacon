import type { ReactNode } from "react";

export function PageHero({
  badge,
  icon,
  titleLead,
  titleRest,
  lead,
  footer,
}: {
  badge: string;
  icon: ReactNode;
  titleLead: string;
  titleRest: string;
  lead: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <section className="relative px-[clamp(24px,3.4vw,46px)] pb-16 pt-[84px] text-center">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-[-40px] h-[340px] w-[90%] -translate-x-1/2 blur-[10px] [animation:orv-glow_6s_ease-in-out_infinite] [background:radial-gradient(50%_60%_at_50%_30%,color-mix(in_srgb,var(--accent)_22%,transparent),transparent_68%)]"
      />
      <div className="relative z-[2]">
        <div className="inline-flex items-center gap-[9px] rounded-full border border-[var(--accent-line)] px-[13px] py-[5px] font-mono text-[11.5px] uppercase tracking-[0.16em] text-accent">
          {icon}
          {badge}
        </div>
        <h1 className="mx-auto mt-[22px] max-w-[17ch] text-[clamp(36px,5vw,60px)] font-semibold leading-[1.03] tracking-[-0.038em]">
          <span className="text-fg">{`${titleLead} `}</span>
          <span className="text-fg-faint">{titleRest}</span>
        </h1>
        <p className="mx-auto mt-[22px] max-w-[60ch] text-[18px] leading-[1.58] text-fg-dim">
          {lead}
        </p>
        {footer ? <div className="mt-[26px]">{footer}</div> : null}
      </div>
    </section>
  );
}
