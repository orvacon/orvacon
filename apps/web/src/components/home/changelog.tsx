import { ArrowRight, Flow } from "@/components/icons";
import { RevealOnView } from "@/components/reveal-on-view";

const changes = [
  {
    title: "Iyzico 3-D Secure, verified",
    desc: (
      <>
        <Flow steps={["authorize", "3DS", "capture", "refund", "reconcile"]} />, end-to-end against
        the gateway sandbox.
      </>
    ),
  },
  {
    title: "Ed25519-signed webhooks",
    desc: "Asymmetric signatures so a leaked verification key can't forge events. Timing-safe checks throughout.",
  },
  {
    title: "Schema with default-deny RLS",
    desc: "Generates a Postgres schema with row-level security locked down out of the box.",
  },
  {
    title: "Hash-chained ledger",
    desc: "Append-only and tamper-evident by construction; idempotency enforced by a unique constraint.",
  },
];

export function Changelog() {
  return (
    <section
      id="changelog"
      className="border-t border-dashed border-[var(--guide)] px-[30px] py-[88px]"
    >
      <div className="mb-11 flex flex-wrap items-end justify-between gap-6">
        <div>
          <div className="orv-eyebrow">07 — Changelog</div>
          <h2 className="mt-4 max-w-[16ch] text-[clamp(28px,3.6vw,44px)] font-semibold leading-[1.08] tracking-[-0.03em]">
            Shipped in the open.
          </h2>
        </div>
        <a
          href="https://github.com/orvacon/orvacon/releases"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-[7px] pb-1.5 font-mono text-[12.5px] text-fg-dim transition-colors hover:text-fg"
        >
          View all releases
          <ArrowRight className="h-3.5 w-3.5" />
        </a>
      </div>

      <div className="overflow-hidden rounded-2xl border border-line bg-bg-2">
        <div className="flex flex-wrap items-center gap-3 border-b border-line px-6 py-4">
          <span className="rounded-md bg-[var(--accent-soft)] px-2.5 py-1 font-mono text-[13px] text-accent">
            v0.1.0
          </span>
          <span className="rounded border border-line px-2 py-0.5 font-mono text-[11px] text-fg-faint">
            first release
          </span>
          <span className="ml-auto font-mono text-[12px] text-fg-faint">2026</span>
        </div>
        <RevealOnView className="divide-y divide-line">
          {changes.map((change) => (
            <div key={change.title} className="flex gap-4 px-6 py-5">
              <span
                aria-hidden="true"
                className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent"
              />
              <div>
                <h3 className="text-[15px] font-semibold tracking-[-0.01em] text-fg">
                  {change.title}
                </h3>
                <p className="mt-1 text-[13.5px] leading-[1.55] text-fg-dim">{change.desc}</p>
              </div>
            </div>
          ))}
        </RevealOnView>
      </div>
    </section>
  );
}
