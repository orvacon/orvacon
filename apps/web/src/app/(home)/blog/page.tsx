import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "@/components/icons";
import { PageHero } from "@/components/page-hero";
import { formatDate } from "@/lib/date";
import { blogSource } from "@/lib/source";

export const metadata: Metadata = {
  title: "Blog",
  description: "Notes on building orvacon — payments, types, and trust.",
};

export default function BlogPage() {
  const posts = [...blogSource.getPages()].sort((a, b) => b.data.date.localeCompare(a.data.date));

  return (
    <div className="orv-guides mx-auto max-w-[1232px] overflow-x-clip">
      <PageHero
        badge="Blog"
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
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
          </svg>
        }
        titleLead="Notes from"
        titleRest="building orvacon."
        lead="Payments, types, and trust — how orvacon is built and why. Occasional, and no fluff."
      />
      <section className="px-[clamp(24px,3.4vw,46px)] pb-[84px]">
        <div className="grid gap-[18px] sm:grid-cols-2">
          {posts.map((post) => (
            <Link
              key={post.url}
              href={post.url}
              className="group flex flex-col rounded-2xl border border-line bg-bg-2 p-6 transition-colors hover:border-[var(--accent-line)]"
            >
              {post.data.tag ? <div className="orv-eyebrow">{post.data.tag}</div> : null}
              <h2 className="mt-2.5 text-[18px] font-semibold tracking-[-0.015em] transition-colors group-hover:text-accent">
                {post.data.title}
              </h2>
              <p className="mt-2 flex-1 text-[14px] leading-[1.6] text-fg-dim">
                {post.data.description}
              </p>
              <div className="mt-5 flex items-center justify-between gap-3 border-t border-line pt-4">
                <span className="font-mono text-[11.5px] text-fg-faint">
                  {formatDate(post.data.date)} · {post.data.author}
                </span>
                <ArrowRight className="h-4 w-4 text-fg-faint transition-all group-hover:translate-x-0.5 group-hover:text-accent" />
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
