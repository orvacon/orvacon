const entries: { tag: string; title: string; desc: string; first?: boolean }[] = [
  {
    tag: "v0.1.0 · first release",
    title: "Iyzico 3-D Secure, verified",
    desc: "authorize → 3DS → capture → refund → reconcile, end-to-end against the gateway sandbox.",
    first: true,
  },
  {
    tag: "cryptokit",
    title: "Ed25519-signed webhooks",
    desc: "Asymmetric signatures so a leaked verification key can't forge events. Timing-safe checks throughout.",
  },
  {
    tag: "adapter-supabase",
    title: "Schema with default-deny RLS",
    desc: "Generates a Postgres schema with row-level security locked down out of the box.",
  },
  {
    tag: "paykit core",
    title: "Hash-chained ledger",
    desc: "Append-only and tamper-evident by construction; idempotency enforced by a unique constraint.",
  },
];

export function Changelog() {
  return (
    <section
      id="changelog"
      className="border-t border-dashed border-[var(--guide)] px-[30px] py-[88px]"
    >
      <div className="mb-11 flex flex-wrap items-end justify-between gap-6">
        <div>
          <div className="orv-eyebrow">07 — Changelog</div>
          <h2 className="mt-4 max-w-[16ch] text-[clamp(28px,3.6vw,44px)] font-semibold leading-[1.08] tracking-[-0.03em]">
            Shipped in the open.
          </h2>
        </div>
        <a
          href="https://github.com/orvacon/orvacon/releases"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-[7px] pb-1.5 font-mono text-[12.5px] text-fg-dim transition-colors hover:text-fg"
        >
          View all releases →
        </a>
      </div>

      <div className="relative">
        <div aria-hidden="true" className="absolute left-0 right-0 top-[5px] h-px bg-line" />
        <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-px bg-[var(--guide)]">
          {entries.map((entry) => (
            <div key={entry.title} className="relative bg-bg px-[22px] pb-1 pt-[26px]">
              <span
                aria-hidden="true"
                className={`absolute left-[22px] top-0 h-[11px] w-[11px] rounded-full ${
                  entry.first
                    ? "bg-accent shadow-[0_0_0_4px_var(--bg),0_0_0_5px_var(--accent-line)]"
                    : "border-[1.5px] border-line-2 bg-bg-3 shadow-[0_0_0_4px_var(--bg)]"
                }`}
              />
              <div className="mt-2 font-mono text-[11px] text-fg-faint">{entry.tag}</div>
              <h3 className="mt-3 text-[15.5px] font-semibold tracking-[-0.01em]">{entry.title}</h3>
              <p className="mt-2 text-[13.5px] leading-[1.55] text-fg-dim">{entry.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
