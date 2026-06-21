import { OverviewFlow } from "./overview-flow";

const items = [
  { n: "1.1", label: "Connector boundary" },
  { n: "1.2", label: "Runs in your runtime" },
  { n: "1.3", label: "Type-safe by default" },
  { n: "1.4", label: "Verified, honestly" },
];

export function Overview() {
  return (
    <section id="idea" className="border-t border-dashed border-[var(--guide)] px-[30px] py-[88px]">
      <div className="grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] items-start gap-x-14 gap-y-[30px]">
        <div className="min-w-0">
          <div className="orv-eyebrow">01 — Overview</div>
          <h2 className="mt-4 max-w-[16ch] text-[clamp(28px,3.6vw,44px)] font-semibold leading-[1.08] tracking-[-0.03em]">
            Your code shouldn't know the gateway.
          </h2>
        </div>
        <div className="min-w-0">
          <p className="m-0 max-w-[52ch] text-[16.5px] leading-[1.62] text-fg-dim">
            You've written gateway-specific glue before — branching on provider, mapping error
            codes, re-implementing 3-D Secure for each one. orvacon moves that surface area behind a
            connector boundary: one type-safe API in your app, gateway differences isolated to
            configuration.
          </p>
          <div className="mt-6 grid grid-cols-2 gap-px border border-[var(--guide)] bg-[var(--guide)]">
            {items.map((item) => (
              <div key={item.n} className="flex items-baseline gap-2.5 bg-bg px-3.5 py-[13px]">
                <span className="font-mono text-[11px] text-accent">{item.n}</span>
                <span className="text-[13.5px] text-fg-dim">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="relative mt-[52px] overflow-hidden rounded-2xl border border-line bg-bg-2">
        <OverviewFlow />
      </div>
    </section>
  );
}
