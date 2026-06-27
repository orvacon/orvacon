import { DocPage } from "@/components/doc-page";
import { KeyGenerator } from "@/components/key-generator";
import { PageHeader } from "@/components/page-header";

const toc = [{ id: "how-it-works", title: "How it works" }];

export default function WebhookKeysPage() {
  return (
    <DocPage toc={toc}>
      <PageHeader
        eyebrow="Tools"
        title="Webhook Keys"
        description="Generate an Ed25519 key pair for signing orvacon webhooks — right here in your browser."
      />

      <div className="rounded-lg border border-amber-500/30 bg-amber-50/60 px-4 py-3 text-sm text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
        Keys are generated locally with the Web Crypto API and never leave this page — nothing is
        sent anywhere.
      </div>

      <div className="mt-5">
        <KeyGenerator />
      </div>

      <h2 id="how-it-works" className="mt-10 scroll-mt-20 text-lg font-medium">
        How it works
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        orvacon signs the webhooks it sends to your app with Ed25519. The{" "}
        <strong className="font-medium text-foreground">secret key</strong> goes to{" "}
        <code>orvacon({"{ webhookSigningKey }"})</code> as an environment variable; the{" "}
        <strong className="font-medium text-foreground">public key</strong> goes to whoever verifies
        those deliveries. This is the same key format <code>orvacon keys</code> produces on the
        command line — generated here for convenience, never transmitted.
      </p>
    </DocPage>
  );
}
