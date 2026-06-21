const operations = [
  { fn: "authorize", note: "begin a payment" },
  { fn: "finalize", note: "complete the 3DS challenge" },
  { fn: "capture", note: "settle authorized funds" },
  { fn: "refund", note: "reverse a captured payment" },
  { fn: "reconcile", note: "match gateway state to the ledger" },
];

export function Contract() {
  return (
    <section className="border-t border-dashed border-[var(--guide)] px-[30px] py-[84px]">
      <div className="grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] items-start gap-x-14 gap-y-[30px]">
        <div className="min-w-0">
          <div className="orv-eyebrow">03 — The contract</div>
          <h2 className="mt-4 max-w-[15ch] text-[clamp(26px,3.4vw,42px)] font-semibold leading-[1.08] tracking-[-0.03em]">
            Every connector, the same shape.
          </h2>
          <p className="mt-4 max-w-[48ch] text-[16.5px] leading-[1.62] text-fg-dim">
            A connector implements one set of operations. The orchestrator handles state, money
            typing, idempotency and signing around them — so a connector only has to map calls to
            its gateway.
          </p>
          <div className="mt-[26px] flex flex-wrap gap-3">
            <a
              href="https://github.com/orvacon/orvacon"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-[9px] bg-accent px-[18px] py-[11px] text-[14.5px] font-medium text-white shadow-[0_10px_24px_-12px_var(--accent)] transition hover:-translate-y-px hover:brightness-[1.07]"
            >
              Write a connector →
            </a>
            <span className="inline-flex items-center gap-2 rounded-[9px] border border-line px-4 py-[11px] text-[14.5px] text-fg-dim">
              Docs
              <span className="rounded border border-line px-1.5 py-px font-mono text-[10px] text-fg-faint">
                soon
              </span>
            </span>
          </div>
        </div>
        <div className="min-w-0">
          <div className="overflow-hidden rounded-[13px] border border-[#26262a] bg-[#161618]">
            <div className="flex items-center border-b border-[#232327] bg-[#0f0f11] px-3.5 py-[11px]">
              <span className="font-mono text-[12px] text-[#8c8c86]">connector contract</span>
            </div>
            <div className="p-1.5">
              {operations.map((op, i) => (
                <div
                  key={op.fn}
                  className={`flex items-center justify-between gap-2.5 px-3.5 py-[11px] font-mono text-[13px] ${
                    i > 0 ? "border-t border-[#1e1e22]" : ""
                  }`}
                >
                  <span className="text-[#74a7f5]">{op.fn}</span>
                  <span className="text-[12px] text-[#6a6a72]">{op.note}</span>
                </div>
              ))}
            </div>
          </div>
          <p className="mx-0.5 mt-3 text-[13px] leading-[1.55] text-fg-faint">
            Implement these against a gateway and it drops into any orvacon app.
          </p>
        </div>
      </div>
    </section>
  );
}
