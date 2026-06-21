import { Fragment } from "react";
import { ArrowRight, Flow } from "@/components/icons";
import { DotField, SectionHeader } from "@/components/section";

const steps = [
  { n: "01", name: "created", note: "order recorded" },
  { n: "02", name: "authorized", note: <Flow steps={["card", "gateway"]} /> },
  { n: "03", name: "requires_action", note: "3DS · persisted", active: true },
  { n: "04", name: "captured", note: "finalize verified" },
  { n: "05", name: "reconciled", note: "ledger committed" },
];

export function Lifecycle() {
  return (
    <section className="border-t border-dashed border-[var(--guide)] px-[clamp(24px,3.4vw,46px)] py-[84px]">
      <SectionHeader
        eyebrow="02 — Request lifecycle"
        title="One payment, persisted at every step."
        lead="Each transition writes to the database before the next call. A crash or retry resumes from the last persisted state — never from a guess."
      />
      <div className="relative overflow-hidden rounded-2xl border border-line bg-bg-2 p-[22px]">
        <DotField />
        <div className="relative z-[2] overflow-x-auto">
          <div className="flex min-w-[760px] items-stretch gap-2.5">
            {steps.map((step, i) => (
              <Fragment key={step.name}>
                {i > 0 ? (
                  <div className="flex items-center text-accent">
                    <ArrowRight className="h-4 w-4" />
                  </div>
                ) : null}
                <div
                  className={`flex-1 rounded-[11px] px-3.5 py-[15px] ${
                    step.active
                      ? "border-[1.5px] border-accent bg-[var(--accent-soft)]"
                      : "border border-line-2 bg-bg"
                  }`}
                >
                  <div
                    className={`font-mono text-[11px] ${step.active ? "text-accent" : "text-fg-faint"}`}
                  >
                    {step.n}
                  </div>
                  <div
                    className={`mt-2 font-mono text-[13px] ${step.active ? "text-accent" : "text-fg"}`}
                  >
                    {step.name}
                  </div>
                  <div className="mt-1.5 text-[11.5px] text-fg-dim">{step.note}</div>
                </div>
              </Fragment>
            ))}
          </div>
          <div className="mt-4 flex min-w-[760px] items-center gap-2 font-mono text-[11px] text-fg-faint">
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--accent)"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <ellipse cx="12" cy="5" rx="8" ry="3" />
              <path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5" />
            </svg>
            every transition is written to your database before the next call
          </div>
        </div>
      </div>
    </section>
  );
}
