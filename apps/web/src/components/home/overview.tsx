import { Corner } from "./decor";

const items = [
  { n: "1.1", label: "Connector boundary" },
  { n: "1.2", label: "Runs in your runtime" },
  { n: "1.3", label: "Type-safe by default" },
  { n: "1.4", label: "Verified, honestly" },
];

const providers = [
  { name: "Iyzico", verified: true },
  { name: "PayTR", verified: false },
  { name: "Bank POS", verified: false },
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

      <div className="relative mt-[52px]">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-[10%] h-[80%] w-[70%] -translate-x-1/2 blur-[10px] [background:radial-gradient(50%_60%_at_50%_40%,color-mix(in_srgb,var(--accent)_20%,transparent),transparent_70%)]"
        />
        <div className="relative z-[2] mx-auto max-w-[480px] overflow-hidden rounded-2xl border border-line bg-bg-2 px-[26px] py-[30px]">
          <Corner className="left-[-1px] top-[-1px] border-l-[1.5px] border-t-[1.5px]" />
          <Corner className="right-[-1px] top-[-1px] border-r-[1.5px] border-t-[1.5px]" />
          <Corner className="bottom-[-1px] left-[-1px] border-b-[1.5px] border-l-[1.5px]" />
          <Corner className="bottom-[-1px] right-[-1px] border-b-[1.5px] border-r-[1.5px]" />
          <div className="flex flex-col items-center">
            <div className="rounded-lg border border-line-2 bg-bg-3 px-4 py-[9px] font-mono text-[13px] text-fg">
              Your application
            </div>
            <div className="h-[18px] w-px bg-line-2" />
            <div className="rounded-lg border border-[var(--accent-line)] bg-[var(--accent-soft)] px-3.5 py-2 font-mono text-[12.5px] text-accent">
              orva.authorize(…)
            </div>
            <div className="h-[18px] w-px bg-line-2" />
            <div className="rounded-[9px] border-[1.5px] border-accent bg-bg px-4 py-2.5 text-[13.5px] font-medium text-fg">
              orchestrator
            </div>
            <div className="h-4 w-px bg-line-2" />
            <div className="grid w-full grid-cols-3 gap-2.5">
              {providers.map((p) => (
                <div
                  key={p.name}
                  className={`flex flex-col items-center gap-[7px] rounded-[9px] border bg-bg px-1.5 py-3 text-center ${
                    p.verified ? "border-line" : "border-dashed border-line-2"
                  }`}
                >
                  <span
                    className={`font-mono text-[12px] ${p.verified ? "text-fg" : "text-fg-dim"}`}
                  >
                    {p.name}
                  </span>
                  {p.verified ? (
                    <span className="rounded bg-[rgba(63,185,126,0.12)] px-1.5 py-px font-mono text-[10px] text-[#3fb97e]">
                      verified
                    </span>
                  ) : (
                    <span className="rounded border border-line px-1.5 py-px font-mono text-[10px] text-fg-faint">
                      roadmap
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
