"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { type ReactNode, useRef } from "react";

gsap.registerPlugin(ScrollTrigger);

export function ScrollReveal({
  children,
  height = "200vh",
  selector = ".reveal-word",
  stagger = 0.5,
  fromVars = { opacity: 0.16 },
  toVars = { opacity: 1 },
  className,
}: {
  children: ReactNode;
  height?: string;
  selector?: string;
  stagger?: number;
  fromVars?: gsap.TweenVars;
  toVars?: gsap.TweenVars;
  className?: string;
}) {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const targets = root.current?.querySelectorAll(selector);
      if (!targets?.length) {
        return;
      }
      gsap.fromTo(targets, fromVars, {
        ...toVars,
        ease: "none",
        stagger,
        scrollTrigger: {
          trigger: root.current,
          start: "top top",
          end: "bottom bottom",
          scrub: true,
        },
      });
    },
    { scope: root, dependencies: [selector] },
  );

  return (
    <div ref={root} className="relative" style={{ height }}>
      <div className={`sticky top-0 flex h-screen items-center ${className ?? ""}`}>{children}</div>
    </div>
  );
}
