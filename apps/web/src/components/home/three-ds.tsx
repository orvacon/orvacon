import { ThreeDSFlow } from "./three-ds-flow";

export function ThreeDS() {
  return (
    <section
      id="3ds"
      className="border-t border-dashed border-[var(--guide)] px-[clamp(24px,3.4vw,46px)] py-[88px]"
    >
      <div className="mb-[42px] grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] items-start gap-x-14 gap-y-[30px]">
        <div className="min-w-0">
          <div className="orv-eyebrow">04 — 3-D Secure</div>
          <h2 className="mt-4 max-w-[15ch] text-[clamp(28px,3.6vw,44px)] font-semibold leading-[1.08] tracking-[-0.03em]">
            Stateful 3-D Secure, orchestrated.
          </h2>
        </div>
        <div className="flex h-full min-w-0 items-end">
          <p className="m-0 max-w-[52ch] text-[16.5px] leading-[1.62] text-fg-dim">
            3DS is two requests plus a browser wait. orvacon persists the in-between as{" "}
            <span className="font-mono text-[13px] text-fg">requires_action</span>, and trusts the
            signed <span className="font-mono text-[13px] text-fg">finalize</span> response — never
            the raw callback POST.
          </p>
        </div>
      </div>

      <ThreeDSFlow />
    </section>
  );
}
