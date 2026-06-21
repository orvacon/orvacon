const isnt = [
  {
    bold: "Not an Iyzico wrapper.",
    rest: "A stateful orchestrator across gateways, not a thin SDK around one.",
  },
  { bold: "Not an e-commerce platform.", rest: "No catalog, cart, or inventory." },
  { bold: "Not a wallet or marketplace.", rest: "It never custodies funds." },
];

export function Definition() {
  return (
    <section className="border-t border-dashed border-[var(--guide)] px-[clamp(24px,3.4vw,46px)] py-[88px]">
      <div className="mb-[42px] grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] items-start gap-x-14 gap-y-[30px]">
        <div className="min-w-0">
          <div className="orv-eyebrow">In short</div>
          <h2 className="mt-4 max-w-[16ch] text-[clamp(28px,3.6vw,44px)] font-semibold leading-[1.08] tracking-[-0.03em]">
            What orvacon is — and isn't.
          </h2>
        </div>
        <div className="flex h-full min-w-0 items-end">
          <p className="m-0 max-w-[50ch] text-[16.5px] leading-[1.62] text-fg-dim">
            One line you can hold onto, and three things it deliberately is not.
          </p>
        </div>
      </div>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(330px,1fr))] gap-[18px]">
        <div className="relative overflow-hidden rounded-2xl border border-[var(--accent-line)] bg-[var(--accent-soft)] p-8">
          <div
            aria-hidden="true"
            className="absolute inset-0 opacity-50 [background-image:radial-gradient(circle,color-mix(in_srgb,var(--accent)_22%,transparent)_1px,transparent_1.2px)] [background-size:11px_11px]"
          />
          <div className="relative z-[2]">
            <div className="font-mono text-[11.5px] uppercase tracking-[0.14em] text-accent">
              What it is
            </div>
            <p className="mt-4 text-[20px] font-medium leading-[1.42] tracking-[-0.02em] text-fg">
              A stateful payment orchestrator that runs in your own runtime — coordinating gateways
              behind one type-safe API, and never touching the money.
            </p>
          </div>
        </div>
        <div className="rounded-2xl border border-line bg-bg-2 p-8">
          <div className="font-mono text-[11.5px] uppercase tracking-[0.14em] text-fg-faint">
            What it isn't
          </div>
          <div className="mt-[18px] flex flex-col gap-3.5">
            {isnt.map((item) => (
              <div key={item.bold} className="flex items-start gap-3">
                <svg
                  width="17"
                  height="17"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--text-faint)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  className="mt-0.5 shrink-0"
                  aria-hidden="true"
                >
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
                <div className="text-[14.5px] leading-[1.55] text-fg-dim">
                  <span className="font-medium text-fg">{item.bold}</span> {item.rest}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
