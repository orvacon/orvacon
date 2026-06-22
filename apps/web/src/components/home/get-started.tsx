import Link from "next/link";
import type { ReactNode } from "react";
import { CopyButton } from "@/components/copy-button";
import { ArrowRight } from "@/components/icons";

const installCommand =
  "bun add @orvacon/paykit @orvacon/connector-iyzico @orvacon/adapter-supabase @orvacon/adapter-nextjs postgres";

function Step({ n, title, children }: { n: string; title: string; children: ReactNode }) {
  return (
    <div className="border-b border-line p-5 last:border-b-0">
      <div className="flex items-center gap-3">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-line font-mono text-[11px] text-fg-dim">
          {n}
        </span>
        <span className="text-[14px] font-medium text-fg">{title}</span>
      </div>
      <div className="mt-3 pl-9">{children}</div>
    </div>
  );
}

function CodeBar({ copy, children }: { copy?: string; children: ReactNode }) {
  return (
    <div className="flex items-center gap-3 rounded-[10px] border border-[#26262a] bg-[#161618] px-3.5 py-2.5">
      <pre className="no-scrollbar m-0 flex-1 overflow-x-auto font-mono text-[12.5px] leading-[1.6] text-[#c9c7bf]">
        <code>{children}</code>
      </pre>
      {copy ? <CopyButton text={copy} /> : null}
    </div>
  );
}

export function GetStarted() {
  return (
    <section className="border-t border-dashed border-[var(--guide)] px-[clamp(24px,3.4vw,46px)] py-[88px]">
      <div className="grid grid-cols-[repeat(auto-fit,minmax(340px,1fr))] items-start gap-x-[46px] gap-y-10">
        <div className="min-w-0">
          <div className="orv-eyebrow">06 — Get started</div>
          <h2 className="mt-4 max-w-[14ch] text-[clamp(28px,3.6vw,44px)] font-semibold leading-[1.08] tracking-[-0.03em]">
            Install only what you need.
          </h2>
          <p className="mt-4 max-w-[46ch] text-[16.5px] leading-[1.62] text-fg-dim">
            A shadcn-style DX: one unscoped CLI, and connectors you opt into. Unused gateways never
            enter your bundle.
          </p>
          <div className="mt-[26px] flex flex-wrap gap-3">
            <a
              href="https://github.com/orvacon/orvacon"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-[9px] bg-accent px-[18px] py-[11px] text-[14.5px] font-medium text-white shadow-[0_10px_24px_-12px_var(--accent)] transition hover:-translate-y-px hover:brightness-[1.07]"
            >
              Read the README
              <ArrowRight className="h-4 w-4" />
            </a>
            <Link
              href="/docs/get-started"
              className="inline-flex items-center gap-2 rounded-[9px] border border-line px-[18px] py-[11px] text-[14.5px] text-fg transition-colors hover:border-line-2"
            >
              Read the docs
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="min-w-0 overflow-hidden rounded-2xl border border-line bg-bg-2">
          <Step n="1" title="Install the core, a connector, and your adapters">
            <CodeBar copy={installCommand}>
              <span className="text-[#74a7f5]">bun</span> add{" "}
              <span className="text-[#9fce7e]">@orvacon/paykit</span>{" "}
              <span className="text-[#9fce7e]">@orvacon/connector-iyzico</span>{" "}
              <span className="text-[#9fce7e]">@orvacon/adapter-supabase</span>{" "}
              <span className="text-[#9fce7e]">@orvacon/adapter-nextjs</span>{" "}
              <span className="text-[#9fce7e]">postgres</span>
            </CodeBar>
          </Step>
          <Step n="2" title="Generate your Ed25519 webhook signing keys">
            <CodeBar>
              <span className="text-[#8a8a86]">$</span> bunx orvacon{" "}
              <span className="text-[#74a7f5]">keys</span>
            </CodeBar>
          </Step>
          <Step n="3" title="Generate the schema with default-deny RLS">
            <CodeBar>
              <span className="text-[#8a8a86]">$</span> bunx orvacon{" "}
              <span className="text-[#74a7f5]">generate</span>
            </CodeBar>
          </Step>
        </div>
      </div>
    </section>
  );
}
