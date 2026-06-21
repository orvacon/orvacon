import Link from "next/link";

const packages = [
  "@orvacon/paykit",
  "connector-iyzico",
  "adapter-supabase",
  "adapter-nextjs",
  "cryptokit",
];

const product = [
  { label: "Architecture", href: "/architecture" },
  { label: "Connectors", href: "/connectors" },
  { label: "Security", href: "/security" },
  { label: "Pricing", href: "/pricing" },
  { label: "Use cases", href: "/use-cases" },
];

const project = [
  { label: "GitHub", href: "https://github.com/orvacon/orvacon" },
  { label: "Roadmap", href: "/roadmap" },
  { label: "Issues", href: "https://github.com/orvacon/orvacon/issues" },
  { label: "Releases", href: "https://github.com/orvacon/orvacon/releases" },
];

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string }[];
}) {
  return (
    <div className="min-w-0">
      <div className="mb-3.5 font-mono text-[11px] uppercase tracking-[0.1em] text-fg-faint">
        {title}
      </div>
      <div className="flex flex-col gap-2.5 text-[13.5px]">
        {links.map((link) =>
          link.href.startsWith("http") ? (
            <a
              key={link.href}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-fg-dim transition-colors hover:text-fg"
            >
              {link.label}
            </a>
          ) : (
            <Link
              key={link.href}
              href={link.href}
              className="text-fg-dim transition-colors hover:text-fg"
            >
              {link.label}
            </Link>
          ),
        )}
      </div>
    </div>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-bg-2">
      <div className="mx-auto max-w-[1232px] px-7 pb-10 pt-14">
        <div className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-x-8 gap-y-9">
          <div className="min-w-0">
            <span className="text-[15px] font-semibold tracking-tight">orvacon</span>
            <p className="mt-3.5 max-w-[34ch] text-[13.5px] leading-relaxed text-fg-dim">
              Provider-agnostic, TypeScript-first payment orchestration. Runs in your own runtime —
              it never touches the money.
            </p>
            <span className="mt-4 inline-flex items-center gap-1.5 rounded-[7px] border border-line px-2.5 py-1 font-mono text-xs text-fg-dim">
              MIT License
            </span>
          </div>
          <div className="min-w-0">
            <div className="mb-3.5 font-mono text-[11px] uppercase tracking-[0.1em] text-fg-faint">
              Packages
            </div>
            <div className="flex flex-col gap-[9px] font-mono text-[12.5px] text-fg-dim">
              {packages.map((name) => (
                <span key={name}>{name}</span>
              ))}
            </div>
          </div>
          <FooterColumn title="Product" links={product} />
          <div className="min-w-0">
            <div className="mb-3.5 font-mono text-[11px] uppercase tracking-[0.1em] text-fg-faint">
              Resources
            </div>
            <div className="flex flex-col gap-2.5 text-[13.5px]">
              <a
                href="https://github.com/orvacon/orvacon#readme"
                target="_blank"
                rel="noopener noreferrer"
                className="text-fg-dim transition-colors hover:text-fg"
              >
                README
              </a>
              <span className="inline-flex items-center gap-1.5 text-fg-dim">
                Docs
                <span className="rounded border border-line px-1.5 py-px font-mono text-[9.5px] text-fg-faint">
                  soon
                </span>
              </span>
              <a
                href="https://github.com/orvacon/orvacon/security/policy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-fg-dim transition-colors hover:text-fg"
              >
                Security policy
              </a>
              <Link href="/#changelog" className="text-fg-dim transition-colors hover:text-fg">
                Changelog
              </Link>
              <Link href="/#start" className="text-fg-dim transition-colors hover:text-fg">
                Get started
              </Link>
            </div>
          </div>
          <FooterColumn title="Project" links={project} />
        </div>
        <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-[22px]">
          <span className="font-mono text-[12.5px] text-fg-faint">© 2026 orvacon · MIT</span>
          <span className="text-[12.5px] text-fg-faint">Building in the open.</span>
        </div>
      </div>
    </footer>
  );
}
