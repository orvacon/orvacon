"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useRef } from "react";
import { Check } from "./decor";

const lines = [
  { kind: "cmd", text: "bunx orvacon generate" },
  { kind: "ok", text: "wrote supabase/migrations/0001_orvacon.sql" },
  { kind: "ok", text: "default-deny RLS on payments · ledger · events" },
  { kind: "cmd", text: "supabase db push" },
  { kind: "ok", text: "schema applied" },
];

export function BentoTerminal() {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      gsap.timeline({ repeat: -1, repeatDelay: 3.5 }).from(".bento-line", {
        opacity: 0,
        y: 6,
        duration: 0.3,
        stagger: 0.55,
        ease: "power2.out",
      });
    },
    { scope: root },
  );

  return (
    <div
      ref={root}
      className="flex flex-col overflow-hidden rounded-2xl border border-[#26262a] bg-[#161618]"
    >
      <div className="flex items-center gap-2.5 border-b border-[#232327] bg-[#0f0f11] px-4 py-3">
        <span className="flex gap-1.5">
          <span className="h-[9px] w-[9px] rounded-full bg-[#3a3a3f]" />
          <span className="h-[9px] w-[9px] rounded-full bg-[#2f2f34]" />
          <span className="h-[9px] w-[9px] rounded-full bg-[#2f2f34]" />
        </span>
        <span className="font-mono text-[12px] text-[#8c8c86]">generate and go</span>
      </div>
      <div className="flex flex-col gap-1.5 p-5 font-mono text-[12.5px] leading-[1.7]">
        {lines.map((line) => (
          <div key={line.text} className="bento-line flex items-center gap-2.5">
            {line.kind === "cmd" ? (
              <span className="text-[#8a8a86]">$</span>
            ) : (
              <Check className="shrink-0 text-[#3fb97e]" />
            )}
            <span className={line.kind === "cmd" ? "text-[#c9c7bf]" : "text-[#8c8c86]"}>
              {line.text}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
