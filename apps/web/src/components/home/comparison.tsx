import { Check } from "./decor";

const wins = [
  "Same call across every connector",
  "Money stays integer minor units",
  "3DS persisted; finalize signature verified",
  "Idempotent by construction",
];

export function Comparison() {
  return (
    <section className="border-t border-dashed border-[var(--guide)] px-[30px] py-[88px]">
      <div className="mb-[42px] grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] items-start gap-x-14 gap-y-[30px]">
        <div className="min-w-0">
          <div className="orv-eyebrow">02 — The difference</div>
          <h2 className="mt-4 max-w-[14ch] text-[clamp(28px,3.6vw,44px)] font-semibold leading-[1.08] tracking-[-0.03em]">
            Glue code, or a clean boundary.
          </h2>
        </div>
        <div className="flex h-full min-w-0 items-end">
          <p className="m-0 max-w-[50ch] text-[16.5px] leading-[1.62] text-fg-dim">
            The same payment, two ways. The hard parts of payments don't have to leak into your
            application code.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(340px,1fr))] items-stretch gap-[18px]">
        <div className="flex flex-col overflow-hidden rounded-2xl border border-line bg-bg-2">
          <div className="flex items-center gap-2.5 border-b border-line px-5 py-4">
            <span className="h-2 w-2 rounded-full bg-[#d8674e]" />
            <span className="font-mono text-[12px] uppercase tracking-[0.06em] text-fg-dim">
              Before · gateway-specific glue
            </span>
          </div>
          <div className="flex-1 p-2">
            <pre className="m-0 h-full overflow-x-auto rounded-[10px] bg-[#161618] p-4 font-mono text-[12px] leading-[1.85] text-[#9c9a92]">
              <code>
                <span className="text-[#b69bf0]">if</span>
                {" (provider === "}
                <span className="text-[#9fce7e]">"iyzico"</span>
                {") {"}
                {"\n"}
                {"  "}
                <span className="text-[#6a6a72]">{"// sign, map fields, 3DS dance…"}</span>
                {"\n"}
                {"} "}
                <span className="text-[#b69bf0]">else if</span>
                {" (provider === "}
                <span className="text-[#9fce7e]">"paytr"</span>
                {") {"}
                {"\n"}
                {"  "}
                <span className="text-[#6a6a72]">{"// a totally different shape"}</span>
                {"\n"}
                {"}"}
                {"\n"}
                <span className="text-[#d8674e]">total</span>
                {" = amount "}
                <span className="text-[#e89a6c]">*</span>{" "}
                <span className="text-[#e89a6c]">1.18</span>
                {"; "}
                <span className="text-[#6a6a72]">{"// float drift"}</span>
                {"\n"}
                <span className="text-[#6a6a72]">{"// verify the callback? trust the POST"}</span>
                {"\n"}
                {"verifyWebhook(req.body); "}
                <span className="text-[#d8674e]">{"// shared secret"}</span>
              </code>
            </pre>
          </div>
        </div>

        <div className="relative flex flex-col overflow-hidden rounded-2xl bg-[linear-gradient(170deg,var(--accent-2),var(--accent))] shadow-[0_30px_70px_-45px_var(--accent)]">
          <div
            aria-hidden="true"
            className="absolute inset-0 opacity-50 [background-image:radial-gradient(circle,rgba(255,255,255,0.1)_1px,transparent_1.2px)] [background-size:9px_9px]"
          />
          <div className="relative z-[2] flex items-center gap-2.5 border-b border-white/20 px-5 py-4">
            <span className="h-2 w-2 rounded-full bg-white" />
            <span className="font-mono text-[12px] uppercase tracking-[0.06em] text-white">
              With orvacon
            </span>
          </div>
          <div className="relative z-[2] flex flex-1 flex-col p-[22px]">
            <pre className="m-0 overflow-x-auto rounded-[10px] border border-white/20 bg-black/20 px-4 py-[15px] font-mono text-[12.5px] leading-[1.8] text-white">
              <code>
                <span className="text-white/60">{"// one shape, every gateway"}</span>
                {"\n"}
                <span className="text-[#d9c9ff]">const</span>
                {" result = "}
                <span className="text-[#d9c9ff]">await</span>
                {" orva.authorize(order);"}
              </code>
            </pre>
            <div className="mt-[18px] flex flex-col gap-[11px]">
              {wins.map((line) => (
                <div key={line} className="flex items-center gap-2.5 text-[13.5px] text-white">
                  <Check className="shrink-0 text-white" />
                  {line}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
