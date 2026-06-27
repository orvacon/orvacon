"use client";

import { CopyButton } from "@/components/copy-button";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { cn } from "@/lib/utils";

const MANAGERS = ["npm", "pnpm", "yarn", "bun"] as const;
type Manager = (typeof MANAGERS)[number];

/** Client half of {@link Command}: the npm/pnpm/yarn/bun tabs over pre-highlighted commands. */
export function CommandSwitcher({
  commands,
  highlighted,
  className,
}: {
  commands: Record<Manager, string>;
  highlighted: Record<Manager, string>;
  className?: string;
}) {
  const [stored, setManager] = useLocalStorage<Manager>("orvacon-pm", "npm");
  const active = MANAGERS.includes(stored) ? stored : "npm";

  return (
    <div className={cn("overflow-hidden rounded-lg border bg-muted/40", className)}>
      <div className="flex items-center justify-between border-b bg-muted/60 pr-1.5">
        <div className="flex">
          {MANAGERS.map((manager) => (
            <button
              key={manager}
              type="button"
              onClick={() => setManager(manager)}
              className={cn(
                "border-b-2 px-3 py-2 font-mono text-xs transition-colors",
                active === manager
                  ? "border-foreground text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {manager}
            </button>
          ))}
        </div>
        <CopyButton value={commands[active]} />
      </div>
      <div
        className="code-block overflow-x-auto"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: trusted build-time Shiki output
        dangerouslySetInnerHTML={{ __html: highlighted[active] }}
      />
    </div>
  );
}
