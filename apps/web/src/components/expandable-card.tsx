"use client";

import { AnimatePresence, motion } from "motion/react";
import { type ReactNode, useEffect, useId, useRef, useState } from "react";

const transition = { duration: 0.4, ease: [0.32, 0.72, 0, 1] } as const;

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
      <div className="relative h-full">
        <div className="h-full">{children}</div>
        {open ? null : (
          <motion.button
            layoutId={layoutId}
            type="button"
            onClick={() => setOpen(true)}
            aria-haspopup="dialog"
            aria-label={label}
            transition={transition}
            className="absolute inset-0 cursor-pointer rounded-2xl"
          />
        )}
      </div>

      <AnimatePresence>
        {open ? (
          <>
            <motion.button
              type="button"
              aria-label="Close"
              onClick={() => setOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="fixed inset-0 z-40 cursor-default bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              layoutId={layoutId}
              role="dialog"
              aria-modal="true"
              aria-label={label}
              transition={transition}
              className="fixed inset-x-0 bottom-0 z-50 max-h-[88vh] overflow-hidden rounded-t-2xl border border-line bg-bg-2 shadow-[0_40px_90px_-40px_rgba(0,0,0,0.7)] sm:inset-0 sm:m-auto sm:h-fit sm:max-h-[85vh] sm:max-w-[560px] sm:rounded-2xl"
            >
              <button
                ref={closeRef}
                type="button"
                aria-label="Close"
                onClick={() => setOpen(false)}
                className="absolute right-4 top-4 z-20 rounded-md p-1.5 text-fg-dim outline-none transition-colors hover:bg-bg-3 hover:text-fg focus-visible:ring-2 focus-visible:ring-[var(--accent-line)]"
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
              <motion.div
                layout="position"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.22, delay: 0.06 }}
                className="no-scrollbar max-h-[88vh] overflow-y-auto sm:max-h-[85vh]"
              >
                {children}
                {expanded ? <div className="border-t border-line px-6 py-6">{expanded}</div> : null}
              </motion.div>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
    </>
  );
}
