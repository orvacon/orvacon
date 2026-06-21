import Link from "next/link";

export function CTA() {
  return (
    <section className="relative overflow-hidden border-t border-[#1e1e24] bg-[#08080a]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-[6%] h-[82%] w-[80%] -translate-x-1/2 blur-[22px] [background:radial-gradient(50%_55%_at_50%_38%,color-mix(in_srgb,var(--accent)_34%,transparent),transparent_70%)]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-50 [background-image:radial-gradient(circle,rgba(255,255,255,0.05)_1px,transparent_1.3px)] [background-size:11px_11px] [mask-image:radial-gradient(60%_60%_at_50%_40%,#000,transparent_75%)]"
      />
      <div className="relative z-[2] mx-auto max-w-[760px] px-7 pb-[124px] pt-[118px] text-center">
        <div className="font-mono text-[11.5px] uppercase tracking-[0.18em] text-white/60">
          MIT · v0.1 · Running in your own runtime
        </div>
        <h2 className="mt-5 bg-[linear-gradient(180deg,#ffffff_28%,#6e6e78_100%)] bg-clip-text text-[clamp(34px,5.4vw,68px)] font-semibold leading-[1.02] tracking-[-0.038em] text-transparent">
          Build payments without
          <br />
          the glue code.
        </h2>
        <p className="mx-auto mt-5 max-w-[52ch] text-[17px] leading-[1.58] text-white/60">
          Wire up one type-safe API, keep money custody with your own gateway, and ship the verified
          Iyzico 3-D Secure flow today.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/#start"
            className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-[14.5px] font-semibold text-[#0b0b0c] transition hover:-translate-y-px"
          >
            Get started
          </Link>
          <a
            href="https://github.com/orvacon/orvacon"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-white/30 px-[22px] py-3 text-[14.5px] font-medium text-white transition-colors hover:bg-white/10"
          >
            View on GitHub
          </a>
        </div>
      </div>
    </section>
  );
}
