"use client";

import type { ReactNode } from "react";
import { useLocalStorage } from "@/hooks/use-local-storage";

export interface UsageFramework {
  id: string;
  label: string;
  node: ReactNode;
}

/** A framework selector over pre-highlighted usage snippets; the choice persists. */
export function UsageTabs({ frameworks }: { frameworks: UsageFramework[] }) {
  const [stored, setStored] = useLocalStorage("orvacon-framework", frameworks[0]?.id ?? "");
  const active = frameworks.find((framework) => framework.id === stored) ?? frameworks[0];

  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <label htmlFor="usage-framework" className="text-xs text-muted-foreground">
          Framework
        </label>
        <select
          id="usage-framework"
          value={active?.id}
          onChange={(event) => setStored(event.target.value)}
          className="rounded-md border bg-background px-2 py-1 text-sm transition-colors hover:bg-accent"
        >
          {frameworks.map((framework) => (
            <option key={framework.id} value={framework.id}>
              {framework.label}
            </option>
          ))}
        </select>
      </div>
      {active?.node}
    </div>
  );
}
