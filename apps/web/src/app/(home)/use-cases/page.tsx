import type { Metadata } from "next";
import { CTA } from "@/components/cta";
import { PageHero } from "@/components/page-hero";
import { Fits } from "@/components/use-cases/fits";
import { NotFit } from "@/components/use-cases/not-fit";

export const metadata: Metadata = {
  title: "Use cases",
  description:
    "orvacon fits when you take card payments through your own gateway account and want the orchestration handled cleanly. It's deliberately not a fit for everything — here's both sides.",
};

export default function UseCasesPage() {
  return (
    <>
      <div className="orv-guides mx-auto max-w-[1232px] overflow-x-clip">
        <PageHero
          badge="Use cases"
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
              <path d="M9 11l3 3L22 4" />
              <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
            </svg>
          }
          titleLead="When orvacon is"
          titleRest="the right tool."
          lead="orvacon fits when you take card payments through your own gateway account and want the orchestration handled cleanly. It's deliberately not a fit for everything — here's both sides."
        />
        <Fits />
        <NotFit />
      </div>
      <CTA
        eyebrow="Own the gateway · own the data"
        title="Sound like your stack?"
        subtitle="If you charge through your own gateway account, orvacon takes the orchestration off your plate — cleanly, and in your own runtime."
        primary={{ href: "/#start", label: "Get started" }}
        secondary={{ href: "/architecture", label: "How it works" }}
      />
    </>
  );
}
