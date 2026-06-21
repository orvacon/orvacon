import { RevealOnView } from "@/components/reveal-on-view";
import { BentoTerminal } from "./bento-terminal";

const stack = ["Bun", "Next.js", "Postgres", "Supabase"];

export function Bento() {
  return (
    <section className="border-t border-dashed border-[var(--guide)] px-[30px] py-[88px]">
      <div className="mb-[42px] grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] items-start gap-x-14 gap-y-[30px]">
        <div className="min-w-0">
          <div className="orv-eyebrow">Built to fit</div>
          <h2 className="mt-4 max-w-[16ch] text-[clamp(28px,3.6vw,44px)] font-semibold leading-[1.08] tracking-[-0.03em]">
            Tailored to your stack.
          </h2>
        </div>
        <div className="flex h-full min-w-0 items-end">
          <p className="m-0 max-w-[50ch] text-[16.5px] leading-[1.62] text-fg-dim">
            Drop it into the app you already have — your framework, your database, your runtime.
            Install only what you need.
          </p>
        </div>
      </div>

      <RevealOnView className="grid grid-cols-1 items-stretch gap-[18px] md:grid-cols-2">
        <div className="rounded-2xl border border-line bg-bg-2 p-7 transition-colors hover:border-line-2">
          <h3 className="text-[18px] font-semibold tracking-[-0.01em] text-fg">
            Fits your existing stack
          </h3>
          <p className="mt-2 text-[14px] leading-[1.6] text-fg-dim">
            Your framework, your database, your runtime — no proprietary tooling, no vendor lock-in.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {stack.map((name) => (
              <span
                key={name}
                className="rounded-md border border-line bg-bg px-3 py-1.5 font-mono text-[12px] text-fg-dim"
              >
                {name}
              </span>
            ))}
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl bg-[linear-gradient(160deg,var(--accent-2),var(--accent))] p-7">
          <div
            aria-hidden="true"
            className="absolute inset-0 opacity-50 [background-image:radial-gradient(circle,rgba(255,255,255,0.1)_1px,transparent_1.2px)] [background-size:10px_10px]"
          />
          <div className="relative">
            <h3 className="text-[18px] font-semibold tracking-[-0.01em] text-white">
              One clean API, any gateway
            </h3>
            <p className="mt-2 max-w-[34ch] text-[14px] leading-[1.6] text-white/80">
              Your code calls <span className="font-mono">orva.authorize(…)</span> and never knows
              which gateway handled the payment.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-line bg-bg-2 p-7 transition-colors hover:border-line-2">
          <h3 className="text-[18px] font-semibold tracking-[-0.01em] text-fg">
            Default-deny, out of the box
          </h3>
          <p className="mt-2 text-[14px] leading-[1.6] text-fg-dim">
            Bring your own database. The Supabase adapter generates a schema where row-level
            security denies by default.
          </p>
          <pre className="no-scrollbar mt-5 overflow-x-auto rounded-[10px] border border-[#26262a] bg-[#161618] px-4 py-3 font-mono text-[12px] leading-[1.7] text-[#c9c7bf]">
            <code>
              <span className="text-[#b69bf0]">alter table</span> orvacon_payments{"\n"}
              {"  "}
              <span className="text-[#b69bf0]">enable row level security</span>
              {";"}
            </code>
          </pre>
        </div>

        <BentoTerminal />
      </RevealOnView>
    </section>
  );
}
