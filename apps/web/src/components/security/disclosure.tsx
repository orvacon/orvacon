import { CopyButton } from "@/components/copy-button";
import { ArrowRight } from "@/components/icons";
import { Sym } from "@/components/security/parts";

export function Disclosure() {
  return (
    <section className="border-t border-dashed border-[var(--guide)] px-[clamp(24px,3.4vw,46px)] py-[84px]">
      <div className="grid grid-cols-[repeat(auto-fit,minmax(340px,1fr))] items-start gap-x-12 gap-y-10">
        <div className="min-w-0">
          <div className="orv-eyebrow">05 — Responsible disclosure</div>
          <h2 className="mt-4 max-w-[15ch] text-[clamp(26px,3.4vw,42px)] font-semibold leading-[1.08] tracking-[-0.03em]">
            Found something? Tell us privately.
          </h2>
          <p className="mt-4 max-w-[48ch] text-[16.5px] leading-[1.62] text-fg-dim">
            orvacon is v0.1 and the API is still 0.x. If you find a vulnerability, please report it
            through the security policy rather than a public issue — we'll coordinate a fix and
            disclosure.
          </p>
          <div className="mt-[26px] flex flex-wrap gap-3">
            <a
              href="https://github.com/orvacon/orvacon/security/policy"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-[9px] bg-accent px-[18px] py-[11px] text-[14.5px] font-medium text-white shadow-[0_10px_24px_-12px_var(--accent)] transition hover:-translate-y-px hover:brightness-[1.07]"
            >
              Read the security policy
              <ArrowRight className="h-4 w-4" />
            </a>
            <a
              href="https://github.com/orvacon/orvacon/security/advisories"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-[9px] border border-line px-4 py-[11px] text-[14.5px] text-fg transition-colors hover:border-line-2"
            >
              Report an advisory
            </a>
          </div>
        </div>

        <div className="min-w-0">
          <div className="overflow-hidden rounded-[12px] border border-[#26262a] bg-[#161618]">
            <div className="flex items-center justify-between border-b border-[#232327] bg-[#0f0f11] px-3.5 py-2.5">
              <span className="font-mono text-[12px] text-[#8c8c86]">rotate signing keys</span>
              <CopyButton text="npx orvacon keys" />
            </div>
            <pre className="m-0 overflow-x-auto px-4 py-[15px] font-mono text-[12.5px] leading-[1.8] text-[#c9c7bf]">
              <code>
                <span className="text-[#8a8a86]">$</span> npx orvacon{" "}
                <span className="text-[#74a7f5]">keys</span>
                {"   "}
                <span className="text-[#6a6a72]">{"# generates an Ed25519 keypair"}</span>
                {"\n"}
                <span className="text-[#6a6a72]">{"# prints ORVACON_WEBHOOK_SIGNING_KEY=…"}</span>
                {"\n"}
                <span className="text-[#6a6a72]">
                  {"# set it in your environment, never commit it"}
                </span>
              </code>
            </pre>
          </div>
          <div className="mt-3.5 flex items-start gap-3 rounded-[11px] border border-line bg-bg-2 px-4 py-3.5">
            <Sym size={16} className="mt-px shrink-0 text-fg-dim">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 8h.01M11 12h1v4h1" />
            </Sym>
            <p className="m-0 text-[13px] leading-[1.55] text-fg-dim">
              Rotating a key is config-only — no redeploy of application logic. The public
              verification key can be distributed freely.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
