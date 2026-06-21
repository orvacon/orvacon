import { DocsBody } from "fumadocs-ui/layouts/docs/page";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "@/components/icons";
import { getMDXComponents } from "@/components/mdx";
import { PostToc } from "@/components/post-toc";
import { formatDate } from "@/lib/date";
import { blogSource } from "@/lib/source";

export function generateStaticParams() {
  return blogSource.getPages().map((page) => ({ slug: page.slugs[0] }));
}

export async function generateMetadata(props: PageProps<"/blog/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const page = blogSource.getPage([slug]);
  if (!page) {
    notFound();
  }
  return { title: page.data.title, description: page.data.description };
}

export default async function BlogPost(props: PageProps<"/blog/[slug]">) {
  const { slug } = await props.params;
  const page = blogSource.getPage([slug]);
  if (!page) {
    notFound();
  }
  const Body = page.data.body;
  const toc = page.data.toc;

  return (
    <article>
      <header className="relative overflow-hidden border-b border-dashed border-[var(--guide)] px-6 pt-9 pb-[clamp(36px,5vw,56px)] text-center">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-[-70px] h-[360px] w-[130%] -translate-x-1/2 blur-[14px] [animation:orv-glow_6s_ease-in-out_infinite] [background:radial-gradient(46%_60%_at_50%_24%,color-mix(in_srgb,var(--accent)_16%,transparent),transparent_72%)]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-60 [background-image:radial-gradient(circle,var(--guide)_1px,transparent_1.2px)] [background-size:22px_22px] [mask-image:radial-gradient(78%_78%_at_50%_28%,#000,transparent)]"
        />
        <div className="relative z-[2] mx-auto max-w-[760px]">
          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 font-mono text-[12px] text-fg-dim transition-colors hover:text-fg"
          >
            <ArrowRight className="h-3.5 w-3.5 rotate-180" />
            Blog
          </Link>
          <div className="orv-eyebrow mt-7">{page.data.tag ?? "Writing"}</div>
          <h1 className="mx-auto mt-4 max-w-[20ch] text-[clamp(32px,5vw,54px)] font-semibold leading-[1.04] tracking-[-0.04em]">
            {page.data.title}
          </h1>
          <p className="mx-auto mt-5 max-w-[54ch] text-[clamp(16px,2vw,19px)] leading-[1.56] text-fg-dim">
            {page.data.description}
          </p>
          <div className="mt-7 flex items-center justify-center gap-3 font-mono text-[12.5px] text-fg-faint">
            <span className="text-fg-dim">{page.data.author}</span>
            <span className="h-1 w-1 rounded-full bg-[var(--mark)]" />
            <time dateTime={page.data.date}>{formatDate(page.data.date)}</time>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[720px] px-6 py-[clamp(40px,5vw,60px)] lg:max-w-[980px]">
        <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_190px] lg:gap-12">
          <div className="min-w-0 lg:max-w-[720px]">
            <DocsBody>
              <Body components={getMDXComponents()} />
            </DocsBody>
            <footer className="mt-14 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-7">
              <Link
                href="/blog"
                className="inline-flex items-center gap-1.5 font-mono text-[12.5px] text-fg-dim transition-colors hover:text-fg"
              >
                <ArrowRight className="h-3.5 w-3.5 rotate-180" />
                All posts
              </Link>
              <a
                href="https://github.com/orvacon/orvacon"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 font-mono text-[12.5px] text-accent transition-colors hover:text-fg"
              >
                Discuss on GitHub
                <ArrowRight className="h-3.5 w-3.5" />
              </a>
            </footer>
          </div>
          {toc.length > 0 ? (
            <aside className="hidden lg:block">
              <div className="sticky top-[84px]">
                <div className="orv-eyebrow mb-3">On this page</div>
                <PostToc items={toc} />
              </div>
            </aside>
          ) : null}
        </div>
      </div>
    </article>
  );
}
