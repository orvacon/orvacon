import { DocPage } from "@/components/doc-page";
import { FileTree, type TreeNode } from "@/components/file-tree";
import { PageHeader } from "@/components/page-header";

const TREE: TreeNode[] = [
  {
    name: "your-app",
    children: [
      {
        name: "src",
        children: [
          {
            name: "components",
            children: [
              {
                name: "orvacon",
                children: [{ name: "payment-status.tsx", comment: "the component you added" }],
              },
            ],
          },
          {
            name: "lib",
            children: [{ name: "utils.ts", comment: "the shared cn() helper" }],
          },
        ],
      },
    ],
  },
];

const toc = [{ id: "why-copy", title: "Why copy instead of install?" }];

export default function FolderStructurePage() {
  return (
    <DocPage toc={toc}>
      <PageHeader
        eyebrow="Getting Started"
        title="Folder Structure"
        description="Where the CLI puts things — and why every file it writes is yours."
      />

      <p className="text-sm leading-relaxed text-muted-foreground">
        The CLI writes component source into a folder you control and drops the shared{" "}
        <code>cn</code> helper next to it. Nothing hides in <code>node_modules</code> — every file
        is yours to read, edit, and keep.
      </p>

      <div className="mt-6">
        <FileTree tree={TREE} />
      </div>

      <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
        Components land in <code>components/orvacon</code>, or <code>src/components/orvacon</code>{" "}
        when a <code>src</code> directory exists. Pass <code>--path</code> to{" "}
        <code>orvacon add</code> to send them somewhere else.
      </p>

      <h2 id="why-copy" className="mt-10 scroll-mt-20 text-lg font-medium">
        Why copy instead of install?
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        A checkout surface is something you restyle, reword, and adapt to your brand. Shipping it as
        source — the shadcn model — means upgrades never fight your customizations, and there is no
        opaque runtime dependency to audit on a page that handles payments.
      </p>
    </DocPage>
  );
}
