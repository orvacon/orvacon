import type { ReactNode } from "react";
import { Flow } from "@/components/icons";

function I({ size = 19, children }: { size?: number; children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

function Tick() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="shrink-0 text-accent"
    >
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

function Clock() {
  return (
    <span className="shrink-0 text-fg-faint">
      <I size={14}>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </I>
    </span>
  );
}

type Fit = {
  id: string;
  icon: ReactNode;
  badge: string;
  today: boolean;
  title: string;
  desc: ReactNode;
  rows: { id: string; text: string; soon?: boolean }[];
};

const fits: Fit[] = [
  {
    id: "checkout",
    icon: (
      <I>
        <circle cx="9" cy="20" r="1.4" />
        <circle cx="18" cy="20" r="1.4" />
        <path d="M2 3h3l2.4 12.4a2 2 0 002 1.6h8.2a2 2 0 002-1.6L23 7H6" />
      </I>
    ),
    badge: "today",
    today: true,
    title: "Checkout you own",
    desc: (
      <>
        A storefront or app that charges customers directly. You keep the cart and product logic;
        orvacon runs <Flow steps={["authorize", "3DS", "capture", "refund"]} /> and keeps the ledger
        straight.
      </>
    ),
    rows: [
      { id: "3ds", text: "Verified Iyzico 3-D Secure flow" },
      { id: "idem", text: "Idempotent retries, no double charges" },
    ],
  },
  {
    id: "subscriptions",
    icon: (
      <I>
        <path d="M21 12a9 9 0 11-3-6.7L21 8" />
        <path d="M21 3v5h-5" />
      </I>
    ),
    badge: "today + roadmap",
    today: false,
    title: "Subscriptions & recurring",
    desc: "Charge on a cycle from your own scheduler. Today you wire the recurring authorize/capture yourself; a subscription kit that schedules and retries is on the roadmap.",
    rows: [
      { id: "primitives", text: "Primitives available now" },
      { id: "subkit", text: "Subscription kit — roadmap", soon: true },
    ],
  },
  {
    id: "lock-in",
    icon: (
      <I>
        <path d="M16 3h5v5M21 3l-7 7M8 21H3v-5M3 21l7-7" />
      </I>
    ),
    badge: "today",
    today: true,
    title: "Avoiding gateway lock-in",
    desc: "Start on one provider and keep the option to add or switch. Because application code calls one interface, moving to a new connector is a configuration change — not a rewrite.",
    rows: [
      { id: "one-interface", text: "One interface across connectors" },
      { id: "migrate", text: "Migrate without touching app logic" },
    ],
  },
  {
    id: "turkish",
    icon: (
      <I>
        <path d="M12 2l8 3v6c0 5-3.5 8.5-8 11-4.5-2.5-8-6-8-11V5l8-3z" />
      </I>
    ),
    badge: "today",
    today: true,
    title: "Turkish-market products",
    desc: "Apps that need Iyzico with proper 3-D Secure today, and bank virtual POS later — all behind the same code path, with money typed in integer kuruş and a tamper-evident ledger.",
    rows: [
      { id: "iyzico", text: "Iyzico verified · bank VPOS on the roadmap" },
      { id: "money", text: "Money as integer minor units" },
    ],
  },
];

export function Fits() {
  return (
    <section className="px-[clamp(24px,3.4vw,46px)] pb-[84px]">
      <div className="orv-eyebrow mb-7">A good fit for</div>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(330px,1fr))] gap-[18px]">
        {fits.map((fit) => (
          <div
            key={fit.id}
            className="flex flex-col rounded-2xl border border-line bg-bg-2 p-[26px]"
          >
            <div className="flex items-center justify-between">
              <div className="flex h-[38px] w-[38px] items-center justify-center rounded-[10px] bg-[var(--accent-soft)] text-accent">
                {fit.icon}
              </div>
              <span
                className={`rounded-full px-2.5 py-[3px] font-mono text-[11px] ${
                  fit.today
                    ? "border border-[rgba(63,185,126,0.3)] bg-[rgba(63,185,126,0.12)] text-[#3fb97e]"
                    : "border border-line-2 text-fg-dim"
                }`}
              >
                {fit.badge}
              </span>
            </div>
            <h3 className="mt-[18px] text-[18px] font-semibold tracking-[-0.015em]">{fit.title}</h3>
            <p className="mt-2.5 flex-1 text-[14px] leading-[1.58] text-fg-dim">{fit.desc}</p>
            <div className="mt-4 flex flex-col gap-2 border-t border-line pt-3.5">
              {fit.rows.map((row) => (
                <div
                  key={row.id}
                  className={`flex items-center gap-2.5 text-[13px] ${
                    row.soon ? "text-fg-faint" : "text-fg-dim"
                  }`}
                >
                  {row.soon ? <Clock /> : <Tick />}
                  {row.text}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
