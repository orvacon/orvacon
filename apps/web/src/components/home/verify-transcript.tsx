"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useRef } from "react";
import { Check } from "./decor";

const rows = [
  { name: "authorize", code: "201", codeClass: "text-[#74a7f5]", note: "card → gateway" },
  { name: "requires_action", code: "3DS", codeClass: "text-[#b69bf0]", note: "state persisted" },
  { name: "finalize", code: "sig", codeClass: "text-[#9fce7e]", note: "signature verified" },
  { name: "capture", code: "200", codeClass: "text-[#74a7f5]", note: "funds → merchant" },
  { name: "refund", code: "200", codeClass: "text-[#74a7f5]", note: "reversed" },
  { name: "reconcile", code: "ok", codeClass: "text-[#6fd3c3]", note: "ledger hash-chained" },
];

export function VerifyTranscript() {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const tl = gsap.timeline({ repeat: -1, repeatDelay: 5, defaults: { ease: "power2.out" } });
      tl.from(".verify-row", { opacity: 0.2, x: -6, duration: 0.4, stagger: 0.5 }).from(
        ".verify-check",
        { scale: 0, transformOrigin: "center", duration: 0.3, stagger: 0.5 },
        0,
      );
    },
    { scope: root },
  );

  return (
    <div ref={root} className="relative">
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
          {rows.map((row, index) => (
            <div
              key={row.name}
              className={`verify-row flex items-center gap-3 px-3 py-2.5 font-mono text-[12.5px] ${
                index > 0 ? "border-t border-[#1e1e22]" : ""
              }`}
            >
              <Check className="verify-check shrink-0 text-[#3fb97e]" />
              <span className="w-[118px] text-[#c9c7bf]">{row.name}</span>
              <span className={`w-10 ${row.codeClass}`}>{row.code}</span>
              <span className="text-[#6a6a72]">{row.note}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
