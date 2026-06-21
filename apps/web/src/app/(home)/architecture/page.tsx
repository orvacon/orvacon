import type { Metadata } from "next";
import { Layers } from "@/components/architecture/layers";
import { Ledger } from "@/components/architecture/ledger";
import { Lifecycle } from "@/components/architecture/lifecycle";
import { StateMachine } from "@/components/architecture/state-machine";
import { CTA } from "@/components/cta";
import { PageHero } from "@/components/page-hero";

export const metadata: Metadata = {
  title: "Architecture",
  description:
    "orvacon is a state machine wrapped around connectors. The core owns money typing, persistence, idempotency and signing — here's how a payment moves through it.",
};

export default function ArchitecturePage() {
  return (
    <>
      <div className="orv-guides mx-auto max-w-[1232px] overflow-x-clip">
        <PageHero
          badge="Architecture"
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
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
            </svg>
          }
          titleLead="A thin orchestrator"
          titleRest="over a strict core."
          lead="orvacon is a state machine wrapped around connectors. The core owns money typing, persistence, idempotency and signing; connectors only translate to a gateway. Here's how a payment moves through it."
        />
        <Layers />
        <Lifecycle />
        <StateMachine />
        <Ledger />
      </div>
      <CTA
        eyebrow="State machine · ledger · connectors"
        title="See it in the source."
        subtitle="Every boundary on this page is a real module you can read, fork and run. No hidden services, no magic."
        primary={{ href: "https://github.com/orvacon/orvacon", label: "Read the source" }}
        secondary={{ href: "/security", label: "Security model" }}
      />
    </>
  );
}
