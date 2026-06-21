import { SectionHeader } from "@/components/section";

const rows = [
  { label: "Gateway fees", pct: 78, right: "to your provider", accent: false },
  { label: "Infrastructure", pct: 30, right: "your DB & host", accent: false },
  { label: "orvacon", pct: 0, right: "$0.00", accent: true },
];

export function Money() {
  return (
    <section className="border-t border-dashed border-[var(--guide)] px-[30px] py-[84px]">
      <SectionHeader
        eyebrow="01 — Where the money goes"
        title="You pay your gateway. Not us."
        lead="A payment has real costs — but they're charged by your gateway and your infrastructure, the same as if you'd integrated by hand. orvacon adds nothing on top, because it's never in the money path to take a cut."
      />
      <div className="overflow-hidden rounded-2xl border border-line bg-bg-2">
        {rows.map((row, i) => (
          <div
            key={row.label}
            className={`flex items-center gap-4 px-6 py-5 ${i > 0 ? "border-t border-line" : ""} ${
              row.accent ? "bg-[var(--accent-soft)]" : ""
            }`}
          >
            <div
              className={`w-[112px] shrink-0 font-mono text-[13px] sm:w-[150px] ${
                row.accent ? "text-accent" : "text-fg"
              }`}
            >
              {row.label}
            </div>
            <div className="h-3 flex-1 overflow-hidden rounded-md bg-bg-3">
              <div
                className={`h-full ${row.accent ? "bg-accent" : "bg-fg-dim"}`}
                style={{ width: `${row.pct}%` }}
              />
            </div>
            <div
              className={`w-[88px] shrink-0 text-right text-[12.5px] sm:w-[160px] ${
                row.accent ? "font-mono text-accent" : "text-fg-dim"
              }`}
            >
              {row.right}
            </div>
          </div>
        ))}
      </div>
      <p className="mx-0.5 mt-3.5 text-[13px] leading-[1.55] text-fg-faint">
        Illustrative split — exact gateway and infra costs depend on your provider and scale.
      </p>
    </section>
  );
}
