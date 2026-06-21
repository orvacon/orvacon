const items = [
  {
    id: "txn",
    title: "Per-transaction fees",
    desc: "We don't sit in the money path, so there's no transaction to skim. Volume costs you nothing extra here.",
  },
  {
    id: "seat",
    title: "Per-seat licenses",
    desc: "Your whole team can use it. There are no seats to count and no per-developer pricing.",
  },
  {
    id: "gating",
    title: "Feature gating",
    desc: 'No "enterprise-only" lock on security. Ed25519 webhooks, RLS and the ledger are in the box for everyone.',
  },
  {
    id: "middleman",
    title: "A hosted middleman",
    desc: "There's no orvacon cloud to pay for or trust. It runs entirely inside your own runtime.",
  },
];

export function NoCharge() {
  return (
    <section className="border-t border-dashed border-[var(--guide)] px-[30px] py-[84px]">
      <div className="mx-auto mb-11 max-w-[640px] text-center">
        <div className="orv-eyebrow">02 — No surprises</div>
        <h2 className="mt-3.5 text-[clamp(26px,3.4vw,42px)] font-semibold leading-[1.08] tracking-[-0.03em]">
          Things we don't charge for.
        </h2>
      </div>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-px border border-[var(--guide)] bg-[var(--guide)]">
        {items.map((item) => (
          <div key={item.id} className="relative bg-bg px-6 py-[26px]">
            <span className="absolute -left-px -top-px h-[9px] w-[9px] border-l-[1.5px] border-t-[1.5px] border-[var(--mark)]" />
            <span className="absolute -bottom-px -right-px h-[9px] w-[9px] border-b-[1.5px] border-r-[1.5px] border-[var(--mark)]" />
            <h3 className="text-[15.5px] font-semibold tracking-[-0.01em]">{item.title}</h3>
            <p className="mt-2 text-[13.5px] leading-[1.55] text-fg-dim">{item.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
