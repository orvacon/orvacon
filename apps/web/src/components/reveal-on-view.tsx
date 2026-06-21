"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { type ReactNode, useRef } from "react";

gsap.registerPlugin(ScrollTrigger);

export function RevealOnView({
  children,
  className,
  selector = ":scope > *",
  y = 16,
  stagger = 0.08,
}: {
  children: ReactNode;
  className?: string;
  selector?: string;
  y?: number;
  stagger?: number;
}) {
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const targets = root.current?.querySelectorAll(selector);
      if (!targets?.length) {
        return;
      }
      gsap.from(targets, {
        opacity: 0,
        y,
        duration: 0.5,
        ease: "power2.out",
        stagger,
        scrollTrigger: { trigger: root.current, start: "top 82%", once: true },
      });
    },
    { scope: root, dependencies: [selector] },
  );

  return (
    <div ref={root} className={className}>
      {children}
    </div>
  );
}
