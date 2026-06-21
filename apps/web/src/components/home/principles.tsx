import type { ReactNode } from "react";

const FACE = {
  top: "[fill:#191921] [stroke:#2d2d35] group-hover:[fill:rgba(21,184,134,0.24)] group-hover:[stroke:rgba(21,184,134,0.85)]",
  left: "[fill:#121217] [stroke:#26262d] group-hover:[fill:rgba(21,184,134,0.12)] group-hover:[stroke:rgba(21,184,134,0.5)]",
  right:
    "[fill:#0d0d11] [stroke:#202026] group-hover:[fill:rgba(21,184,134,0.06)] group-hover:[stroke:rgba(21,184,134,0.32)]",
} as const;

function Face({ points, tone, delay }: { points: string; tone: keyof typeof FACE; delay: number }) {
  return (
    <polygon
      points={points}
      strokeWidth={1}
      strokeLinejoin="round"
      className={`transition-[fill,stroke] duration-[650ms] ease-out ${FACE[tone]}`}
      style={{ transitionDelay: `${delay}ms` }}
    />
  );
}

function Edge({ d, delay, dashed }: { d: string; delay: number; dashed?: boolean }) {
  return (
    <path
      d={d}
      fill="none"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`[stroke:#272730] transition-[stroke] duration-[650ms] ease-out group-hover:[stroke:rgba(21,184,134,0.8)] ${
        dashed ? "[stroke-dasharray:3_5]" : ""
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    />
  );
}

function Node({ cx, cy, delay }: { cx: number; cy: number; delay: number }) {
  return (
    <circle
      cx={cx}
      cy={cy}
      r={3.2}
      className="[fill:#22222a] transition-[fill] duration-[650ms] ease-out group-hover:[fill:rgba(21,184,134,0.95)]"
      style={{ transitionDelay: `${delay}ms` }}
    />
  );
}

function faces(cx: number, cy: number, a: number, b: number, h: number) {
  return {
    top: `${cx},${cy} ${cx + a},${cy + b} ${cx},${cy + 2 * b} ${cx - a},${cy + b}`,
    right: `${cx + a},${cy + b} ${cx},${cy + 2 * b} ${cx},${cy + 2 * b + h} ${cx + a},${cy + b + h}`,
    left: `${cx - a},${cy + b} ${cx},${cy + 2 * b} ${cx},${cy + 2 * b + h} ${cx - a},${cy + b + h}`,
  };
}

function Cube({
  cx,
  cy,
  a,
  b,
  h,
  delay = 0,
}: {
  cx: number;
  cy: number;
  a: number;
  b: number;
  h: number;
  delay?: number;
}) {
  const f = faces(cx, cy, a, b, h);
  return (
    <>
      <Face points={f.left} tone="left" delay={delay} />
      <Face points={f.right} tone="right" delay={delay} />
      <Face points={f.top} tone="top" delay={delay} />
    </>
  );
}

function FigureFrame({ children }: { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 220 200"
      aria-hidden="true"
      className="mx-auto h-auto w-full max-w-[230px] overflow-visible"
    >
      {children}
    </svg>
  );
}

function LayeredFigure() {
  return (
    <FigureFrame>
      <Cube cx={110} cy={36} a={54} b={22} h={11} delay={220} />
      <Cube cx={110} cy={80} a={54} b={22} h={11} delay={110} />
      <Cube cx={110} cy={124} a={54} b={22} h={11} delay={0} />
    </FigureFrame>
  );
}

function HubFigure() {
  return (
    <FigureFrame>
      <Edge d="M52 64 L94 110" delay={120} dashed />
      <Edge d="M110 52 L110 102" delay={150} dashed />
      <Edge d="M168 64 L126 110" delay={120} dashed />
      <Cube cx={52} cy={30} a={18} b={9} h={14} delay={150} />
      <Cube cx={110} cy={16} a={18} b={9} h={14} delay={180} />
      <Cube cx={168} cy={30} a={18} b={9} h={14} delay={150} />
      <Cube cx={110} cy={96} a={42} b={21} h={34} delay={0} />
    </FigureFrame>
  );
}

function ChainFigure() {
  return (
    <FigureFrame>
      <Edge d="M50 70 L116 100 L182 130" delay={90} />
      <Node cx={83} cy={85} delay={180} />
      <Node cx={149} cy={115} delay={320} />
      <Cube cx={50} cy={42} a={28} b={14} h={24} delay={0} />
      <Cube cx={116} cy={72} a={28} b={14} h={24} delay={150} />
      <Cube cx={182} cy={102} a={28} b={14} h={24} delay={300} />
    </FigureFrame>
  );
}

const FIGURES = [
  {
    id: "core",
    figure: <LayeredFigure />,
    title: "Cross-cutting core",
    desc: "Logging, errors, timeouts, retries and idempotency live in the core as interfaces — not bolted on as plugins.",
  },
  {
    id: "agnostic",
    figure: <HubFigure />,
    title: "Provider-agnostic",
    desc: "Every gateway plugs in as a connector behind one type-safe API. Your code never learns which one ran the payment.",
  },
  {
    id: "tamper",
    figure: <ChainFigure />,
    title: "Tamper-evident",
    desc: "Writes land in an append-only ledger, hash-chained so any edit to past records is detectable.",
  },
];

export function Principles() {
  return (
    <section className="border-t border-dashed border-[var(--guide)] px-[clamp(24px,3.4vw,46px)] py-[88px]">
      <div className="mb-[42px] grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] items-start gap-x-14 gap-y-[30px]">
        <div className="min-w-0">
          <div className="orv-eyebrow">Design principles</div>
          <h2 className="mt-4 max-w-[16ch] text-[clamp(28px,3.6vw,44px)] font-semibold leading-[1.08] tracking-[-0.03em]">
            Built like infrastructure.
          </h2>
        </div>
        <div className="flex h-full min-w-0 items-end">
          <p className="m-0 max-w-[50ch] text-[16.5px] leading-[1.62] text-fg-dim">
            Three ideas that keep payments boring — the parts you'd want a payments core to get
            right before you trust it with a charge.
          </p>
        </div>
      </div>
      <div className="grid gap-[18px] sm:grid-cols-3">
        {FIGURES.map((item) => (
          <div
            key={item.id}
            className="group rounded-2xl border border-line bg-bg-2 p-7 transition-colors duration-500 hover:border-[var(--accent-line)]"
          >
            <div className="flex items-center justify-center py-3">{item.figure}</div>
            <h3 className="mt-3 text-[18px] font-medium tracking-[-0.02em] text-fg">
              {item.title}
            </h3>
            <p className="mt-2 text-[14px] leading-[1.6] text-fg-dim">{item.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
