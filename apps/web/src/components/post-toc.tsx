"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";

type TocItem = { title: ReactNode; url: string; depth: number };

export function PostToc({ items }: { items: TocItem[] }) {
  const [active, setActive] = useState("");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActive(`#${entry.target.id}`);
          }
        }
      },
      { rootMargin: "0px 0px -75% 0px" },
    );
    for (const item of items) {
      const el = document.getElementById(item.url.slice(1));
      if (el) {
        observer.observe(el);
      }
    }
    return () => observer.disconnect();
  }, [items]);

  return (
    <nav className="flex flex-col border-l border-line text-[13px] leading-[1.4]">
      {items.map((item) => (
        <a
          key={item.url}
          href={item.url}
          className={`-ml-px border-l-2 py-1 transition-colors ${
            active === item.url
              ? "border-accent text-accent"
              : "border-transparent text-fg-dim hover:text-fg"
          }`}
          style={{ paddingLeft: `${Math.max(item.depth - 2, 0) * 12 + 16}px` }}
        >
          {item.title}
        </a>
      ))}
    </nav>
  );
}
