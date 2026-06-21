"use client";

import { AnimatePresence, motion, type Variants } from "motion/react";
import { useState } from "react";
import { Check } from "./decor";

const tabs = [
  { n: "1.1", label: "Connector boundary" },
  { n: "1.2", label: "Runs in your runtime" },
  { n: "1.3", label: "Type-safe by default" },
  { n: "1.4", label: "Verified, honestly" },
];

function FlowArrow() {
  return (
    <div className="flex shrink-0 items-center justify-center text-fg-faint" aria-hidden="true">
      <span className="sm:hidden">↓</span>
      <span className="hidden sm:inline">→</span>
    </div>
  );
}

function Connector({ name, verified }: { name: string; verified?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-md border border-line bg-bg px-3 py-2 font-mono text-[12px] text-fg">
      <span className={verified ? "text-fg" : "text-fg-dim"}>{name}</span>
      {verified ? (
        <span className="rounded bg-[rgba(63,185,126,0.12)] px-1.5 py-px text-[10px] text-[#3fb97e]">
          verified
        </span>
      ) : (
        <span className="rounded border border-line px-1.5 py-px text-[10px] text-fg-faint">
          roadmap
        </span>
      )}
    </div>
  );
}

function BoundaryPanel() {
  return (
    <div>
      <p className="mb-5 text-[14.5px] leading-[1.6] text-fg-dim">
        One type-safe API in your app; gateway differences isolated to configuration. Swap or add a
        connector without touching application logic.
      </p>
      <div className="flex flex-col items-stretch gap-2.5 sm:flex-row sm:items-center sm:gap-3">
        <div className="flex-1 rounded-[10px] border border-line-2 bg-bg-3 px-4 py-3 text-center font-mono text-[13px] text-fg">
          Your application
        </div>
        <FlowArrow />
        <div className="flex-1 rounded-[10px] border-[1.5px] border-accent bg-bg px-4 py-3 text-center font-mono text-[13px] text-accent">
          orchestrator
        </div>
        <FlowArrow />
        <div className="flex flex-1 flex-col gap-2">
          <Connector name="Iyzico" verified />
          <Connector name="PayTR" />
          <Connector name="Bank POS" />
        </div>
      </div>
    </div>
  );
}

function RuntimePanel() {
  return (
    <div>
      <p className="mb-4 text-[14.5px] leading-[1.6] text-fg-dim">
        A library in your own runtime — not a hosted service. Your code calls the API directly, and
        money never routes through us.
      </p>
      <pre className="no-scrollbar overflow-x-auto rounded-[10px] border border-[#26262a] bg-[#161618] px-4 py-3.5 font-mono text-[12.5px] leading-[1.7] text-[#c9c7bf]">
        <code>
          <span className="text-[#b69bf0]">const</span> result ={" "}
          <span className="text-[#b69bf0]">await</span> orva.
          <span className="text-[#74a7f5]">authorize</span>(order);
        </code>
      </pre>
    </div>
  );
}

function TypesPanel() {
  return (
    <div>
      <p className="mb-4 text-[14.5px] leading-[1.6] text-fg-dim">
        Payment state and results are discriminated unions — an invalid transition won't type-check.
      </p>
      <pre className="no-scrollbar overflow-x-auto rounded-[10px] border border-[#26262a] bg-[#161618] px-4 py-3.5 font-mono text-[12px] leading-[1.7] text-[#c9c7bf]">
        <code>
          <span className="text-[#b69bf0]">type</span>{" "}
          <span className="text-[#6fd3c3]">PaymentState</span> ={"\n"}
          {"  | "}
          <span className="text-[#9fce7e]">"created"</span>
          {" | "}
          <span className="text-[#9fce7e]">"authorized"</span>
          {"\n"}
          {"  | "}
          <span className="text-[#9fce7e]">"captured"</span>
          {" | "}
          <span className="text-[#9fce7e]">"refunded"</span>
          {"\n"}
          {"  | "}
          <span className="text-[#9fce7e]">"requires_action"</span>
          {" | "}
          <span className="text-[#9fce7e]">"failed"</span>
          {" | "}
          <span className="text-[#9fce7e]">"voided"</span>
          {";"}
        </code>
      </pre>
    </div>
  );
}

const verifiedFlow = ["authorize", "3DS", "capture", "refund", "reconcile"];

function VerifiedPanel() {
  return (
    <div>
      <p className="mb-4 text-[14.5px] leading-[1.6] text-fg-dim">
        No "supports everything". The Iyzico raw-card 3-D Secure flow is verified end-to-end against
        the gateway sandbox.
      </p>
      <div className="flex flex-wrap items-center gap-2">
        {verifiedFlow.map((label, index) => (
          <span key={label} className="flex items-center gap-2">
            {index > 0 ? <span className="text-fg-faint">→</span> : null}
            <span className="rounded-md border border-line bg-bg px-2.5 py-1.5 font-mono text-[12px] text-fg-dim">
              {label}
            </span>
          </span>
        ))}
      </div>
      <div className="mt-4 inline-flex items-center gap-2 rounded-md bg-[rgba(63,185,126,0.12)] px-3 py-1.5 font-mono text-[12px] text-[#3fb97e]">
        <Check className="shrink-0" />
        Iyzico sandbox · PASS
      </div>
    </div>
  );
}

const panels = [BoundaryPanel, RuntimePanel, TypesPanel, VerifiedPanel];

const panelVariants: Variants = {
  enter: (dir: number) => ({ opacity: 0, y: dir >= 0 ? -22 : 22 }),
  center: { opacity: 1, y: 0 },
  exit: (dir: number) => ({ opacity: 0, y: dir >= 0 ? 22 : -22 }),
};

export function OverviewTabs() {
  const [active, setActive] = useState(0);
  const [direction, setDirection] = useState(0);
  const Panel = panels[active];

  const select = (index: number) => {
    setDirection(index > active ? 1 : -1);
    setActive(index);
  };

  return (
    <div className="grid grid-cols-1 items-stretch gap-[22px] lg:grid-cols-[300px_1fr]">
      <div className="flex flex-col gap-2.5">
        {tabs.map((tab, index) => {
          const on = index === active;
          return (
            <button
              key={tab.n}
              type="button"
              onClick={() => select(index)}
              className={`flex items-center gap-3 rounded-[11px] px-[18px] py-3.5 text-left transition-colors ${
                on
                  ? "border-[1.5px] border-accent bg-[var(--accent-soft)]"
                  : "border border-line bg-bg-2 hover:border-line-2"
              }`}
            >
              <span className={`font-mono text-[11px] ${on ? "text-accent" : "text-fg-faint"}`}>
                {tab.n}
              </span>
              <span className={`text-[14px] font-medium ${on ? "text-accent" : "text-fg"}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>

      <div className="relative flex min-h-[220px] flex-col justify-center overflow-hidden rounded-2xl border border-line bg-bg-2 p-6">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={active}
            custom={direction}
            variants={panelVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
          >
            {Panel ? <Panel /> : null}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
