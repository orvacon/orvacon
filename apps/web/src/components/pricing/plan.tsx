import Link from "next/link";

function Check() {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="var(--accent)"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="mt-0.5 shrink-0"
    >
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

const features = [
  "Every package — paykit, connectors, adapters, cryptokit, CLI",
  "The verified Iyzico 3-D Secure flow",
  "Ed25519 webhooks, hash-chained ledger, default-deny RLS",
  "Source on GitHub — read, fork, and self-host",
];

export function Plan() {
  return (
    <section className="px-[clamp(24px,3.4vw,46px)] pb-[84px]">
      <div className="relative mx-auto max-w-[560px] overflow-hidden rounded-[20px] border-[1.5px] border-[var(--accent-line)] bg-bg-2">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-50 [background-image:radial-gradient(circle,color-mix(in_srgb,var(--accent)_16%,transparent)_1px,transparent_1.2px)] [background-size:14px_14px] [mask-image:linear-gradient(180deg,#000,transparent_55%)]"
        />
        <div className="relative z-[2] px-8 py-[34px]">
          <div className="flex items-center justify-between gap-3">
            <span className="font-mono text-[12px] uppercase tracking-[0.12em] text-accent">
              Community
            </span>
            <span className="inline-flex items-center rounded-full border border-line-2 px-2.5 py-[3px] font-mono text-[11px] text-fg">
              MIT License
            </span>
          </div>
          <div className="mt-[18px] flex items-baseline gap-2.5">
            <span className="text-[64px] font-semibold leading-none tracking-[-0.04em]">$0</span>
            <span className="text-[15px] text-fg-dim">/ self-hosted</span>
          </div>
          <p className="mt-3.5 text-[14.5px] leading-[1.55] text-fg-dim">
            No per-transaction fee, no seats, no usage metering. You run it; you pay nothing to us.
          </p>
          <div className="mt-6 flex flex-col gap-2.5">
            {features.map((feature) => (
              <div key={feature} className="flex items-start gap-2.5 text-[14.5px] text-fg">
                <Check />
                {feature}
              </div>
            ))}
          </div>
          <div className="mt-[26px] flex flex-wrap gap-3">
            <Link
              href="/docs/get-started"
              className="inline-flex items-center gap-2 rounded-[10px] bg-accent px-5 py-3 text-[14.5px] font-semibold text-white shadow-[0_10px_24px_-12px_var(--accent)] transition hover:-translate-y-px hover:brightness-[1.07]"
            >
              Get started
            </Link>
            <a
              href="https://github.com/orvacon/orvacon"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-[10px] border border-line bg-bg-3 px-[18px] py-3 text-[14.5px] font-medium text-fg transition-colors hover:border-line-2"
            >
              View on GitHub
            </a>
          </div>
        </div>
      </div>
      <p className="mx-auto mt-[18px] max-w-[54ch] text-center text-[13px] leading-[1.55] text-fg-faint">
        No credit card, no sign-up, no license key.{" "}
        <span className="font-mono text-fg-dim">bun add @orvacon/paykit</span> and you're running.
      </p>
    </section>
  );
}
