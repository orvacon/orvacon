"use client";

import { AnimatePresence, motion, type Variants } from "motion/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ThemeToggle } from "./theme-toggle";

const links = [
  { label: "Architecture", href: "/architecture" },
  { label: "Connectors", href: "/connectors" },
  { label: "Security", href: "/security" },
  { label: "Pricing", href: "/pricing" },
  { label: "Use cases", href: "/use-cases" },
  { label: "Roadmap", href: "/roadmap" },
];

const panelVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.2, staggerChildren: 0.045, delayChildren: 0.05 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
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
        className="flex h-9 w-9 items-center justify-center rounded-[7px] text-fg-dim transition-colors hover:bg-bg-2 hover:text-fg"
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
                  className="fixed inset-x-0 bottom-0 top-[62px] z-50 overflow-y-auto bg-bg px-5 pb-10 pt-3 md:hidden"
                >
                  <nav className="flex flex-col">
                    {links.map((link) => (
                      <motion.div key={link.href} variants={itemVariants}>
                        <Link
                          href={link.href}
                          onClick={() => setOpen(false)}
                          className="block border-b border-line py-4 text-[15px] text-fg-dim transition-colors hover:text-fg"
                        >
                          {link.label}
                        </Link>
                      </motion.div>
                    ))}
                    <motion.div variants={itemVariants}>
                      <a
                        href="https://github.com/orvacon/orvacon"
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => setOpen(false)}
                        className="block border-b border-line py-4 text-[15px] text-fg-dim transition-colors hover:text-fg"
                      >
                        GitHub
                      </a>
                    </motion.div>
                  </nav>
                  <motion.div variants={itemVariants} className="mt-7">
                    <Link
                      href="/docs/get-started"
                      onClick={() => setOpen(false)}
                      className="flex items-center justify-center rounded-lg bg-accent px-5 py-3 text-[15px] font-medium text-white transition hover:brightness-110"
                    >
                      Get started
                    </Link>
                  </motion.div>
                  <motion.div
                    variants={itemVariants}
                    className="mt-5 flex items-center justify-between"
                  >
                    <span className="text-[14px] text-fg-dim">Theme</span>
                    <ThemeToggle />
                  </motion.div>
                </motion.div>
              ) : null}
            </AnimatePresence>,
            document.body,
          )
        : null}
    </div>
  );
}
