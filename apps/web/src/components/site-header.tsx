import Link from "next/link";
import { MobileMenu } from "./mobile-menu";
import { ThemeToggle } from "./theme-toggle";

const navLinks = [
  { label: "Architecture", href: "/architecture" },
  { label: "Connectors", href: "/connectors" },
  { label: "Security", href: "/security" },
  { label: "Pricing", href: "/pricing" },
  { label: "Docs", href: "/docs" },
];

function GitHubMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      <path d="M8 0C3.58 0 0 3.58 0 8a8 8 0 005.47 7.59c.4.07.55-.17.55-.38v-1.34c-2.23.49-2.7-1.07-2.7-1.07-.36-.93-.89-1.18-.89-1.18-.73-.5.05-.49.05-.49.81.06 1.23.83 1.23.83.72 1.23 1.88.87 2.34.67.07-.52.28-.87.51-1.07-1.78-.2-3.65-.89-3.65-3.96 0-.87.31-1.59.83-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.22 2.2.82a7.6 7.6 0 014 0c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.52.56.83 1.28.83 2.15 0 3.08-1.87 3.76-3.66 3.96.29.25.54.73.54 1.48v2.2c0 .21.15.46.55.38A8 8 0 0016 8c0-4.42-3.58-8-8-8z" />
    </svg>
  );
}

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-line bg-[color-mix(in_srgb,var(--bg)_76%,transparent)] backdrop-blur-md backdrop-saturate-150">
      <div className="mx-auto flex h-[62px] max-w-[1232px] items-center justify-between gap-6 px-7">
        <Link href="/" className="text-base font-semibold tracking-tight" aria-label="orvacon home">
          orvacon
        </Link>
        <nav className="hidden items-center gap-0.5 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-[7px] px-3 py-[7px] text-[13.5px] text-fg-dim transition-colors hover:text-fg"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-1.5">
          <div className="hidden items-center gap-1.5 md:flex">
            <a
              href="https://github.com/orvacon/orvacon"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-[7px] rounded-[7px] px-2.5 py-[7px] text-[13.5px] text-fg transition-colors hover:bg-bg-2"
            >
              <GitHubMark />
              GitHub
            </a>
            <ThemeToggle />
            <Link
              href="/docs/get-started"
              className="inline-flex items-center gap-[7px] rounded-lg bg-accent px-3.5 py-2 text-[13.5px] font-medium text-white transition hover:brightness-110"
            >
              Get started
            </Link>
          </div>
          <MobileMenu />
        </div>
      </div>
    </header>
  );
}
