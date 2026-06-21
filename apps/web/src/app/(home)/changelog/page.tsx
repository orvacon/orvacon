import { DocsBody } from "fumadocs-ui/layouts/docs/page";
import type { Metadata } from "next";
import { ChangelogNav } from "@/components/changelog-nav";
import { CTA } from "@/components/cta";
import { getMDXComponents } from "@/components/mdx";
import { PageHero } from "@/components/page-hero";
import { formatDate } from "@/lib/date";
import { changelogSource } from "@/lib/source";

export const metadata: Metadata = {
  title: "Changelog",
  description: "Every release of orvacon, with what changed and why.",
};

export default function ChangelogPage() {
  const releases = [...changelogSource.getPages()].sort((a, b) =>
    b.data.date.localeCompare(a.data.date),
  );
  const components = getMDXComponents();
  const nav = releases.map((release) => ({ version: release.data.title, tag: release.data.tag }));

  return (
    <>
      <div className="orv-guides mx-auto max-w-[1232px] overflow-x-clip">
        <PageHero
          badge="Changelog"
          icon={
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="3" />
              <path d="M3 12h6M15 12h6" />
            </svg>
          }
          titleLead="Shipped"
          titleRest="in the open."
          lead="Every release of orvacon, with what changed and why. The API is 0.x and may move before 1.0 — anything not shipped yet is labeled as such."
        />
        <section className="px-[clamp(24px,3.4vw,46px)] pb-[84px]">
          <div className="grid gap-10 lg:grid-cols-[180px_1fr]">
            <aside className="hidden lg:block">
              <div className="sticky top-[84px]">
                <div className="orv-eyebrow mb-3.5">Releases</div>
                <ChangelogNav releases={nav} />
              </div>
            </aside>
            <div className="flex min-w-0 flex-col gap-7">
              {releases.map((release) => {
                const Body = release.data.body;
                return (
                  <div
                    key={release.url}
                    id={`v${release.data.title}`}
                    className="scroll-mt-[84px] overflow-hidden rounded-2xl border border-line bg-bg-2"
                  >
                    <div className="flex flex-wrap items-center gap-3 border-b border-line px-6 py-4">
                      <span className="rounded-md bg-[var(--accent-soft)] px-2.5 py-1 font-mono text-[13px] text-accent">
                        v{release.data.title}
                      </span>
                      {release.data.tag ? (
                        <span className="rounded border border-line px-2 py-0.5 font-mono text-[11px] text-fg-faint">
                          {release.data.tag}
                        </span>
                      ) : null}
                      <span className="ml-auto font-mono text-[12px] text-fg-faint">
                        {formatDate(release.data.date)}
                      </span>
                    </div>
                    <DocsBody className="px-6 py-5 text-[14px]">
                      <Body components={components} />
                    </DocsBody>
                  </div>
                );
              })}
            </div>
          </div>
          <p className="mt-6 text-[13px] text-fg-faint">
            The raw release notes live on{" "}
            <a
              href="https://github.com/orvacon/orvacon/releases"
              target="_blank"
              rel="noopener noreferrer"
              className="text-fg-dim underline-offset-2 hover:text-fg hover:underline"
            >
              GitHub
            </a>
            .
          </p>
        </section>
      </div>
      <CTA
        eyebrow="Built in the open"
        title="Watch it ship."
        subtitle="Every release is cut in public with changesets. Star the repo to follow along, or open an issue to shape what's next."
        primary={{ href: "https://github.com/orvacon/orvacon/releases", label: "All releases" }}
        secondary={{ href: "/roadmap", label: "Roadmap" }}
      />
    </>
  );
}
