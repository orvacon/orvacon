import { CopyButton } from "@/components/copy-button";

const installCommand =
  "bun add @orvacon/paykit @orvacon/connector-iyzico @orvacon/adapter-supabase @orvacon/adapter-nextjs postgres";

export function GetStarted() {
  return (
    <section
      id="start"
      className="border-t border-dashed border-[var(--guide)] px-[30px] py-[88px]"
    >
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
              Read the README →
            </a>
            <span className="inline-flex items-center gap-2 rounded-[9px] border border-line px-4 py-[11px] text-[14.5px] text-fg-dim">
              Docs
              <span className="rounded border border-line px-1.5 py-px font-mono text-[10px] text-fg-faint">
                soon
              </span>
            </span>
          </div>
        </div>
        <div className="flex min-w-0 flex-col gap-3.5">
          <div className="overflow-hidden rounded-xl border border-[#26262a] bg-[#161618]">
            <div className="flex items-center justify-between border-b border-[#232327] bg-[#0f0f11] px-[13px] py-2.5">
              <span className="font-mono text-[12px] text-[#8c8c86]">install</span>
              <CopyButton text={installCommand} />
            </div>
            <pre className="m-0 overflow-x-auto px-4 py-[15px] font-mono text-[12.5px] leading-[1.7] text-[#c9c7bf]">
              <code>
                <span className="text-[#74a7f5]">bun</span> add{" "}
                <span className="text-[#9fce7e]">@orvacon/paykit</span>{" "}
                <span className="text-[#9fce7e]">@orvacon/connector-iyzico</span>{" "}
                <span className="text-[#9fce7e]">@orvacon/adapter-supabase</span>{" "}
                <span className="text-[#9fce7e]">@orvacon/adapter-nextjs</span>{" "}
                <span className="text-[#9fce7e]">postgres</span>
              </code>
            </pre>
          </div>
          <div className="overflow-hidden rounded-xl border border-[#26262a] bg-[#161618]">
            <div className="flex items-center border-b border-[#232327] bg-[#0f0f11] px-[13px] py-2.5">
              <span className="font-mono text-[12px] text-[#8c8c86]">cli</span>
            </div>
            <pre className="m-0 overflow-x-auto px-4 py-[15px] font-mono text-[12.5px] leading-[1.9] text-[#c9c7bf]">
              <code>
                <span className="text-[#6a6a72]">{"# generate webhook signing keys"}</span>
                {"\n"}
                <span className="text-[#8a8a86]">$</span> npx orvacon{" "}
                <span className="text-[#74a7f5]">keys</span>
                {"\n"}
                <span className="text-[#6a6a72]">{"# scaffold the database schema"}</span>
                {"\n"}
                <span className="text-[#8a8a86]">$</span> npx orvacon{" "}
                <span className="text-[#74a7f5]">generate</span>
              </code>
            </pre>
          </div>
        </div>
      </div>
    </section>
  );
}
