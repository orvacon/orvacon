import { registryIndex } from "@/__registry__";
import { Code } from "@/components/code";
import { Command } from "@/components/command";
import { ComponentPreview } from "@/components/component-preview";
import { DocPage } from "@/components/doc-page";
import { PageHeader } from "@/components/page-header";
import { UsageTabs } from "@/components/usage-tabs";
import { PaymentStatus, type PaymentStatusValue } from "@/registry/ui/payment-status";

const entry = registryIndex["payment-status"];

const STATES: { status: PaymentStatusValue; description: string }[] = [
  { status: "created", description: "Initialized; no money has moved yet." },
  { status: "authorized", description: "Funds are held on the card, awaiting capture." },
  { status: "captured", description: "Funds captured — the payment is settled." },
  { status: "refunded", description: "A captured payment was returned to the cardholder." },
  { status: "requires_action", description: "Waiting on 3-D Secure or another customer step." },
  { status: "failed", description: "The gateway declined, or the flow errored out." },
  { status: "voided", description: "An authorization was canceled before capture." },
];

const USAGE = {
  nextjs: `import { PaymentStatus } from "@/components/orvacon/payment-status";

export default async function OrderPage({ payment }) {
  return <PaymentStatus status={payment.status} />;
}`,
  react: `import { PaymentStatus } from "@/components/orvacon/payment-status";

export function OrderBadge({ payment }) {
  return <PaymentStatus status={payment.status} />;
}`,
  remix: `import { useLoaderData } from "@remix-run/react";
import { PaymentStatus } from "@/components/orvacon/payment-status";

export default function Order() {
  const { payment } = useLoaderData<typeof loader>();
  return <PaymentStatus status={payment.status} />;
}`,
};

const toc = [
  { id: "preview", title: "Preview" },
  { id: "installation", title: "Installation" },
  { id: "usage", title: "Usage" },
  { id: "states", title: "States" },
];

export default function PaymentStatusPage() {
  return (
    <DocPage toc={toc}>
      <PageHeader
        eyebrow="Components"
        title="Payment Status"
        description={
          entry?.description ??
          "A badge for a payment's lifecycle state — the states orvacon's core state machine moves through."
        }
      />

      <section id="preview" className="scroll-mt-20">
        <ComponentPreview
          name="payment-status"
          code={<Code code={entry?.source ?? ""} lang="tsx" />}
        />
      </section>

      <h2 id="installation" className="mt-10 scroll-mt-20 text-lg font-medium">
        Installation
      </h2>
      <div className="mt-3">
        <Command command="npx orvacon add payment-status" />
      </div>

      <h2 id="usage" className="mt-10 scroll-mt-20 text-lg font-medium">
        Usage
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        The component is the same everywhere — pick your framework for the surrounding idiom.
      </p>
      <div className="mt-3">
        <UsageTabs
          frameworks={[
            { id: "nextjs", label: "Next.js", node: <Code code={USAGE.nextjs} lang="tsx" /> },
            { id: "react", label: "React", node: <Code code={USAGE.react} lang="tsx" /> },
            { id: "remix", label: "Remix", node: <Code code={USAGE.remix} lang="tsx" /> },
          ]}
        />
      </div>

      <h2 id="states" className="mt-10 scroll-mt-20 text-lg font-medium">
        States
      </h2>
      <ul className="mt-4 space-y-3">
        {STATES.map((state) => (
          <li key={state.status} className="flex items-center gap-3">
            <span className="w-36 shrink-0">
              <PaymentStatus status={state.status} />
            </span>
            <span className="text-sm text-muted-foreground">{state.description}</span>
          </li>
        ))}
      </ul>
    </DocPage>
  );
}
