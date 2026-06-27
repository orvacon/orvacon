import { Command } from "@/components/command";
import { DocPage } from "@/components/doc-page";
import { PageHeader } from "@/components/page-header";
import { Tabs } from "@/components/tabs";

function NextSteps() {
  return (
    <ol className="space-y-5">
      <li>
        <p className="text-sm font-medium">1. Create a Next.js app</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Accept the Tailwind prompt and the styling layer is ready for you.
        </p>
        <div className="mt-2">
          <Command command="npx create-next-app@latest" />
        </div>
      </li>
      <li>
        <p className="text-sm font-medium">2. Add a component</p>
        <p className="mt-1 text-sm text-muted-foreground">
          The source, the <code>cn</code> helper, and any npm dependencies are written into your
          project.
        </p>
        <div className="mt-2">
          <Command command="npx orvacon add payment-status" />
        </div>
      </li>
    </ol>
  );
}

function ViteSteps() {
  return (
    <ol className="space-y-5">
      <li>
        <p className="text-sm font-medium">1. Create a Vite + React app</p>
        <div className="mt-2">
          <Command command="npm create vite@latest my-app -- --template react-ts" />
        </div>
      </li>
      <li>
        <p className="text-sm font-medium">2. Install Tailwind v4</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Add the plugin to <code>vite.config.ts</code> and the Tailwind import to your stylesheet.
        </p>
        <div className="mt-2">
          <Command command="npm install tailwindcss @tailwindcss/vite" />
        </div>
      </li>
      <li>
        <p className="text-sm font-medium">3. Add a component</p>
        <div className="mt-2">
          <Command command="npx orvacon add payment-status" />
        </div>
      </li>
    </ol>
  );
}

const toc = [
  { id: "add-a-component", title: "Add a component" },
  { id: "shadcn-cli", title: "Using the shadcn CLI" },
];

export default function InstallationPage() {
  return (
    <DocPage toc={toc}>
      <PageHeader
        eyebrow="Getting Started"
        title="Installation"
        description="orvacon ui ships as a registry, not a package — you copy the component source into your project and own it from there."
      />

      <p className="text-sm leading-relaxed text-muted-foreground">
        Every component is distributed through a shadcn-style registry. Adding one writes its source
        — plus the <code>cn</code> helper and any npm dependencies — straight into{" "}
        <code>components/orvacon</code>. There is no runtime package to install.
      </p>

      <h2 id="add-a-component" className="mt-10 scroll-mt-20 text-lg font-medium">
        Add a component
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Pick your framework. The component step is identical; only the Tailwind setup differs.
      </p>
      <div className="mt-4">
        <Tabs
          items={[
            { value: "next", label: "Next.js", content: <NextSteps /> },
            { value: "vite", label: "Vite", content: <ViteSteps /> },
          ]}
        />
      </div>

      <h2 id="shadcn-cli" className="mt-10 scroll-mt-20 text-lg font-medium">
        Using the shadcn CLI
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Already standardized on shadcn? Point its CLI at the registry URL — the items share the same
        format.
      </p>
      <div className="mt-3">
        <Command command="npx shadcn@latest add https://ui.orvacon.com/r/payment-status.json" />
      </div>
    </DocPage>
  );
}
