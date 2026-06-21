import { VerifyTranscript } from "./verify-transcript";

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

        <VerifyTranscript />
      </div>
    </section>
  );
}
