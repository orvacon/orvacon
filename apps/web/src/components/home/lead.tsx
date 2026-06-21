"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRef } from "react";

gsap.registerPlugin(ScrollTrigger);

const lead =
  "One clean API. Any gateway. Connectors plug in behind a single type-safe interface — so your application code never knows which gateway is handling a payment. Swap or add one by changing configuration, not logic.";

const words = lead.split(" ").map((word, index) => ({ id: `w${index}`, word }));

export function Lead() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      gsap.fromTo(
        ".lead-word",
        { opacity: 0.16 },
        {
          opacity: 1,
          ease: "none",
          stagger: 0.5,
          scrollTrigger: {
            trigger: root.current,
            start: "top top",
            end: "bottom bottom",
            scrub: true,
          },
        },
      );
    },
    { scope: root },
  );

  return (
    <section ref={root} className="relative h-[200vh] border-t border-dashed border-[var(--guide)]">
      <div className="sticky top-0 flex h-screen items-center px-[30px]">
        <h2 className="m-0 max-w-[26ch] text-[clamp(28px,3.8vw,52px)] font-semibold leading-[1.2] tracking-[-0.03em] text-fg">
          {words.map((entry) => (
            <span key={entry.id} className="lead-word">
              {entry.word}{" "}
            </span>
          ))}
        </h2>
      </div>
    </section>
  );
}
