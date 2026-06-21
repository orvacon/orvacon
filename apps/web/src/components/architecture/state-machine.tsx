import { DotField, SectionHeader } from "@/components/section";

const toneClass = {
  plain: "border border-line-2 bg-bg-3 text-fg",
  accent: "border-[1.5px] border-accent bg-[var(--accent-soft)] text-accent",
  muted: "border border-dashed border-line-2 bg-bg text-fg-dim",
} as const;

const nodes: { label: string; x: number; y: number; tone: keyof typeof toneClass }[] = [
  { label: "created", x: 100, y: 180, tone: "plain" },
  { label: "authorized", x: 330, y: 180, tone: "plain" },
  { label: "requires_action", x: 330, y: 80, tone: "accent" },
  { label: "captured", x: 610, y: 180, tone: "accent" },
  { label: "refunded", x: 810, y: 180, tone: "muted" },
  { label: "voided", x: 610, y: 300, tone: "muted" },
  { label: "failed", x: 810, y: 300, tone: "muted" },
];

const flow = "[animation:orv-dash-flow_1s_linear_infinite]";

export function StateMachine() {
  return (
    <section className="border-t border-dashed border-[var(--guide)] px-[clamp(24px,3.4vw,46px)] py-[84px]">
      <SectionHeader
        eyebrow="03 — State machine"
        title="Invalid transitions don't type-check."
        lead={
          <>
            <span className="font-mono text-[13px] text-fg">PaymentState</span> is a discriminated
            union and the legal moves between states are encoded in the types. You can't capture a
            refunded payment — the compiler stops you before runtime does.
          </>
        }
      />
      <div className="relative overflow-hidden rounded-2xl border border-line bg-bg-2 p-[22px]">
        <DotField />
        <div className="absolute left-4 top-3.5 z-[3] font-mono text-[10.5px] uppercase tracking-[0.14em] text-fg-faint">
          fig · PaymentState
        </div>
        <div className="relative z-[2] overflow-x-auto pt-3.5">
          <div className="relative mx-auto h-[340px] w-[1000px]">
            <svg
              viewBox="0 0 1000 340"
              width="1000"
              height="340"
              fill="none"
              aria-hidden="true"
              className="absolute inset-0 overflow-visible"
            >
              <defs>
                <marker id="aHd" markerWidth="9" markerHeight="9" refX="6" refY="4.5" orient="auto">
                  <path
                    d="M1 1 L7 4.5 L1 8"
                    stroke="var(--accent)"
                    strokeWidth="1.6"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </marker>
                <marker
                  id="aHdim"
                  markerWidth="9"
                  markerHeight="9"
                  refX="6"
                  refY="4.5"
                  orient="auto"
                >
                  <path
                    d="M1 1 L7 4.5 L1 8"
                    stroke="var(--text-faint)"
                    strokeWidth="1.6"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </marker>
              </defs>
              <path
                d="M168 180 L256 180"
                stroke="var(--accent)"
                strokeWidth="1.8"
                strokeDasharray="6 8"
                markerEnd="url(#aHd)"
                className={flow}
              />
              <path
                d="M360 158 L360 100"
                stroke="var(--accent)"
                strokeWidth="1.8"
                strokeDasharray="6 8"
                markerEnd="url(#aHd)"
                className={flow}
              />
              <path
                d="M414 80 C 500 80 500 150 556 168"
                stroke="var(--accent)"
                strokeWidth="1.8"
                strokeDasharray="6 8"
                markerEnd="url(#aHd)"
                className={flow}
              />
              <path
                d="M414 180 L556 180"
                stroke="var(--accent)"
                strokeWidth="1.8"
                strokeDasharray="6 8"
                markerEnd="url(#aHd)"
                className={flow}
              />
              <path
                d="M664 180 L756 180"
                stroke="var(--accent)"
                strokeWidth="1.6"
                strokeDasharray="5 7"
                markerEnd="url(#aHdim)"
                opacity="0.7"
              />
              <path
                d="M340 202 C 300 280 480 300 556 300"
                stroke="var(--text-faint)"
                strokeWidth="1.5"
                strokeDasharray="4 7"
                markerEnd="url(#aHdim)"
                opacity="0.6"
              />
              <path
                d="M620 280 C 700 250 720 230 760 212"
                stroke="var(--text-faint)"
                strokeWidth="1.5"
                strokeDasharray="4 7"
                markerEnd="url(#aHdim)"
                opacity="0.6"
              />
              <text
                x="210"
                y="170"
                fill="var(--text-faint)"
                fontFamily="var(--font-geist-mono), monospace"
                fontSize="10"
              >
                begin
              </text>
              <text
                x="372"
                y="132"
                fill="var(--text-faint)"
                fontFamily="var(--font-geist-mono), monospace"
                fontSize="10"
              >
                3DS
              </text>
            </svg>
            {nodes.map((node) => (
              <div
                key={node.label}
                style={{ left: node.x, top: node.y }}
                className={`absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-[9px] px-3 py-[9px] font-mono text-[12px] ${toneClass[node.tone]}`}
              >
                {node.label}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
