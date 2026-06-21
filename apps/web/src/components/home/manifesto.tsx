import { ScrollReveal } from "@/components/scroll-reveal";

const line = "No held money. No hidden service. Just type-safe code, running in your own runtime.";
const words = line.split(" ").map((word, index) => ({ id: `m${index}`, word }));

export function Manifesto() {
  return (
    <section className="border-t border-dashed border-[var(--guide)]">
      <ScrollReveal className="px-[clamp(24px,3.4vw,46px)]">
        <p className="m-0 max-w-[18ch] text-[clamp(32px,5vw,64px)] font-semibold leading-[1.06] tracking-[-0.035em] text-fg">
          {words.map((entry) => (
            <span key={entry.id} className="reveal-word">
              {entry.word}{" "}
            </span>
          ))}
        </p>
      </ScrollReveal>
    </section>
  );
}
