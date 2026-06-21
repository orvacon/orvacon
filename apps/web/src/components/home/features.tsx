import type { ReactNode } from "react";
import { ExpandableCard } from "@/components/expandable-card";
import { ArrowRight } from "@/components/icons";

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg
      width="18"
      height="18"
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

function FeatureCard({
  icon,
  n,
  title,
  desc,
  children,
}: {
  icon: ReactNode;
  n: string;
  title: string;
  desc: ReactNode;
  children?: ReactNode;
}) {
  return (
    <ExpandableCard
      label={`${title} — details`}
      expanded={
        <p className="text-[14.5px] leading-[1.65] text-fg-dim">
          More on "{title}" is coming soon — how it works, the guarantees it makes, and how to wire
          it up.
        </p>
      }
    >
      <div className="group relative h-full bg-bg px-6 py-7 transition-colors hover:bg-bg-2">
        <span
          aria-hidden="true"
          className="absolute left-[-1px] top-[-1px] h-[9px] w-[9px] border-l-[1.5px] border-t-[1.5px] border-[var(--mark)]"
        />
        <span
          aria-hidden="true"
          className="absolute bottom-[-1px] right-[-1px] h-[9px] w-[9px] border-b-[1.5px] border-r-[1.5px] border-[var(--mark)]"
        />
        <div className="mb-4 flex items-center justify-between">
          <div className="flex h-9 w-9 items-center justify-center rounded-[9px] bg-[var(--accent-soft)] text-accent">
            {icon}
          </div>
          <div className="flex items-center gap-2.5">
            <span className="font-mono text-[11px] text-fg-faint">{n}</span>
            <span className="flex h-6 w-6 items-center justify-center rounded-md border border-line text-fg-dim transition-colors group-hover:border-line-2 group-hover:text-fg">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <path d="M12 5v14M5 12h14" />
              </svg>
            </span>
          </div>
        </div>
        <h3 className="m-0 text-[16.5px] font-semibold tracking-[-0.01em]">{title}</h3>
        <p className="mt-[9px] text-[14px] leading-[1.58] text-fg-dim">{desc}</p>
        {children}
      </div>
    </ExpandableCard>
  );
}

export function Features() {
  return (
    <section
      id="why"
      className="border-t border-dashed border-[var(--guide)] px-[clamp(24px,3.4vw,46px)] py-[88px]"
    >
      <div className="mb-[42px] grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] items-start gap-x-14 gap-y-[30px]">
        <div className="min-w-0">
          <div className="orv-eyebrow">03 — Why it's different</div>
          <h2 className="mt-4 max-w-[16ch] text-[clamp(28px,3.6vw,44px)] font-semibold leading-[1.08] tracking-[-0.03em]">
            Built like infrastructure, not a wrapper.
          </h2>
        </div>
        <div className="flex h-full min-w-0 items-end">
          <p className="m-0 max-w-[50ch] text-[16.5px] leading-[1.62] text-fg-dim">
            Decisions made at the boundary — custody, types, money, signatures — so the hard parts
            of payments stay out of your code.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-px border border-[var(--guide)] bg-[var(--guide)]">
        <FeatureCard
          n="3.1"
          icon={
            <Icon>
              <path d="M12 2l8 3v6c0 5-3.5 8.5-8 11-4.5-2.5-8-6-8-11V5l8-3z" />
            </Icon>
          }
          title="Never holds money"
          desc="Funds flow from the cardholder straight to your own gateway account. No wallet, no balance, no payout — which keeps orvacon out of money-custody regulation and off your PCI-custody burden."
        />
        <FeatureCard
          n="3.2"
          icon={
            <Icon>
              <path d="M20 6L9 17l-5-5" />
            </Icon>
          }
          title="End-to-end type safety"
          desc="Payment state and results are discriminated unions. The state machine is enforced at compile time — an invalid transition won't type-check."
        >
          <pre className="mt-[13px] overflow-x-auto rounded-[9px] border border-[#26262a] bg-[#161618] px-[13px] py-3 font-mono text-[11px] leading-[1.65] text-[#c9c7bf]">
            <code>
              <span className="text-[#b69bf0]">type</span>{" "}
              <span className="text-[#6fd3c3]">PaymentState</span> ={"\n"}
              {"  | "}
              <span className="text-[#9fce7e]">"created"</span>
              {" | "}
              <span className="text-[#9fce7e]">"authorized"</span>
              {"\n"}
              {"  | "}
              <span className="text-[#9fce7e]">"captured"</span>
              {" | "}
              <span className="text-[#9fce7e]">"refunded"</span>
              {"\n"}
              {"  | "}
              <span className="text-[#9fce7e]">"requires_action"</span>
              {"\n"}
              {"  | "}
              <span className="text-[#9fce7e]">"failed"</span>
              {" | "}
              <span className="text-[#9fce7e]">"voided"</span>
              {";"}
            </code>
          </pre>
        </FeatureCard>
        <FeatureCard
          n="3.3"
          icon={
            <Icon>
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v10M9.2 9.2h4a1.8 1.8 0 010 3.6h-2.4a1.8 1.8 0 000 3.6h4" />
            </Icon>
          }
          title="Money as integer minor units"
          desc={
            <>
              A branded <span className="font-mono text-[12px] text-fg">Money</span> type — integer
              minor units plus currency — keeps floats out of the core.
            </>
          }
        >
          <div className="mt-[15px] flex items-center gap-2.5 font-mono text-[12.5px]">
            <span className="rounded-[7px] border border-line-2 bg-bg-3 px-2.5 py-1.5 text-fg">
              ₺14.99
            </span>
            <ArrowRight className="h-4 w-4 shrink-0 text-fg-faint" />
            <span className="rounded-[7px] border border-[var(--accent-line)] bg-[var(--accent-soft)] px-2.5 py-1.5 text-accent">
              {`{ 1499, "TRY" }`}
            </span>
          </div>
        </FeatureCard>
        <FeatureCard
          n="3.4"
          icon={
            <Icon>
              <ellipse cx="12" cy="5" rx="8" ry="3" />
              <path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3" />
            </Icon>
          }
          title="Bring your own database"
          desc="No imposed datastore. Connect yours through an adapter — and the Supabase adapter generates a schema with default-deny row-level security out of the box."
        />
        <FeatureCard
          n="3.5"
          icon={
            <Icon>
              <rect x="4" y="11" width="16" height="10" rx="2" />
              <path d="M8 11V8a4 4 0 018 0v3" />
            </Icon>
          }
          title="Asymmetric webhook signatures"
          desc="Outgoing webhooks are signed with Ed25519, so a leaked verification key can't forge events. Every signature and token check is timing-safe."
        />
        <FeatureCard
          n="3.6"
          icon={
            <Icon>
              <path d="M4 7h16M4 12h16M4 17h10" />
            </Icon>
          }
          title="Idempotency & immutable ledger"
          desc="Idempotency is enforced by a database unique constraint. The ledger is hash-chained — append-only and tamper-evident by construction."
        />
      </div>
    </section>
  );
}
