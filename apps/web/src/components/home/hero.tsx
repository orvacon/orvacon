import Link from "next/link";
import { ArrowRight } from "@/components/icons";
import { heroBadge } from "@/lib/shared";
import { HeroDemo } from "./hero-demo";

export function Hero() {
  return (
    <>
      <section className="px-[clamp(24px,3.4vw,46px)] pt-[88px]">
        <div className="orv-eyebrow">TypeScript-first · Payment orchestration</div>
        <h1 className="mt-[22px] max-w-[15ch] text-[clamp(38px,5.4vw,66px)] font-semibold leading-[1.02] tracking-[-0.038em]">
          Provider-agnostic payment orchestration.
        </h1>
        <div className="mt-[26px] flex flex-wrap items-end justify-between gap-x-12 gap-y-7">
          <p className="m-0 max-w-[52ch] text-[18px] leading-[1.55] text-fg-dim">
            One clean API, any gateway. Iyzico, PayTR and bank virtual POS plug in as connectors
            behind a single type-safe interface — your code never knows which one is handling a
            payment.
          </p>
          <Link
            href={heroBadge.href}
            className="group inline-flex items-center gap-1.5 whitespace-nowrap font-mono text-[12px] text-fg-faint transition-colors hover:text-fg-dim"
          >
            {heroBadge.label}
            <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
        <div className="mt-[30px] flex flex-wrap gap-3">
          <Link
            href="/docs/get-started"
            className="inline-flex items-center gap-2 rounded-[9px] bg-accent px-5 py-[11px] text-[14.5px] font-medium text-white shadow-[0_10px_28px_-14px_var(--accent)] transition hover:-translate-y-px hover:brightness-[1.07]"
          >
            Get started
          </Link>
          <a
            href="https://github.com/orvacon/orvacon"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-[9px] border border-line bg-bg-2 px-[18px] py-[11px] text-[14.5px] font-medium text-fg transition-colors hover:border-line-2"
          >
            View on GitHub
          </a>
        </div>
      </section>

      <section className="px-[clamp(24px,3.4vw,46px)] pb-16 pt-[46px]">
        <HeroDemo />
      </section>
    </>
  );
}
