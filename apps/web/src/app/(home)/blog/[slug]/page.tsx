import { DocsBody } from "fumadocs-ui/layouts/docs/page";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "@/components/icons";
import { getMDXComponents } from "@/components/mdx";
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
    <article className="orv-guides mx-auto max-w-[1232px] px-[clamp(24px,3.4vw,46px)] py-[72px]">
      <Link
        href="/blog"
        className="inline-flex items-center gap-1.5 font-mono text-[12.5px] text-fg-dim transition-colors hover:text-fg"
      >
        <ArrowRight className="h-3.5 w-3.5 rotate-180" />
        Blog
      </Link>
      <h1 className="mt-7 max-w-[24ch] text-[clamp(30px,4.4vw,52px)] font-semibold leading-[1.05] tracking-[-0.035em]">
        {page.data.title}
      </h1>
      <div className="mt-4 font-mono text-[13px] text-fg-faint">
        {page.data.date} · {page.data.author}
      </div>
      <DocsBody className="mt-9">
        <Body components={getMDXComponents()} />
      </DocsBody>
    </article>
  );
}
