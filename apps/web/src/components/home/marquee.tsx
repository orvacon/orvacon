"use client";

import { motion, useAnimationFrame, useMotionValue } from "motion/react";
import { useRef, useState } from "react";

const items = [
  "Provider-agnostic",
  "TypeScript-first",
  "Never holds money",
  "Runs in your runtime",
  "MIT licensed",
  "Ed25519-signed webhooks",
  "Integer minor units",
  "Bring your own database",
  "Default-deny RLS",
  "Hash-chained ledger",
  "Timing-safe crypto",
  "Idempotent by construction",
];

const track = [
  ...items.map((label) => ({ id: `a-${label}`, label })),
  ...items.map((label) => ({ id: `b-${label}`, label })),
];

export function Marquee() {
  const x = useMotionValue(0);
  const trackRef = useRef<HTMLDivElement>(null);
  const factor = useRef(1);
  const [paused, setPaused] = useState(false);

  useAnimationFrame((_time, delta) => {
    const node = trackRef.current;
    if (!node) {
      return;
    }
    const half = node.scrollWidth / 2;
    if (half === 0) {
      return;
    }
    // Ease the speed factor toward the target so hover stops and starts smoothly.
    const targetFactor = paused ? 0 : 1;
    factor.current += (targetFactor - factor.current) * Math.min(1, delta / 280);
    let next = x.get() - (40 * factor.current * delta) / 1000;
    if (next <= -half) {
      next += half;
    }
    x.set(next);
  });

  return (
    <section
      onPointerEnter={() => setPaused(true)}
      onPointerLeave={() => setPaused(false)}
      className="overflow-hidden border-t border-dashed border-[var(--guide)] py-5"
    >
      <motion.div
        ref={trackRef}
        style={{ x }}
        className="pointer-events-none flex w-max select-none items-center gap-7"
      >
        {track.map((entry) => (
          <span
            key={entry.id}
            className="flex items-center gap-7 whitespace-nowrap font-mono text-[12px] uppercase tracking-[0.08em] text-fg-faint"
          >
            {entry.label}
            <span aria-hidden="true" className="text-line-2">
              /
            </span>
          </span>
        ))}
      </motion.div>
    </section>
  );
}
