import { RevealOnView } from "@/components/reveal-on-view";
import { Check } from "./decor";

const stats = [
  { value: "v0.1.0", label: "first release" },
  { value: "Iyzico", label: "sandbox-verified" },
  { value: "6", label: "packages shipped" },
  { value: "MIT", label: "open source" },
];

const flow = ["authorize", "3DS", "capture", "refund", "reconcile"];

const shipped: { name: string; tag?: string }[] = [
  { name: "@orvacon/paykit", tag: "core" },
  { name: "@orvacon/connector-iyzico" },
  { name: "@orvacon/adapter-supabase" },
  { name: "@orvacon/adapter-nextjs" },
  { name: "@orvacon/cryptokit" },
  { name: "orvacon", tag: "CLI" },
];

const roadmap = [
  "PayTR connector",
  "Bank virtual POS connectors",
  "UI components",
  "Subscription · tax · fraud · ledger kits",
];

export function Status() {
  return (
    <section
      id="status"
      className="border-t border-dashed border-[var(--guide)] px-[30px] py-[88px]"
    >
      <div className="mb-[42px] grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] items-start gap-x-14 gap-y-[30px]">
        <div className="min-w-0">
          <div className="orv-eyebrow inline-flex items-center gap-2.5">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            05 — Building in the open
          </div>
          <h2 className="mt-4 max-w-[14ch] text-[clamp(28px,3.6vw,44px)] font-semibold leading-[1.08] tracking-[-0.03em]">
            v0.1 — honest about scope.
          </h2>
        </div>
        <div className="flex h-full min-w-0 items-end">
          <p className="m-0 max-w-[54ch] text-[16.5px] leading-[1.62] text-fg-dim">
            This is the first release. The Iyzico raw-card 3-D Secure flow is verified end-to-end
            against the gateway sandbox. The stored-card token flow ships but is experimental. The
            API is 0.x and may change before 1.0.
          </p>
        </div>
      </div>

      <div className="mb-[18px] grid grid-cols-2 gap-px border border-[var(--guide)] bg-[var(--guide)] sm:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-bg px-5 py-[18px]">
            <div className="font-mono text-[22px] font-semibold tracking-[-0.01em] text-fg">
              {stat.value}
            </div>
            <div className="mt-1 text-[12.5px] text-fg-dim">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="mb-[18px] flex flex-wrap items-center gap-2 rounded-[14px] border border-line bg-bg-2 px-5 py-4">
        <Check className="shrink-0 text-[#3fb97e]" />
        <span className="mr-1 text-[13px] font-medium text-fg">Verified end-to-end</span>
        {flow.map((label, index) => (
          <span key={label} className="flex items-center gap-2">
            {index > 0 ? <span className="text-fg-faint">→</span> : null}
            <span className="rounded-md border border-line bg-bg px-2 py-1 font-mono text-[12px] text-fg-dim">
              {label}
            </span>
          </span>
        ))}
      </div>

      <RevealOnView className="grid grid-cols-[repeat(auto-fit,minmax(330px,1fr))] gap-[18px]">
        <div className="rounded-[14px] border border-line bg-bg-2 p-[26px]">
          <div className="mb-[18px] flex items-center gap-2.5">
            <Check className="text-[#3fb97e]" />
            <span className="text-[13px] font-semibold tracking-[0.02em] text-fg">Shipped</span>
          </div>
          <div className="flex flex-col gap-[9px]">
            {shipped.map((p) => (
              <div
                key={p.name}
                className="flex items-center justify-between gap-2.5 rounded-lg border border-line px-3 py-[9px] font-mono text-[13px] text-fg"
              >
                {p.name}
                {p.tag ? <span className="text-[10.5px] text-fg-faint">{p.tag}</span> : null}
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-[14px] border border-line bg-bg-2 p-[26px]">
          <div className="mb-[18px] flex items-center gap-2.5">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--text-faint)"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 2" />
            </svg>
            <span className="text-[13px] font-semibold tracking-[0.02em] text-fg-dim">
              On the roadmap
            </span>
          </div>
          <div className="flex flex-col gap-[9px]">
            {roadmap.map((item) => (
              <div
                key={item}
                className="rounded-lg border border-dashed border-line-2 px-3 py-[9px] font-mono text-[13px] text-fg-dim"
              >
                {item}
              </div>
            ))}
          </div>
          <p className="mt-4 text-[12.5px] leading-[1.55] text-fg-faint">
            No "supports every gateway" — these aren't shipped yet, and we won't pretend otherwise.
          </p>
        </div>
      </RevealOnView>
    </section>
  );
}
