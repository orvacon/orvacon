import type { Metadata } from "next";
import { CTA } from "@/components/cta";
import { PageHero } from "@/components/page-hero";
import { Faq } from "@/components/pricing/faq";
import { Money } from "@/components/pricing/money";
import { NoCharge } from "@/components/pricing/no-charge";
import { Plan } from "@/components/pricing/plan";
import { Sustainability } from "@/components/pricing/sustainability";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "orvacon is a library you install, not a service you rent. Every package is MIT-licensed and runs in your own infrastructure — there's no paid tier today.",
};

export default function PricingPage() {
  return (
    <>
      <div className="orv-guides mx-auto max-w-[1232px] overflow-x-clip">
        <PageHero
          badge="Pricing"
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
              <path d="M9 12l2 2 4-4" />
              <circle cx="12" cy="12" r="9" />
            </svg>
          }
          titleLead="Open source."
          titleRest="$0 to run."
          lead="orvacon is a library you install, not a service you rent. There's no paid tier today — every package is MIT-licensed and runs in your own infrastructure."
        />
        <Plan />
        <Money />
        <NoCharge />
        <Sustainability />
        <Faq />
      </div>
      <CTA
        eyebrow="Free · MIT · self-hosted"
        title={
          <>
            Nothing to buy.
            <br />
            Just start building.
          </>
        }
        subtitle="Install the packages, point a connector at your gateway, and ship. If it earns its place in your stack, sponsor it."
        primary={{ href: "/#start", label: "Get started" }}
        secondary={{ href: "https://github.com/sponsors/orvacon", label: "Sponsor" }}
      />
    </>
  );
}
