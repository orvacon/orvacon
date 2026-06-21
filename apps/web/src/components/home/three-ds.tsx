import { Check } from "./decor";

const steps: {
  n: string;
  title: string;
  desc: string;
  active?: boolean;
  badge?: string;
  green?: boolean;
}[] = [
  { n: "01", title: "authorize()", desc: "Card details submitted to the gateway." },
  {
    n: "02",
    title: "requires_action",
    desc: "State saved; the browser is redirected to the 3DS challenge.",
    active: true,
    badge: "persisted",
  },
  {
    n: "03",
    title: "finalize",
    desc: "Signed finalize response verified — the callback POST is never trusted.",
  },
  {
    n: "04",
    title: "webhook",
    desc: "Signed event emitted; captured state committed to the ledger.",
    badge: "Ed25519",
    green: true,
  },
];

const rows = [
  { name: "authorize", code: "201", codeClass: "text-[#74a7f5]", note: "card → gateway" },
  { name: "requires_action", code: "3DS", codeClass: "text-[#b69bf0]", note: "state persisted" },
  { name: "finalize", code: "sig", codeClass: "text-[#9fce7e]", note: "signature verified" },
  { name: "capture", code: "200", codeClass: "text-[#74a7f5]", note: "funds → merchant" },
  { name: "refund", code: "200", codeClass: "text-[#74a7f5]", note: "reversed" },
  { name: "reconcile", code: "ok", codeClass: "text-[#6fd3c3]", note: "ledger hash-chained" },
];

export function ThreeDS() {
  return (
    <section id="3ds" className="border-t border-dashed border-[var(--guide)] px-[30px] py-[88px]">
      <div className="mb-[42px] grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] items-start gap-x-14 gap-y-[30px]">
        <div className="min-w-0">
          <div className="orv-eyebrow">04 — 3-D Secure</div>
          <h2 className="mt-4 max-w-[15ch] text-[clamp(28px,3.6vw,44px)] font-semibold leading-[1.08] tracking-[-0.03em]">
            Stateful 3-D Secure, orchestrated.
          </h2>
        </div>
        <div className="flex h-full min-w-0 items-end">
          <p className="m-0 max-w-[52ch] text-[16.5px] leading-[1.62] text-fg-dim">
            3DS is two requests plus a browser wait. orvacon persists the in-between as{" "}
            <span className="font-mono text-[13px] text-fg">requires_action</span>, and trusts the
            signed <span className="font-mono text-[13px] text-fg">finalize</span> response — never
            the raw callback POST.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(330px,1fr))] items-start gap-[22px]">
        <div className="flex flex-col gap-2.5">
          {steps.map((step) => (
            <div
              key={step.n}
              className={`flex items-start gap-3.5 rounded-[11px] px-[18px] py-4 ${
                step.active
                  ? "border-[1.5px] border-accent bg-[var(--accent-soft)]"
                  : "border border-line bg-bg-2"
              }`}
            >
              <span
                className={`mt-0.5 font-mono text-[11px] ${step.active ? "text-accent" : "text-fg-faint"}`}
              >
                {step.n}
              </span>
              <div className="flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`font-mono text-[13.5px] ${step.active ? "text-accent" : "text-fg"}`}
                  >
                    {step.title}
                  </span>
                  {step.badge ? (
                    <span
                      className={
                        step.green
                          ? "rounded bg-[rgba(63,185,126,0.12)] px-1.5 py-px font-mono text-[10px] text-[#3fb97e]"
                          : "rounded border border-[var(--accent-line)] px-1.5 py-px font-mono text-[10px] text-accent"
                      }
                    >
                      {step.badge}
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 text-[13px] leading-[1.5] text-fg-dim">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="relative">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute blur-[10px] [background:radial-gradient(50%_50%_at_60%_30%,color-mix(in_srgb,var(--accent)_16%,transparent),transparent_70%)] [inset:-10%_-6%]"
          />
          <div className="relative z-[2] overflow-hidden rounded-[13px] border border-[#26262a] bg-[#161618] shadow-[0_30px_70px_-45px_rgba(0,0,0,0.8)]">
            <div className="flex items-center justify-between border-b border-[#232327] bg-[#0f0f11] px-[15px] py-3">
              <span className="font-mono text-[12px] text-[#8c8c86]">
                verification · iyzico sandbox
              </span>
              <span className="rounded-[5px] bg-[#3fb97e] px-2 py-0.5 font-mono text-[10.5px] font-semibold text-[#0e0e0f]">
                PASS
              </span>
            </div>
            <div className="px-1.5 py-2">
              {rows.map((row, i) => (
                <div
                  key={row.name}
                  className={`flex items-center gap-3 px-3 py-2.5 font-mono text-[12.5px] ${
                    i > 0 ? "border-t border-[#1e1e22]" : ""
                  }`}
                >
                  <Check className="shrink-0 text-[#3fb97e]" />
                  <span className="w-[118px] text-[#c9c7bf]">{row.name}</span>
                  <span className={`w-10 ${row.codeClass}`}>{row.code}</span>
                  <span className="text-[#6a6a72]">{row.note}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
