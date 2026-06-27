"use client";

import { createElement, type ReactNode, Suspense, useState } from "react";
import { previews } from "@/__registry__/previews";
import { OpenInV0Button } from "@/components/open-in-v0-button";
import { cn } from "@/lib/utils";

const TABS = ["preview", "code"] as const;
type Tab = (typeof TABS)[number];

/**
 * A component showcase: the live demo on a dotted canvas, toggled with its source.
 * The demo is loaded from the generated registry index by `name`.
 */
export function ComponentPreview({ name, code }: { name: string; code: ReactNode }) {
  const [tab, setTab] = useState<Tab>("preview");
  const Demo = previews[name];

  return (
    <div>
      <div className="mb-3 flex items-center justify-between border-b">
        <div className="flex gap-1">
          {TABS.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setTab(value)}
              className={cn(
                "-mb-px border-b-2 px-3 py-2 text-sm capitalize transition-colors",
                tab === value
                  ? "border-foreground font-medium text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {value}
            </button>
          ))}
        </div>
        <OpenInV0Button name={name} className="mb-1.5" />
      </div>
      {tab === "preview" ? (
        <div className="flex min-h-60 items-center justify-center rounded-lg border bg-[radial-gradient(var(--preview-dot)_1px,transparent_1px)] p-10 [background-size:16px_16px]">
          <Suspense
            fallback={<span className="text-sm text-muted-foreground">Loading preview…</span>}
          >
            {Demo ? (
              createElement(Demo)
            ) : (
              <span className="text-sm text-muted-foreground">No preview available.</span>
            )}
          </Suspense>
        </div>
      ) : (
        code
      )}
    </div>
  );
}
