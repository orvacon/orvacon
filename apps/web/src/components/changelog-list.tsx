"use client";

import { type ReactNode, useMemo, useState } from "react";
import { ChangelogNav } from "@/components/changelog-nav";
import { Collapsible } from "@/components/collapsible";

type Item = { version: string; tag?: string; date: string; content: ReactNode };

function FilterPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1 font-mono text-[12px] transition-colors ${
        active
          ? "border-[var(--accent-line)] bg-[var(--accent-soft)] text-accent"
          : "border-line text-fg-dim hover:border-line-2 hover:text-fg"
      }`}
    >
      {children}
    </button>
  );
}

export function ChangelogList({ items }: { items: Item[] }) {
  const tags = useMemo(() => {
    const set = new Set<string>();
    for (const item of items) {
      if (item.tag) {
        set.add(item.tag);
      }
    }
    return [...set];
  }, [items]);

  const [filter, setFilter] = useState<string | null>(null);
  const visible = filter ? items.filter((item) => item.tag === filter) : items;
  const navReleases = visible.map((item) => ({ version: item.version, tag: item.tag }));

  return (
    <div className="grid gap-10 lg:grid-cols-[180px_1fr]">
      <aside className="hidden lg:block">
        <div className="sticky top-[84px]">
          <div className="orv-eyebrow mb-3.5">Releases</div>
          <ChangelogNav releases={navReleases} />
        </div>
      </aside>
      <div className="min-w-0">
        <div className="mb-5 lg:hidden">
          <div className="orv-eyebrow mb-2.5">Releases</div>
          <ChangelogNav releases={navReleases} orientation="horizontal" />
        </div>
        {tags.length > 0 ? (
          <div className="mb-6 flex flex-wrap gap-2">
            <FilterPill active={filter === null} onClick={() => setFilter(null)}>
              All
            </FilterPill>
            {tags.map((tag) => (
              <FilterPill key={tag} active={filter === tag} onClick={() => setFilter(tag)}>
                {tag}
              </FilterPill>
            ))}
          </div>
        ) : null}
        <div className="flex flex-col gap-7">
          {visible.map((item) => (
            <div
              key={item.version}
              id={`v${item.version}`}
              className="scroll-mt-[84px] overflow-hidden rounded-2xl border border-line bg-bg-2"
            >
              <div className="flex flex-wrap items-center gap-3 border-b border-line px-6 py-4">
                <span className="rounded-md bg-[var(--accent-soft)] px-2.5 py-1 font-mono text-[13px] text-accent">
                  v{item.version}
                </span>
                {item.tag ? (
                  <span className="rounded border border-line px-2 py-0.5 font-mono text-[11px] text-fg-faint">
                    {item.tag}
                  </span>
                ) : null}
                <span className="ml-auto font-mono text-[12px] text-fg-faint">{item.date}</span>
              </div>
              <Collapsible>{item.content}</Collapsible>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
