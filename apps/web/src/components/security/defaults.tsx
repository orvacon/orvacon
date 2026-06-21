import type { ReactNode } from "react";
import { Sym } from "@/components/security/parts";

const defaults: { id: string; icon: ReactNode; title: string; desc: string }[] = [
  {
    id: "rls",
    icon: (
      <Sym size={17}>
        <rect x="4" y="11" width="16" height="10" rx="2" />
        <path d="M8 11V8a4 4 0 018 0v3" />
      </Sym>
    ),
    title: "Default-deny RLS",
    desc: "The Supabase adapter generates a schema with row-level security on and everything denied until you grant it.",
  },
  {
    id: "ledger",
    icon: (
      <Sym size={17}>
        <path d="M4 7h16M4 12h16M4 17h10" />
      </Sym>
    ),
    title: "Hash-chained ledger",
    desc: "Every entry references the prior hash. The ledger is append-only and tamper-evident — edits break the chain.",
  },
  {
    id: "idempotency",
    icon: (
      <Sym size={17}>
        <circle cx="12" cy="12" r="9" />
        <path d="M9 12l2 2 4-4" />
      </Sym>
    ),
    title: "Idempotency enforced",
    desc: "A database unique constraint — not application logic — guarantees a retried request can't double-charge.",
  },
  {
    id: "no-pan",
    icon: (
      <Sym size={17}>
        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" />
        <path d="M4 4l16 16" />
      </Sym>
    ),
    title: "No card data stored",
    desc: "Raw card details go straight to the gateway. orvacon persists references and state — never a PAN.",
  },
  {
    id: "secrets",
    icon: (
      <Sym size={17}>
        <circle cx="12" cy="12" r="3" />
        <path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2" />
      </Sym>
    ),
    title: "Secrets via environment",
    desc: "API keys and signing keys are read from the environment, never committed and never written to the database.",
  },
  {
    id: "runtime",
    icon: (
      <Sym size={17}>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </Sym>
    ),
    title: "Runs in your runtime",
    desc: "No orvacon-hosted service sees your traffic. There is no third party in the request path to trust or breach.",
  },
];

export function Defaults() {
  return (
    <section className="border-t border-dashed border-[var(--guide)] px-[30px] py-[84px]">
      <div className="mx-auto mb-11 max-w-[640px] text-center">
        <div className="orv-eyebrow">04 — Defaults</div>
        <h2 className="mt-3.5 text-[clamp(26px,3.4vw,42px)] font-semibold leading-[1.08] tracking-[-0.03em]">
          Secure by default, not by checklist.
        </h2>
        <p className="mx-auto mt-3.5 max-w-[56ch] text-[16px] leading-[1.6] text-fg-dim">
          The safe choice is the one you get without configuring anything.
        </p>
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-px border border-[var(--guide)] bg-[var(--guide)]">
        {defaults.map((item) => (
          <div key={item.id} className="relative bg-bg px-6 py-[26px]">
            <span className="absolute -left-px -top-px h-[9px] w-[9px] border-l-[1.5px] border-t-[1.5px] border-[var(--mark)]" />
            <span className="absolute -bottom-px -right-px h-[9px] w-[9px] border-b-[1.5px] border-r-[1.5px] border-[var(--mark)]" />
            <div className="mb-3.5 flex h-[34px] w-[34px] items-center justify-center rounded-[9px] bg-[var(--accent-soft)] text-accent">
              {item.icon}
            </div>
            <h3 className="text-[15.5px] font-semibold tracking-[-0.01em]">{item.title}</h3>
            <p className="mt-2 text-[13.5px] leading-[1.55] text-fg-dim">{item.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
