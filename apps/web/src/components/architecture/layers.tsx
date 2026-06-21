const coreItems = [
  "state machine",
  "Money typing",
  "idempotency",
  "ledger",
  "Ed25519 signing",
  "webhooks",
];

export function Layers() {
  return (
    <section className="px-[30px] pb-[84px] pt-10">
      <div className="mb-7 flex flex-wrap items-baseline justify-between gap-4">
        <div className="orv-eyebrow">01 — The layers</div>
        <div className="font-mono text-[12px] text-fg-faint">one boundary per concern</div>
      </div>

      <div className="rounded-[18px] border border-line bg-bg-2 p-[18px]">
        <div className="rounded-[13px] border border-dashed border-line-2 bg-bg p-4">
          <div className="mb-3 font-mono text-[11px] uppercase tracking-[0.1em] text-fg-faint">
            Your application
          </div>
          <div className="inline-flex items-center gap-[9px] rounded-lg border border-line-2 bg-bg-3 px-3.5 py-[9px] font-mono text-[13px] text-fg">
            orva.authorize(order) · capture · refund
          </div>

          <div className="relative mt-4 rounded-[13px] border-[1.5px] border-accent bg-[var(--accent-soft)] px-4 py-[18px]">
            <span className="absolute -top-[9px] left-4 rounded-[5px] border border-[var(--accent-line)] bg-bg-2 px-2 py-px font-mono text-[10.5px] uppercase tracking-[0.08em] text-accent">
              orchestrator core
            </span>
            <div className="mt-1.5 grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-[9px]">
              {coreItems.map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-2 rounded-lg border border-line bg-bg-2 px-[11px] py-[9px] font-mono text-[12px] text-fg"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                  {item}
                </div>
              ))}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-[10px] border border-dashed border-line-2 bg-bg p-3">
                <div className="mb-[9px] font-mono text-[10.5px] uppercase tracking-[0.08em] text-fg-faint">
                  Connector interface
                </div>
                <div className="flex flex-wrap gap-[7px]">
                  <span className="rounded-[7px] border border-line px-2.5 py-1.5 font-mono text-[11.5px] text-fg">
                    Iyzico
                  </span>
                  <span className="rounded-[7px] border border-dashed border-line-2 px-2.5 py-1.5 font-mono text-[11.5px] text-fg-dim">
                    PayTR
                  </span>
                  <span className="rounded-[7px] border border-dashed border-line-2 px-2.5 py-1.5 font-mono text-[11.5px] text-fg-dim">
                    Bank VPOS
                  </span>
                </div>
              </div>
              <div className="rounded-[10px] border border-dashed border-line-2 bg-bg p-3">
                <div className="mb-[9px] font-mono text-[10.5px] uppercase tracking-[0.08em] text-fg-faint">
                  Database adapter
                </div>
                <div className="flex flex-wrap gap-[7px]">
                  <span className="rounded-[7px] border border-line px-2.5 py-1.5 font-mono text-[11.5px] text-fg">
                    Supabase
                  </span>
                  <span className="rounded-[7px] border border-line px-2.5 py-1.5 font-mono text-[11.5px] text-fg">
                    Postgres
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-3.5 p-1 text-center font-mono text-[11.5px] text-fg-faint">
          ↓ gateways settle funds to your account
        </div>
      </div>
    </section>
  );
}
