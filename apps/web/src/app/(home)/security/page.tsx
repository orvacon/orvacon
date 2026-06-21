import type { Metadata } from "next";
import { CTA } from "@/components/cta";
import { PageHero } from "@/components/page-hero";
import { Crypto } from "@/components/security/crypto";
import { Custody } from "@/components/security/custody";
import { Defaults } from "@/components/security/defaults";
import { Disclosure } from "@/components/security/disclosure";
import { ThreeDSTrust } from "@/components/security/three-ds-trust";

export const metadata: Metadata = {
  title: "Security",
  description:
    "orvacon keeps money out of its own path, signs every event with Ed25519 asymmetric keys, and treats the database as hostile by default — each flow drawn out, not asserted.",
};

const chips = ["No money custody", "Ed25519 webhooks", "Default-deny RLS", "Hash-chained ledger"];

export default function SecurityPage() {
  return (
    <>
      <div className="orv-guides mx-auto max-w-[1232px] overflow-x-clip">
        <PageHero
          badge="Security"
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
              <path d="M12 2l8 3v6c0 5-3.5 8.5-8 11-4.5-2.5-8-6-8-11V5l8-3z" />
            </svg>
          }
          titleLead="Verify it."
          titleRest="Don't just trust it."
          lead="orvacon keeps money out of its own path, signs every event with asymmetric keys, and treats the database as hostile by default. Here's exactly how each flow is secured — drawn out, not asserted."
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
        <Custody />
        <Crypto />
        <ThreeDSTrust />
        <Defaults />
        <Disclosure />
      </div>
      <CTA
        eyebrow="Verifiable by design"
        title={
          <>
            Read the code,
            <br />
            not the promises.
          </>
        }
        subtitle="Every boundary on this page is enforced in open source. Audit it, run it in your own runtime, and verify it yourself."
        primary={{ href: "https://github.com/orvacon/orvacon", label: "Read the source" }}
        secondary={{
          href: "https://github.com/orvacon/orvacon/security/policy",
          label: "Security policy",
        }}
      />
    </>
  );
}
