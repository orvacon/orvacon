"use client";

import { type ReactNode, useState } from "react";
import { cn } from "@/lib/utils";

export interface TabItem {
  value: string;
  label: string;
  content: ReactNode;
}

export function Tabs({ items, className }: { items: TabItem[]; className?: string }) {
  const [active, setActive] = useState(items[0]?.value);
  const current = items.find((item) => item.value === active) ?? items[0];

  return (
    <div className={className}>
      <div className="flex gap-1 border-b">
        {items.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => setActive(item.value)}
            className={cn(
              "-mb-px border-b-2 px-3 py-2 text-sm transition-colors",
              active === item.value
                ? "border-foreground font-medium text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="pt-4">{current?.content}</div>
    </div>
  );
}
