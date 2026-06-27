"use client";

import { Moon, Sun } from "lucide-react";
import Link from "next/link";
import { useTheme } from "next-themes";
import type { ComponentProps } from "react";
import { MobileNav } from "@/components/mobile-nav";
import { OrvaconWordmark } from "@/components/orvacon-wordmark";

function GitHubIcon(props: ComponentProps<"svg">) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...props}>
      <path d="M12 .5C5.37.5 0 5.78 0 12.29c0 5.2 3.44 9.62 8.21 11.18.6.11.82-.26.82-.58 0-.29-.01-1.04-.02-2.04-3.34.72-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.74.08-.73.08-.73 1.2.09 1.84 1.24 1.84 1.24 1.07 1.83 2.81 1.3 3.5.99.11-.78.42-1.31.76-1.61-2.67-.3-5.47-1.34-5.47-5.95 0-1.31.47-2.39 1.24-3.23-.13-.3-.54-1.52.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.29-1.55 3.3-1.23 3.3-1.23.66 1.66.25 2.88.12 3.18.77.84 1.24 1.92 1.24 3.23 0 4.62-2.81 5.64-5.49 5.94.43.37.81 1.1.81 2.22 0 1.6-.01 2.9-.01 3.29 0 .32.22.69.83.57C20.56 21.91 24 17.49 24 12.29 24 5.78 18.63.5 12 .5Z" />
    </svg>
  );
}

export function SiteHeader() {
  const { setTheme, resolvedTheme } = useTheme();

  return (
    <header className="sticky top-0 z-50 flex h-14 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur sm:px-6">
      <MobileNav />
      <Link href="/" className="flex items-center gap-1.5">
        <OrvaconWordmark className="h-[18px] w-[60px] shrink-0 bg-current text-foreground" />
        <span className="text-shadow-2xs flex items-center font-medium text-muted-foreground">
          ui
        </span>
      </Link>

      <div className="ml-auto flex items-center gap-1">
        <a
          href="https://github.com/orvacon/orvacon"
          aria-label="orvacon on GitHub"
          className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <GitHubIcon className="size-4" />
        </a>
        <button
          type="button"
          aria-label="Toggle theme"
          onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <Sun className="hidden size-4 dark:block" />
          <Moon className="size-4 dark:hidden" />
        </button>
      </div>
    </header>
  );
}
