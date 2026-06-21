import { CrossIcon } from "@/components/icons";

const cases = [
  {
    id: "marketplace",
    title: "Marketplaces with split payouts",
    desc: "Paying out many sellers from one charge needs fund custody and split settlement — orvacon doesn't hold balances, so it can't split them.",
  },
  {
    id: "wallets",
    title: "Wallets & stored balances",
    desc: "Holding customer balances is money custody and the regulation that comes with it. That's explicitly out of scope.",
  },
  {
    id: "platform",
    title: "A full e-commerce platform",
    desc: "No catalog, cart, inventory, or storefront. orvacon handles the payment, not the shop around it.",
  },
];

export function NotFit() {
  return (
    <section className="border-t border-dashed border-[var(--guide)] px-[30px] py-[84px]">
      <div className="mb-2.5 font-mono text-[11.5px] uppercase tracking-[0.16em] text-[#e08a72]">
        Not the right fit
      </div>
      <h2 className="mb-4 max-w-[18ch] text-[clamp(26px,3.4vw,42px)] font-semibold leading-[1.08] tracking-[-0.03em]">
        Where you'd want something else.
      </h2>
      <p className="mb-9 max-w-[56ch] text-[16px] leading-[1.6] text-fg-dim">
        orvacon never custodies money. Anything that depends on holding, splitting, or moving other
        people's funds needs a different category of tool.
      </p>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-px border border-[var(--guide)] bg-[var(--guide)]">
        {cases.map((item) => (
          <div key={item.id} className="bg-bg px-6 py-[26px]">
            <div className="mb-3 flex items-center gap-2.5">
              <CrossIcon className="h-[17px] w-[17px] shrink-0 text-[#e08a72]" />
              <h3 className="text-[15.5px] font-semibold">{item.title}</h3>
            </div>
            <p className="text-[13.5px] leading-[1.55] text-fg-dim">{item.desc}</p>
          </div>
        ))}
      </div>
      <div className="mt-[18px] flex items-start gap-3 rounded-[12px] border border-line bg-bg-2 px-[18px] py-4">
        <svg
          width="17"
          height="17"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--text-dim)"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className="mt-0.5 shrink-0"
        >
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8h.01M11 12h1v4h1" />
        </svg>
        <p className="m-0 text-[14px] leading-[1.6] text-fg-dim">
          Unsure if your case fits? It's a good sign if money flows straight from the cardholder to{" "}
          <span className="text-fg">your own</span> gateway account. If you need to hold or
          redistribute other people's money, look at a payment facilitator instead.
        </p>
      </div>
    </section>
  );
}
