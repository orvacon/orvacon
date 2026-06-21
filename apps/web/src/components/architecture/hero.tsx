export function ArchitectureHero() {
  return (
    <section className="relative px-[30px] pb-16 pt-[84px] text-center">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-[-40px] h-[340px] w-[90%] -translate-x-1/2 blur-[10px] [animation:orv-glow_6s_ease-in-out_infinite] [background:radial-gradient(50%_60%_at_50%_30%,color-mix(in_srgb,var(--accent)_22%,transparent),transparent_68%)]"
      />
      <div className="relative z-[2]">
        <div className="inline-flex items-center gap-[9px] rounded-full border border-[var(--accent-line)] px-[13px] py-[5px] font-mono text-[11.5px] uppercase tracking-[0.16em] text-accent">
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
          </svg>
          Architecture
        </div>
        <h1 className="mx-auto mt-[22px] max-w-[17ch] text-[clamp(36px,5vw,60px)] font-semibold leading-[1.03] tracking-[-0.038em]">
          <span className="text-fg">A thin orchestrator </span>
          <span className="text-fg-faint">over a strict core.</span>
        </h1>
        <p className="mx-auto mt-[22px] max-w-[60ch] text-[18px] leading-[1.58] text-fg-dim">
          orvacon is a state machine wrapped around connectors. The core owns money typing,
          persistence, idempotency and signing; connectors only translate to a gateway. Here's how a
          payment moves through it.
        </p>
      </div>
    </section>
  );
}
