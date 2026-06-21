"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ThemeToggle } from "./theme-toggle";

const links = [
  { label: "Architecture", href: "/architecture" },
  { label: "Connectors", href: "/connectors" },
  { label: "Security", href: "/security" },
  { label: "Pricing", href: "/pricing" },
  { label: "Use cases", href: "/use-cases" },
  { label: "Roadmap", href: "/roadmap" },
];

export function MobileMenu() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="flex items-center gap-1.5 md:hidden">
      {open ? null : (
        <Link
          href="/#start"
          className="inline-flex items-center rounded-lg bg-accent px-3.5 py-2 text-[13.5px] font-medium text-white transition hover:brightness-110"
        >
          Get started
        </Link>
      )}
      <button
        type="button"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="flex h-9 w-9 items-center justify-center rounded-[7px] text-fg-dim transition-colors hover:bg-bg-2 hover:text-fg"
      >
        <svg
          width="19"
          height="19"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          {open ? <path d="M18 6 6 18M6 6l12 12" /> : <path d="M3 6h18M3 12h18M3 18h18" />}
        </svg>
      </button>
      {open ? (
        <div className="fixed inset-x-0 bottom-0 top-[62px] z-50 overflow-y-auto bg-bg px-5 pb-10 pt-2">
          <nav className="flex flex-col">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="border-b border-line py-4 text-[15px] text-fg-dim transition-colors hover:text-fg"
              >
                {link.label}
              </Link>
            ))}
            <a
              href="https://github.com/orvacon/orvacon"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className="border-b border-line py-4 text-[15px] text-fg-dim transition-colors hover:text-fg"
            >
              GitHub
            </a>
          </nav>
          <div className="mt-6 flex items-center justify-between">
            <span className="text-[14px] text-fg-dim">Theme</span>
            <ThemeToggle />
          </div>
        </div>
      ) : null}
    </div>
  );
}
