import type { Metadata } from "next";
import { Adapters } from "@/components/connectors/adapters";
import { Contract } from "@/components/connectors/contract";
import { Gateways } from "@/components/connectors/gateways";
import { CTA } from "@/components/cta";
import { PageHero } from "@/components/page-hero";

export const metadata: Metadata = {
  title: "Connectors",
  description:
    "A connector teaches orvacon how to talk to one payment gateway. Every connector implements the same contract, so switching providers is a config change, not a rewrite.",
};

export default function ConnectorsPage() {
  return (
    <>
      <div className="orv-guides mx-auto max-w-[1232px] overflow-x-clip">
        <PageHero
          badge="Connectors"
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
              <path d="M16 18l6-6-6-6M8 6l-6 6 6 6" />
            </svg>
          }
          titleLead="Every gateway,"
          titleRest="one interface."
          lead="A connector teaches orvacon how to talk to one payment gateway. They all implement the same contract — so adding or switching a provider is a configuration change, never a rewrite."
        />
        <Gateways />
        <Adapters />
        <Contract />
      </div>
      <CTA
        eyebrow="One interface · any gateway"
        title={
          <>
            Start with Iyzico.
            <br />
            Add the rest later.
          </>
        }
        subtitle="Ship the verified Iyzico connector today; new gateways slot in behind the same contract without touching your application code."
        primary={{ href: "/docs/get-started", label: "Get started" }}
        secondary={{ href: "https://github.com/orvacon/orvacon", label: "View on GitHub" }}
      />
    </>
  );
}
