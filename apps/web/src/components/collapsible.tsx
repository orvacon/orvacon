"use client";

import { type ReactNode, useLayoutEffect, useRef, useState } from "react";

export function Collapsible({ children, max = 280 }: { children: ReactNode; max?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [full, setFull] = useState(0);
  const [expanded, setExpanded] = useState(false);

  useLayoutEffect(() => {
    if (ref.current) {
      setFull(ref.current.scrollHeight);
    }
  }, []);

  const overflowing = full > max;

  return (
    <div>
      <div
        className="relative overflow-hidden transition-[max-height] duration-[350ms] ease-[cubic-bezier(0.32,0.72,0,1)]"
        style={{ maxHeight: expanded ? full : max }}
      >
        <div ref={ref}>{children}</div>
        {overflowing && !expanded ? (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-bg-2 to-transparent" />
        ) : null}
      </div>
      {overflowing ? (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="flex w-full items-center justify-center gap-1.5 border-t border-line py-2.5 font-mono text-[12px] text-accent transition-colors hover:bg-bg-3"
        >
          {expanded ? "Show less" : "Show more"}
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className={`transition-transform duration-300 ${expanded ? "rotate-180" : ""}`}
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
      ) : null}
    </div>
  );
}
