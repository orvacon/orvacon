import type { Metadata } from "next";
import { CTA } from "@/components/cta";
import { PageHero } from "@/components/page-hero";
import { Board } from "@/components/roadmap/board";

export const metadata: Metadata = {
  title: "Roadmap",
  description:
    "orvacon is v0.3. This is what's real today and what's coming — without dates we can't promise. Anything not shipped is labeled as such.",
};

const chips = ["0.x semver", "No hard dates", 'No "supports everything"'];

export default function RoadmapPage() {
  return (
    <>
      <div className="orv-guides mx-auto max-w-[1232px] overflow-x-clip">
        <PageHero
          badge="Roadmap"
          icon={<span className="h-1.5 w-1.5 rounded-full bg-accent" />}
          titleLead="Shipped, in flight,"
          titleRest="and honestly planned."
          lead="orvacon is v0.3. This is what's real today and what's coming — without dates we can't promise. Anything not shipped is labeled as such."
          footer={
            <div className="flex flex-wrap justify-center gap-x-[18px] gap-y-2.5 font-mono text-[12px] uppercase tracking-[0.08em] text-fg-faint">
              {chips.map((chip, i) => (
                <span key={chip} className="flex items-center gap-x-[18px]">
                  {i > 0 ? <span className="text-line-2">/</span> : null}
                  {chip}
                </span>
              ))}
            </div>
          }
        />
        <Board />
      </div>
      <CTA
        eyebrow="Built in the open"
        title="Shape what ships next."
        subtitle="Open an issue, upvote a connector, or send a PR. The roadmap moves toward what people are actually building."
        primary={{ href: "https://github.com/orvacon/orvacon/issues", label: "Open an issue" }}
        secondary={{ href: "https://github.com/orvacon/orvacon", label: "View on GitHub" }}
      />
    </>
  );
}
