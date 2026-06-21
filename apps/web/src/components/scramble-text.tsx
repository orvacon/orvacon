"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRef } from "react";

gsap.registerPlugin(ScrambleTextPlugin, ScrollTrigger);

export function ScrambleText({
  text,
  className,
  trigger = "hover",
}: {
  text: string;
  className?: string;
  trigger?: "hover" | "view";
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) {
        return;
      }
      const run = () => {
        gsap.to(el, {
          duration: 0.7,
          ease: "none",
          scrambleText: { text, chars: "!<>-_\\/[]{}=+*^?#", speed: 0.6 },
        });
      };
      if (trigger === "view") {
        ScrollTrigger.create({ trigger: el, start: "top 85%", once: true, onEnter: run });
        return;
      }
      const host = el.closest("a, button") ?? el;
      host.addEventListener("mouseenter", run);
      return () => {
        host.removeEventListener("mouseenter", run);
      };
    },
    { scope: ref, dependencies: [text, trigger] },
  );

  return (
    <span className={`relative inline-block ${className ?? ""}`}>
      <span aria-hidden="true" className="invisible">
        {text}
      </span>
      <span ref={ref} aria-label={text} className="absolute inset-0">
        {text}
      </span>
    </span>
  );
}
