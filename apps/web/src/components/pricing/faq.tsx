import type { ReactNode } from "react";
import { Flow } from "@/components/icons";

const faqs: { id: string; q: string; a: ReactNode }[] = [
  {
    id: "free",
    q: "Is it really free?",
    a: "Yes. Every published package is MIT-licensed and there's no paid tier today. You pay your gateway and your own hosting — orvacon itself costs nothing.",
  },
  {
    id: "enterprise",
    q: "Is there an enterprise plan?",
    a: "Not right now. Security features aren't gated behind a tier — everything in the project is available to everyone.",
  },
  {
    id: "cut",
    q: "Do you take a cut of payments?",
    a: (
      <>
        No. Funds move on the <Flow steps={["card", "your gateway account"]} /> path; orvacon is
        never in it, so there's nothing for it to skim.
      </>
    ),
  },
  {
    id: "support",
    q: "How can I support it?",
    a: "Sponsor on GitHub, contribute code or connectors, or report issues. All optional, all appreciated.",
  },
];

export function Faq() {
  return (
    <section className="border-t border-dashed border-[var(--guide)] px-[clamp(24px,3.4vw,46px)] py-[84px]">
      <div className="mx-auto mb-10 max-w-[600px] text-center">
        <div className="orv-eyebrow">04 — FAQ</div>
        <h2 className="mt-3.5 text-[clamp(26px,3.4vw,42px)] font-semibold leading-[1.08] tracking-[-0.03em]">
          Straight answers.
        </h2>
      </div>
      <div className="mx-auto grid max-w-[760px] gap-px border border-[var(--guide)] bg-[var(--guide)]">
        {faqs.map((faq) => (
          <div key={faq.id} className="bg-bg px-[26px] py-6">
            <h3 className="text-[16px] font-semibold tracking-[-0.01em]">{faq.q}</h3>
            <p className="mt-2.5 text-[14.5px] leading-[1.6] text-fg-dim">{faq.a}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
