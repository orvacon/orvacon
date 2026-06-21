import Link from "next/link";
import { CopyButton } from "@/components/copy-button";

const heroCode = `import { orvacon } from "@orvacon/paykit";
import { iyzico } from "@orvacon/connector-iyzico";
import { supabaseAdapter } from "@orvacon/adapter-supabase";
import postgres from "postgres";

const sql = postgres(process.env.SUPABASE_DB_URL!, { prepare: false });

export const orva = orvacon({
  database: supabaseAdapter({ sql }),
  connectors: [
    iyzico({ apiKey: process.env.IYZICO_API_KEY!, secretKey: process.env.IYZICO_SECRET_KEY! }),
  ],
  webhookSigningKey: process.env.ORVACON_WEBHOOK_SIGNING_KEY!,
});`;

export function Hero() {
  return (
    <>
      <section className="px-[30px] pt-[88px]">
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
          <div className="whitespace-nowrap font-mono text-[12px] text-fg-faint">
            v0.1 · Verified · Iyzico sandbox →
          </div>
        </div>
        <div className="mt-[30px] flex flex-wrap gap-3">
          <Link
            href="/#start"
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

      <section className="relative px-[30px] pb-16 pt-[46px]">
        <div className="relative mx-auto max-w-[900px]">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-1/2 top-[-60px] h-[420px] w-[120%] -translate-x-1/2 blur-lg [background:radial-gradient(50%_60%_at_50%_30%,color-mix(in_srgb,var(--accent)_34%,transparent),transparent_68%)]"
          />
          <div className="relative z-[2] overflow-hidden rounded-[14px] border border-[#26262a] bg-[#161618] shadow-[0_50px_120px_-50px_rgba(0,0,0,0.9)]">
            <div className="flex items-center justify-between border-b border-[#232327] bg-[#0f0f11] px-[15px] py-3">
              <div className="flex items-center gap-2.5">
                <span className="flex gap-1.5">
                  <span className="h-[11px] w-[11px] rounded-full bg-[#3a3a3f]" />
                  <span className="h-[11px] w-[11px] rounded-full bg-[#2f2f34]" />
                  <span className="h-[11px] w-[11px] rounded-full bg-[#2f2f34]" />
                </span>
                <span className="ml-1 font-mono text-[12.5px] text-[#8c8c86]">payments.ts</span>
              </div>
              <CopyButton text={heroCode} />
            </div>
            <pre className="no-scrollbar m-0 overflow-x-auto px-[22px] pb-6 pt-[22px] font-mono text-[13.5px] leading-[1.8] text-[#c9c7bf]">
              <code>
                <span className="text-[#b69bf0]">import</span>
                {" { "}
                <span className="text-[#74a7f5]">orvacon</span>
                {" } "}
                <span className="text-[#b69bf0]">from</span>{" "}
                <span className="text-[#9fce7e]">"@orvacon/paykit"</span>;{"\n"}
                <span className="text-[#b69bf0]">import</span>
                {" { "}
                <span className="text-[#74a7f5]">iyzico</span>
                {" } "}
                <span className="text-[#b69bf0]">from</span>{" "}
                <span className="text-[#9fce7e]">"@orvacon/connector-iyzico"</span>;{"\n"}
                <span className="text-[#b69bf0]">import</span>
                {" { "}
                <span className="text-[#74a7f5]">supabaseAdapter</span>
                {" } "}
                <span className="text-[#b69bf0]">from</span>{" "}
                <span className="text-[#9fce7e]">"@orvacon/adapter-supabase"</span>;{"\n"}
                <span className="text-[#b69bf0]">import</span>{" "}
                <span className="text-[#74a7f5]">postgres</span>{" "}
                <span className="text-[#b69bf0]">from</span>{" "}
                <span className="text-[#9fce7e]">"postgres"</span>;{"\n"}
                {"\n"}
                <span className="text-[#b69bf0]">const</span> sql ={" "}
                <span className="text-[#74a7f5]">postgres</span>
                {"(process.env.SUPABASE_DB_URL"}
                <span className="text-[#e89a6c]">!</span>
                {", { prepare: "}
                <span className="text-[#e89a6c]">false</span>
                {" });"}
                {"\n"}
                {"\n"}
                <span className="text-[#b69bf0]">export const</span> orva ={" "}
                <span className="text-[#74a7f5]">orvacon</span>
                {"({"}
                {"\n"}
                {"  database: "}
                <span className="text-[#74a7f5]">supabaseAdapter</span>
                {"({ sql }),"}
                {"\n"}
                {"  connectors: ["}
                {"\n"}
                {"    "}
                <span className="text-[#74a7f5]">iyzico</span>
                {"({ apiKey: process.env.IYZICO_API_KEY"}
                <span className="text-[#e89a6c]">!</span>
                {", secretKey: process.env.IYZICO_SECRET_KEY"}
                <span className="text-[#e89a6c]">!</span>
                {" }),"}
                {"\n"}
                {"  ],"}
                {"\n"}
                {"  webhookSigningKey: process.env.ORVACON_WEBHOOK_SIGNING_KEY"}
                <span className="text-[#e89a6c]">!</span>
                {","}
                {"\n"}
                {"});"}
              </code>
            </pre>
          </div>
          <p className="relative z-[2] mx-auto mt-[26px] max-w-[60ch] text-center text-[14px] leading-[1.55] text-fg-faint">
            Application code then just calls{" "}
            <span className="font-mono text-[12.5px] text-accent">orva.authorize(…)</span> — and
            never references the gateway again.
          </p>
        </div>
      </section>
    </>
  );
}
