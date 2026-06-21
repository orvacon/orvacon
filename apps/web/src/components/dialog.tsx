"use client";

import * as RadixDialog from "@radix-ui/react-dialog";
import type { ReactNode } from "react";

export function Dialog({
  trigger,
  title,
  description,
  children,
}: {
  trigger: ReactNode;
  title: string;
  description?: string;
  children?: ReactNode;
}) {
  return (
    <RadixDialog.Root>
      <RadixDialog.Trigger asChild>{trigger}</RadixDialog.Trigger>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm data-[state=open]:[animation:orv-fade-in_0.2s_ease] data-[state=closed]:[animation:orv-fade-out_0.15s_ease]" />
        <RadixDialog.Content className="fixed left-1/2 top-1/2 z-50 w-[92vw] max-w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-line bg-bg-2 p-7 shadow-[0_40px_90px_-40px_rgba(0,0,0,0.7)] focus:outline-none data-[state=open]:[animation:orv-pop-in_0.2s_ease]">
          <div className="flex items-start justify-between gap-4">
            <RadixDialog.Title className="text-[18px] font-semibold tracking-[-0.01em] text-fg">
              {title}
            </RadixDialog.Title>
            <RadixDialog.Close
              aria-label="Close"
              className="-mr-1 -mt-1 rounded-md p-1.5 text-fg-dim transition-colors hover:bg-bg-3 hover:text-fg"
            >
              <svg
                width="16"
                height="16"
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
          </div>
          {description ? (
            <RadixDialog.Description className="mt-2 text-[14px] leading-[1.6] text-fg-dim">
              {description}
            </RadixDialog.Description>
          ) : (
            <RadixDialog.Description className="sr-only">{title}</RadixDialog.Description>
          )}
          {children}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}
