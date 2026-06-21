"use client";

import { AnimatePresence, motion } from "motion/react";
import { type ReactNode, useEffect, useId, useRef, useState } from "react";

export function ExpandableCard({
  children,
  expanded,
  label,
}: {
  children: ReactNode;
  expanded?: ReactNode;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const layoutId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);

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
    closeRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <motion.button
        type="button"
        layoutId={layoutId}
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-label={label}
        className="block h-full w-full cursor-pointer text-left"
      >
        {children}
      </motion.button>

      <AnimatePresence>
        {open ? (
          <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
            <motion.button
              type="button"
              aria-label="Close"
              onClick={() => setOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 cursor-default bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              layoutId={layoutId}
              role="dialog"
              aria-modal="true"
              className="relative z-10 flex max-h-[88vh] w-full flex-col overflow-hidden rounded-t-2xl bg-bg-2 shadow-[0_40px_90px_-40px_rgba(0,0,0,0.7)] sm:max-w-[560px] sm:rounded-2xl"
            >
              <button
                ref={closeRef}
                type="button"
                aria-label="Close"
                onClick={() => setOpen(false)}
                className="absolute right-3.5 top-3.5 z-20 rounded-md p-1.5 text-fg-dim transition-colors hover:bg-bg-3 hover:text-fg"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  aria-hidden="true"
                >
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
              <div className="no-scrollbar overflow-y-auto">
                {children}
                {expanded ? <div className="border-t border-line px-6 py-6">{expanded}</div> : null}
              </div>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
