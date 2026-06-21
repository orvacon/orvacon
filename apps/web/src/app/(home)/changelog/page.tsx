import type { Metadata } from "next";
import { CTA } from "@/components/cta";
import { Flow } from "@/components/icons";
import { PageHero } from "@/components/page-hero";

export const metadata: Metadata = {
  title: "Changelog",
  description: "Every release of orvacon, with what changed and why.",
};

const releases = [
  {
    version: "v0.1.0",
    tag: "first release",
    date: "2026",
    changes: [
      {
        id: "iyzico",
        title: "Iyzico 3-D Secure, verified",
        desc: (
          <>
            <Flow steps={["authorize", "3DS", "capture", "refund", "reconcile"]} />, end-to-end
            against the gateway sandbox.
          </>
        ),
      },
      {
        id: "ed25519",
        title: "Ed25519-signed webhooks",
        desc: "Asymmetric signatures so a leaked verification key can't forge events. Timing-safe checks throughout.",
      },
      {
        id: "rls",
        title: "Schema with default-deny RLS",
        desc: "Generates a Postgres schema with row-level security locked down out of the box.",
      },
      {
        id: "ledger",
        title: "Hash-chained ledger",
        desc: "Append-only and tamper-evident by construction; idempotency enforced by a unique constraint.",
      },
    ],
  },
];

export default function ChangelogPage() {
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
          <div className="flex flex-col gap-7">
            {releases.map((release) => (
              <div
                key={release.version}
                className="overflow-hidden rounded-2xl border border-line bg-bg-2"
              >
                <div className="flex flex-wrap items-center gap-3 border-b border-line px-6 py-4">
                  <span className="rounded-md bg-[var(--accent-soft)] px-2.5 py-1 font-mono text-[13px] text-accent">
                    {release.version}
                  </span>
                  <span className="rounded border border-line px-2 py-0.5 font-mono text-[11px] text-fg-faint">
                    {release.tag}
                  </span>
                  <span className="ml-auto font-mono text-[12px] text-fg-faint">
                    {release.date}
                  </span>
                </div>
                <div className="divide-y divide-line">
                  {release.changes.map((change) => (
                    <div key={change.id} className="flex gap-4 px-6 py-5">
                      <span
                        aria-hidden="true"
                        className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent"
                      />
                      <div>
                        <h3 className="text-[15px] font-semibold tracking-[-0.01em] text-fg">
                          {change.title}
                        </h3>
                        <p className="mt-1 text-[13.5px] leading-[1.55] text-fg-dim">
                          {change.desc}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
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
