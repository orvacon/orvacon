import type { ReactNode } from "react";

function VerifiedBadge() {
  return (
    <span className="rounded bg-[rgba(63,185,126,0.12)] px-1.5 py-px font-mono text-[10px] text-[#3fb97e]">
      verified
    </span>
  );
}

function Card({
  name,
  badge,
  desc,
  variant = "solid",
}: {
  name: string;
  badge?: ReactNode;
  desc: ReactNode;
  variant?: "solid" | "accent" | "dashed";
}) {
  const border =
    variant === "accent"
      ? "border border-[var(--accent-line)]"
      : variant === "dashed"
        ? "border border-dashed border-line-2"
        : "border border-line";
  return (
    <div className={`rounded-[11px] p-3.5 ${border}`}>
      <div className="flex items-center gap-2">
        <span
          className={`font-mono text-[13px] ${variant === "dashed" ? "text-fg-dim" : "text-fg"}`}
        >
          {name}
        </span>
        {badge}
      </div>
      <p
        className={`mt-1.5 text-[12.5px] leading-[1.5] ${
          variant === "dashed" ? "text-fg-faint" : "text-fg-dim"
        }`}
      >
        {desc}
      </p>
    </div>
  );
}

function Column({
  header,
  accent,
  children,
}: {
  header: ReactNode;
  accent?: boolean;
  children: ReactNode;
}) {
  return (
    <div
      className={`overflow-hidden rounded-2xl border bg-bg-2 ${
        accent ? "border-[var(--accent-line)]" : "border-line"
      }`}
    >
      {header}
      <div className="flex flex-col gap-2.5 p-3.5">{children}</div>
    </div>
  );
}

function Header({
  icon,
  title,
  tag,
  titleClass,
  tagClass,
  accent,
}: {
  icon: ReactNode;
  title: string;
  tag: string;
  titleClass: string;
  tagClass: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-2.5 border-b border-line px-5 py-[18px] ${
        accent ? "bg-[var(--accent-soft)]" : ""
      }`}
    >
      {icon}
      <span className={`text-[14px] font-semibold ${titleClass}`}>{title}</span>
      <span className={`ml-auto font-mono text-[11px] ${tagClass}`}>{tag}</span>
    </div>
  );
}

export function Board() {
  return (
    <section className="px-[clamp(24px,3.4vw,46px)] pb-[84px]">
      <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] items-start gap-[18px]">
        <Column
          header={
            <Header
              icon={
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#3fb97e"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              }
              title="Shipped"
              tag="v0.3"
              titleClass="text-fg"
              tagClass="text-fg-faint"
            />
          }
        >
          <Card
            name="@orvacon/paykit"
            desc="Core orchestrator: state machine, money typing, idempotency, hash-chained ledger."
          />
          <Card
            name="connector-iyzico"
            badge={<VerifiedBadge />}
            desc="Raw-card and stored-card 3-D Secure, verified end-to-end against the sandbox."
          />
          <Card name="adapter-supabase" desc="Schema generation with default-deny RLS." />
          <Card name="adapter-nextjs" desc="App Router handlers and webhook verification." />
          <Card
            name="cryptokit · CLI"
            desc={
              <>
                Ed25519 signing primitives and the <span className="text-fg">orvacon</span> CLI
                (keys, generate).
              </>
            }
          />
          <Card
            name="Documentation"
            desc="The full Fumadocs reference — setup, paykit, connectors, adapters, cryptokit and the CLI."
          />
          <Card
            name="API stabilization"
            desc="The 0.x surface settled toward 1.0, shipped in 0.3.0."
          />
        </Column>

        <Column
          accent
          header={
            <Header
              accent
              icon={
                <span className="h-3 w-3 animate-[spin_2.5s_linear_infinite] rounded-full border-2 border-accent border-t-transparent" />
              }
              title="In progress"
              tag="next"
              titleClass="text-accent"
              tagClass="text-accent"
            />
          }
        >
          <Card
            variant="accent"
            name="connector-paytr"
            desc="The second gateway behind the same contract — base64 signatures, panel-set callback, plain-text ack. Exercises the connector abstraction before we freeze it."
          />
          <Card
            name="1.0 API"
            desc="Freeze the surface once a second connector has proven the contract holds."
          />
        </Column>

        <Column
          header={
            <Header
              icon={
                <svg
                  width="15"
                  height="15"
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
              }
              title="Planned"
              tag="later"
              titleClass="text-fg-dim"
              tagClass="text-fg-faint"
            />
          }
        >
          <Card
            variant="dashed"
            name="Bank virtual POS"
            desc="Turkish bank VPOS (3D Pay / 3D Secure) connectors."
          />
          <Card
            variant="dashed"
            name="UI components"
            desc="Drop-in payment + 3DS UI for common frameworks."
          />
          <Card
            variant="dashed"
            name="Subscription · tax · fraud · ledger kits"
            desc="Higher-level kits layered on the core primitives."
          />
        </Column>
      </div>

      <div className="mt-5 flex items-start gap-3 rounded-[12px] border border-line bg-bg-2 px-[18px] py-4">
        <svg
          width="17"
          height="17"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--text-dim)"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className="mt-0.5 shrink-0"
        >
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8h.01M11 12h1v4h1" />
        </svg>
        <p className="m-0 text-[14px] leading-[1.6] text-fg-dim">
          Priorities shift with what people actually build. The clearest signal is a GitHub issue or
          a thumbs-up on an existing one — the board follows real demand, not a fixed calendar.
        </p>
      </div>
    </section>
  );
}
