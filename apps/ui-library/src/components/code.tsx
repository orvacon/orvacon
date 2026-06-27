import { CopyButton } from "@/components/copy-button";
import { type CodeLang, highlight } from "@/lib/highlight";
import { cn } from "@/lib/utils";

/** A syntax-highlighted code block with a copy button. Highlighted at build time. */
export async function Code({
  code,
  lang = "tsx",
  className,
}: {
  code: string;
  lang?: CodeLang;
  className?: string;
}) {
  const html = await highlight(code, lang);
  return (
    <div className={cn("group relative overflow-hidden rounded-lg border bg-muted/40", className)}>
      <CopyButton
        value={code}
        className="absolute top-2 right-2 z-10 opacity-0 transition-opacity focus-visible:opacity-100 group-hover:opacity-100"
      />
      <div
        className="code-block overflow-x-auto text-sm"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: trusted build-time Shiki output from in-repo source
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
