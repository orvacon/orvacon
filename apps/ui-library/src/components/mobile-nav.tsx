"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { docsNav } from "@/config/docs";
import { cn } from "@/lib/utils";

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close when the route changes — covers in-page links and browser back/forward.
  // biome-ignore lint/correctness/useExhaustiveDependencies: the effect's purpose is to re-run on pathname change
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // While open: lock body scroll, close on Escape, and close if the viewport grows
  // to desktop (otherwise the panel hides but the scroll lock would linger).
  useEffect(() => {
    if (!open) {
      return;
    }
    const { body } = document;
    const previousOverflow = body.style.overflow;
    body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };
    const desktop = window.matchMedia("(min-width: 768px)");
    const onDesktop = () => {
      if (desktop.matches) {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    desktop.addEventListener("change", onDesktop);

    return () => {
      body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
      desktop.removeEventListener("change", onDesktop);
    };
  }, [open]);

  // Rendered through a portal so the fixed panel escapes the header's backdrop-blur
  // containing block and fills the viewport instead of collapsing into the header.
  const panel = (
    <nav className="fixed inset-x-0 top-14 bottom-0 z-40 overflow-y-auto overscroll-contain bg-background p-4 md:hidden">
      {docsNav.map((section) => (
        <div key={section.title} className="mb-5">
          <div className="mb-1 px-2 text-xs font-medium text-muted-foreground">{section.title}</div>
          <ul className="space-y-0.5">
            {section.items.map((item) =>
              item.soon ? (
                <li
                  key={item.href}
                  className="flex items-center justify-between rounded-md px-2.5 py-2 text-sm text-muted-foreground/60"
                >
                  {item.title}
                  <span className="rounded bg-muted px-1.5 py-px text-[10px]">soon</span>
                </li>
              ) : (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "block rounded-md px-2.5 py-2 text-sm transition-colors",
                      pathname === item.href
                        ? "bg-accent font-medium text-accent-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground",
                    )}
                  >
                    {item.title}
                  </Link>
                </li>
              ),
            )}
          </ul>
        </div>
      ))}
    </nav>
  );

  return (
    <>
      <button
        type="button"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="-ml-1 flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground md:hidden"
      >
        {open ? <X className="size-5" /> : <Menu className="size-5" />}
      </button>

      {mounted && open ? createPortal(panel, document.body) : null}
    </>
  );
}
