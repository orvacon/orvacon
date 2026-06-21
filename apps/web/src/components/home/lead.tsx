import { ScrollReveal } from "@/components/scroll-reveal";

const lead =
  "One clean API. Any gateway. Connectors plug in behind a single type-safe interface — so your application code never knows which gateway is handling a payment. Swap or add one by changing configuration, not logic.";

const words = lead.split(" ").map((word, index) => ({ id: `w${index}`, word }));

export function Lead() {
  return (
    <section className="border-t border-dashed border-[var(--guide)]">
      <ScrollReveal className="px-[clamp(24px,3.4vw,46px)]">
        <h2 className="m-0 max-w-[26ch] text-[clamp(28px,3.8vw,52px)] font-semibold leading-[1.2] tracking-[-0.03em] text-fg">
          {words.map((entry) => (
            <span key={entry.id} className="reveal-word">
              {entry.word}{" "}
            </span>
          ))}
        </h2>
      </ScrollReveal>
    </section>
  );
}
