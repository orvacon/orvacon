"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { AnimatePresence, motion } from "motion/react";
import { useRef, useState } from "react";
import { Check } from "./decor";

const steps = [
  { n: "01", title: "authorize()", desc: "Card details submitted to the gateway." },
  {
    n: "02",
    title: "requires_action",
    desc: "State saved; the browser is redirected to the 3DS challenge.",
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
  },
];

const panels = [
  {
    title: "authorize",
    badge: "201",
    badgeClass: "bg-[rgba(116,167,245,0.12)] text-[#74a7f5]",
    lines: ["card details → gateway", "3-D Secure requested"],
  },
  {
    title: "persisted",
    badge: "requires_action",
    badgeClass: "bg-[var(--accent-soft)] text-accent",
    lines: ["state saved to your database", "browser → bank 3DS challenge"],
  },
  {
    title: "verified",
    badge: "finalize",
    badgeClass: "bg-[rgba(159,206,126,0.12)] text-[#9fce7e]",
    lines: ["signed finalize response checked", "the raw callback POST is never trusted"],
  },
  {
    title: "captured",
    badge: "Ed25519",
    badgeClass: "bg-[rgba(63,185,126,0.12)] text-[#3fb97e]",
    lines: ["payment.captured emitted", "committed to the hash-chained ledger"],
  },
];

export function ThreeDSFlow() {
  const [active, setActive] = useState(0);
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const tl = gsap.timeline({ repeat: -1 });
      steps.forEach((_, index) => {
        tl.call(() => setActive(index), undefined, index * 2.6);
      });
      tl.to({}, { duration: 2.6 });
    },
    { scope: root },
  );

  const activeStep = steps[active];
  const activePanel = panels[active];

  return (
    <div
      ref={root}
      className="grid grid-cols-[repeat(auto-fit,minmax(330px,1fr))] items-stretch gap-[22px]"
    >
      <div className="flex flex-col gap-2.5">
        {steps.map((step, index) => {
          const on = index === active;
          return (
            <button
              key={step.n}
              type="button"
              onClick={() => setActive(index)}
              className={`flex items-start gap-3.5 rounded-[11px] px-[18px] py-4 text-left transition-colors duration-300 ${
                on
                  ? "border-[1.5px] border-accent bg-[var(--accent-soft)]"
                  : "border border-line bg-bg-2 hover:border-line-2"
              }`}
            >
              <span
                className={`mt-0.5 font-mono text-[11px] transition-colors ${on ? "text-accent" : "text-fg-faint"}`}
              >
                {step.n}
              </span>
              <div className="flex-1">
                <span
                  className={`font-mono text-[13.5px] transition-colors ${on ? "text-accent" : "text-fg"}`}
                >
                  {step.title}
                </span>
                <p className="mt-1 text-[13px] leading-[1.5] text-fg-dim">{step.desc}</p>
              </div>
            </button>
          );
        })}
      </div>

      <div className="relative h-full">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute blur-[10px] [background:radial-gradient(50%_50%_at_60%_30%,color-mix(in_srgb,var(--accent)_16%,transparent),transparent_70%)] [inset:-10%_-6%]"
        />
        <div className="relative z-[2] flex h-full flex-col overflow-hidden rounded-[13px] border border-[#26262a] bg-[#161618] shadow-[0_30px_70px_-45px_rgba(0,0,0,0.8)]">
          <div className="flex items-center justify-between border-b border-[#232327] bg-[#0f0f11] px-[15px] py-3">
            <span className="font-mono text-[12px] text-[#8c8c86]">
              verification · iyzico sandbox
            </span>
            <span className="rounded-[5px] bg-[#3fb97e] px-2 py-0.5 font-mono text-[10.5px] font-semibold text-[#0e0e0f]">
              PASS
            </span>
          </div>
          <div className="relative flex flex-1 flex-col justify-center p-5">
            <AnimatePresence mode="wait">
              <motion.div
                key={active}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.28 }}
              >
                {activeStep && activePanel ? (
                  <>
                    <div className="flex items-center gap-2 font-mono text-[12.5px] text-fg-faint">
                      <span className="text-accent">{activeStep.n}</span>
                      <span>{activeStep.title}</span>
                    </div>
                    <div className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <span className="font-mono text-[clamp(34px,4.5vw,46px)] font-semibold text-[#f4f3f1]">
                        {activePanel.title}
                      </span>
                      <span
                        className={`rounded px-2.5 py-1 font-mono text-[12.5px] ${activePanel.badgeClass}`}
                      >
                        {activePanel.badge}
                      </span>
                    </div>
                    <div className="mt-6 flex flex-col gap-3.5">
                      {activePanel.lines.map((line) => (
                        <div
                          key={line}
                          className="flex items-center gap-3 font-mono text-[15.5px] text-[#c9c7bf]"
                        >
                          <Check className="shrink-0 text-[#3fb97e]" />
                          {line}
                        </div>
                      ))}
                    </div>
                  </>
                ) : null}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
