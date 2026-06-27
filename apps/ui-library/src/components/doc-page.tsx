import type { ReactNode } from "react";
import { Toc, type TocItem } from "@/components/toc";

/** Docs content column with an optional right-rail table of contents. */
export function DocPage({ toc, children }: { toc?: TocItem[]; children: ReactNode }) {
  return (
    <div className="mx-auto flex w-full max-w-6xl gap-10 px-6 py-12 lg:px-10">
      <article className="min-w-0 max-w-3xl flex-1">{children}</article>
      {toc && toc.length > 0 ? (
        <aside className="sticky top-20 hidden h-fit w-52 shrink-0 xl:block">
          <Toc items={toc} />
        </aside>
      ) : null}
    </div>
  );
}
