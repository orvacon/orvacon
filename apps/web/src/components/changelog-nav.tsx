"use client";

import { useEffect, useState } from "react";

type Release = { version: string; tag?: string };

export function ChangelogNav({
  releases,
  orientation = "vertical",
}: {
  releases: Release[];
  orientation?: "vertical" | "horizontal";
}) {
  const [active, setActive] = useState(releases[0]?.version);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActive(entry.target.id.replace(/^v/, ""));
          }
        }
      },
      { rootMargin: "-20% 0px -72% 0px" },
    );
    for (const release of releases) {
      const el = document.getElementById(`v${release.version}`);
      if (el) {
        observer.observe(el);
      }
    }
    return () => observer.disconnect();
  }, [releases]);

  const horizontal = orientation === "horizontal";

  return (
    <nav
      className={
        horizontal ? "-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1" : "flex flex-col gap-0.5"
      }
    >
      {releases.map((release) => {
        const isActive = active === release.version;
        return (
          <a
            key={release.version}
            href={`#v${release.version}`}
            className={
              horizontal
                ? `shrink-0 whitespace-nowrap rounded-full border px-3 py-1 font-mono text-[12px] transition-colors ${
                    isActive
                      ? "border-[var(--accent-line)] bg-[var(--accent-soft)] text-accent"
                      : "border-line text-fg-dim"
                  }`
                : `flex items-center justify-between gap-2 rounded-md px-2.5 py-1.5 font-mono text-[12.5px] transition-colors ${
                    isActive ? "bg-bg-2 text-accent" : "text-fg-dim hover:bg-bg-2 hover:text-fg"
                  }`
            }
          >
            <span>v{release.version}</span>
            {!horizontal && release.tag ? (
              <span className="text-[10px] text-fg-faint">{release.tag}</span>
            ) : null}
          </a>
        );
      })}
    </nav>
  );
}
