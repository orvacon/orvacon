"use client";

import { AnimatePresence, motion, type Variants } from "motion/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowRight } from "./icons";
import { ThemeToggle } from "./theme-toggle";

const primary = [
  { label: "Architecture", href: "/architecture" },
  { label: "Connectors", href: "/connectors" },
  { label: "Security", href: "/security" },
  { label: "Pricing", href: "/pricing" },
  { label: "Use cases", href: "/use-cases" },
  { label: "Roadmap", href: "/roadmap" },
];

const secondary = [
  { label: "Changelog", href: "/changelog" },
  { label: "Blog", href: "/blog" },
  { label: "Docs", href: "/docs/get-started" },
];

const panelVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.2, staggerChildren: 0.05, delayChildren: 0.04 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.32, ease: [0.22, 1, 0.36, 1] } },
};

function HamburgerIcon({ open }: { open: boolean }) {
  return (
    <span className="relative block h-[13px] w-[18px]">
      <motion.span
        className="absolute left-0 top-0 h-[1.8px] w-full rounded-full bg-current"
        animate={open ? { rotate: 45, y: 5.5 } : { rotate: 0, y: 0 }}
        transition={{ duration: 0.25 }}
      />
      <motion.span
        className="absolute left-0 top-[5.5px] h-[1.8px] w-full rounded-full bg-current"
        animate={{ opacity: open ? 0 : 1 }}
        transition={{ duration: 0.18 }}
      />
      <motion.span
        className="absolute bottom-0 left-0 h-[1.8px] w-full rounded-full bg-current"
        animate={open ? { rotate: -45, y: -5.5 } : { rotate: 0, y: 0 }}
        transition={{ duration: 0.25 }}
      />
    </span>
  );
}

export function MobileMenu() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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

  const close = () => setOpen(false);

  return (
    <div className="flex items-center gap-1.5 md:hidden">
      <AnimatePresence initial={false}>
        {open ? null : (
          <motion.div
            key="bar-cta"
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ duration: 0.18 }}
          >
            <Link
              href="/docs/get-started"
              className="inline-flex items-center rounded-lg bg-accent px-3.5 py-2 text-[13.5px] font-medium text-white transition hover:brightness-110"
            >
              Get started
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
      <button
        type="button"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="flex h-9 w-9 items-center justify-center rounded-[7px] text-fg-dim outline-none transition-colors hover:bg-bg-2 hover:text-fg focus-visible:ring-2 focus-visible:ring-[var(--accent-line)]"
      >
        <HamburgerIcon open={open} />
      </button>
      {mounted
        ? createPortal(
            <AnimatePresence>
              {open ? (
                <motion.div
                  variants={panelVariants}
                  initial="hidden"
                  animate="show"
                  exit="exit"
                  className="fixed inset-x-0 bottom-0 top-[62px] z-50 overflow-y-auto bg-bg md:hidden"
                >
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-0 top-0 h-[280px] [background:radial-gradient(60%_70%_at_50%_-10%,color-mix(in_srgb,var(--accent)_13%,transparent),transparent_70%)]"
                  />
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 opacity-50 [background-image:radial-gradient(circle,var(--guide)_1px,transparent_1.2px)] [background-size:22px_22px] [mask-image:linear-gradient(#000,transparent_55%)]"
                  />
                  <div className="relative flex min-h-full flex-col px-5 pb-10 pt-9">
                    <motion.div variants={itemVariants} className="orv-eyebrow mb-2">
                      Navigate
                    </motion.div>
                    <nav className="flex flex-col">
                      {primary.map((link, index) => (
                        <motion.div key={link.href} variants={itemVariants}>
                          <Link
                            href={link.href}
                            onClick={close}
                            className="group flex items-center gap-3.5 border-b border-line py-3.5 active:opacity-60"
                          >
                            <span className="w-5 font-mono text-[11px] text-fg-faint">
                              {String(index + 1).padStart(2, "0")}
                            </span>
                            <span className="text-[22px] font-medium tracking-[-0.02em] text-fg">
                              {link.label}
                            </span>
                            <ArrowRight className="ml-auto h-4 w-4 text-fg-faint transition-colors group-hover:text-accent" />
                          </Link>
                        </motion.div>
                      ))}
                    </nav>
                    <motion.div variants={itemVariants} className="mt-6 flex flex-wrap gap-2">
                      {secondary.map((link) => (
                        <Link
                          key={link.href}
                          href={link.href}
                          onClick={close}
                          className="rounded-full border border-line px-3.5 py-1.5 font-mono text-[12.5px] text-fg-dim transition-colors hover:border-[var(--accent-line)] hover:text-fg active:opacity-60"
                        >
                          {link.label}
                        </Link>
                      ))}
                      <a
                        href="https://github.com/orvacon/orvacon"
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={close}
                        className="rounded-full border border-line px-3.5 py-1.5 font-mono text-[12.5px] text-fg-dim transition-colors hover:border-[var(--accent-line)] hover:text-fg active:opacity-60"
                      >
                        GitHub
                      </a>
                    </motion.div>
                    <div className="flex-1" />
                    <motion.div variants={itemVariants} className="mt-10">
                      <Link
                        href="/docs/get-started"
                        onClick={close}
                        className="flex items-center justify-center gap-2 rounded-xl bg-accent px-5 py-3.5 text-[15px] font-medium text-white transition hover:brightness-110 active:brightness-95"
                      >
                        Get started
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                      <div className="mt-4 flex items-center justify-between border-t border-line pt-4">
                        <span className="font-mono text-[12px] text-fg-faint">Appearance</span>
                        <ThemeToggle />
                      </div>
                    </motion.div>
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>,
            document.body,
          )
        : null}
    </div>
  );
}
