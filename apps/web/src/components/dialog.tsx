"use client";

import * as RadixDialog from "@radix-ui/react-dialog";
import type { ReactNode } from "react";

export function Dialog({
  trigger,
  eyebrow,
  index,
  title,
  children,
}: {
  trigger: ReactNode;
  eyebrow?: string;
  index?: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <RadixDialog.Root>
      <RadixDialog.Trigger asChild>{trigger}</RadixDialog.Trigger>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm data-[state=open]:[animation:orv-fade-in_0.2s_ease] data-[state=closed]:[animation:orv-fade-out_0.15s_ease]" />
        <RadixDialog.Content
          aria-describedby={undefined}
          className="fixed inset-x-0 bottom-0 z-50 flex max-h-[88vh] flex-col overflow-hidden rounded-t-2xl border border-line bg-bg-2 shadow-[0_40px_90px_-40px_rgba(0,0,0,0.7)] focus:outline-none data-[state=open]:[animation:orv-slide-up_0.28s_cubic-bezier(0.32,0.72,0,1)] data-[state=closed]:[animation:orv-slide-down_0.2s_ease] sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:max-h-[85vh] sm:w-[92vw] sm:max-w-[560px] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl sm:data-[state=open]:[animation:orv-pop-in_0.2s_ease]"
        >
          <header className="flex items-center justify-between gap-4 border-b border-line px-6 py-4">
            <span className="font-mono text-[11.5px] uppercase tracking-[0.14em] text-fg-faint">
              {eyebrow ?? "Details"}
            </span>
            <RadixDialog.Close
              aria-label="Close"
              className="-mr-1.5 rounded-md p-1.5 text-fg-dim transition-colors hover:bg-bg-3 hover:text-fg"
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
            </RadixDialog.Close>
          </header>
          <div className="no-scrollbar overflow-y-auto px-6 py-6">
            {index ? <div className="font-mono text-[12px] text-accent">{index}</div> : null}
            <RadixDialog.Title className="mt-2 text-[22px] font-semibold tracking-[-0.02em] text-fg">
              {title}
            </RadixDialog.Title>
            <div className="mt-4 text-[14.5px] leading-[1.65] text-fg-dim">
              {children ?? "Details coming soon."}
            </div>
          </div>
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}
