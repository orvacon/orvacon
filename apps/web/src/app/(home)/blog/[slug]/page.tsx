import { DocsBody } from "fumadocs-ui/layouts/docs/page";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "@/components/icons";
import { getMDXComponents } from "@/components/mdx";
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

  return (
    <div className="mx-auto max-w-[720px] px-6 py-[72px] sm:px-8">
      <Link
        href="/blog"
        className="inline-flex items-center gap-1.5 font-mono text-[12.5px] text-fg-dim transition-colors hover:text-fg"
      >
        <ArrowRight className="h-3.5 w-3.5 rotate-180" />
        Blog
      </Link>
      <header className="mt-8 border-b border-line pb-8">
        <h1 className="text-[clamp(32px,4.6vw,46px)] font-semibold leading-[1.08] tracking-[-0.035em]">
          {page.data.title}
        </h1>
        <p className="mt-4 text-[17px] leading-[1.55] text-fg-dim">{page.data.description}</p>
        <div className="mt-5 flex items-center gap-2.5 font-mono text-[12.5px] text-fg-faint">
          <span className="text-fg-dim">{page.data.author}</span>
          <span className="text-line-2">·</span>
          <time dateTime={page.data.date}>{formatDate(page.data.date)}</time>
        </div>
      </header>
      <DocsBody className="mt-8">
        <Body components={getMDXComponents()} />
      </DocsBody>
    </div>
  );
}
