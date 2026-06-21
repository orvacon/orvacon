export function Lead() {
  return (
    <section className="border-t border-dashed border-[var(--guide)] px-[30px] py-[90px]">
      <h2 className="m-0 max-w-[24ch] text-[clamp(28px,3.7vw,46px)] font-semibold leading-[1.12] tracking-[-0.03em]">
        <span className="text-fg">One clean API. Any gateway. </span>
        <span className="text-fg-faint">
          Connectors plug in behind a single type-safe interface, so your application code never
          knows which gateway is handling a payment — swap or add one by changing configuration, not
          logic.
        </span>
      </h2>
    </section>
  );
}
