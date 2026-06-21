const items = [
  "Provider-agnostic",
  "TypeScript-first",
  "Never holds money",
  "Runs in your runtime",
  "MIT licensed",
  "Ed25519-signed webhooks",
  "Integer minor units",
  "Bring your own database",
  "Default-deny RLS",
  "Hash-chained ledger",
  "Timing-safe crypto",
  "Idempotent by construction",
];

export function Marquee() {
  const track = [
    ...items.map((label) => ({ id: `a-${label}`, label })),
    ...items.map((label) => ({ id: `b-${label}`, label })),
  ];
  return (
    <section className="overflow-hidden border-t border-dashed border-[var(--guide)] py-5">
      <div className="flex w-max items-center gap-7 [animation:orv-marquee_50s_linear_infinite] hover:[animation-play-state:paused]">
        {track.map((entry) => (
          <span
            key={entry.id}
            className="flex items-center gap-7 whitespace-nowrap font-mono text-[12px] uppercase tracking-[0.08em] text-fg-faint"
          >
            {entry.label}
            <span aria-hidden="true" className="text-line-2">
              /
            </span>
          </span>
        ))}
      </div>
    </section>
  );
}
