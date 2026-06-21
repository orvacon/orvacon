import { OverviewTabs } from "./overview-tabs";

export function Overview() {
  return (
    <section className="border-t border-dashed border-[var(--guide)] px-[clamp(24px,3.4vw,46px)] py-[88px]">
      <div className="mb-[42px] grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] items-start gap-x-14 gap-y-[30px]">
        <div className="min-w-0">
          <div className="orv-eyebrow">01 — Overview</div>
          <h2 className="mt-4 max-w-[16ch] text-[clamp(28px,3.6vw,44px)] font-semibold leading-[1.08] tracking-[-0.03em]">
            Your code shouldn't know the gateway.
          </h2>
        </div>
        <div className="flex h-full min-w-0 items-end">
          <p className="m-0 max-w-[52ch] text-[16.5px] leading-[1.62] text-fg-dim">
            You've written gateway-specific glue before — branching on provider, mapping error
            codes, re-implementing 3-D Secure for each one. orvacon moves that surface area behind a
            connector boundary.
          </p>
        </div>
      </div>

      <OverviewTabs />
    </section>
  );
}
