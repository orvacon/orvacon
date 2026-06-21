"use client";

import { useEffect, useState } from "react";

type Release = { version: string; tag?: string };

export function ChangelogNav({ releases }: { releases: Release[] }) {
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

  return (
    <nav className="flex flex-col gap-0.5">
      {releases.map((release) => (
        <a
          key={release.version}
          href={`#v${release.version}`}
          className={`flex items-center justify-between gap-2 rounded-md px-2.5 py-1.5 font-mono text-[12.5px] transition-colors ${
            active === release.version
              ? "bg-bg-2 text-accent"
              : "text-fg-dim hover:bg-bg-2 hover:text-fg"
          }`}
        >
          <span>v{release.version}</span>
          {release.tag ? <span className="text-[10px] text-fg-faint">{release.tag}</span> : null}
        </a>
      ))}
    </nav>
  );
}
