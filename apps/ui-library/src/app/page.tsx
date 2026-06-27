import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Command } from "@/components/command";
import { HomeDemo } from "@/components/home-demo";

export default function Home() {
  return (
    <div className="flex flex-col">
      <section className="mx-auto w-full max-w-6xl px-6 pt-16 pb-10 lg:px-10">
        <span className="inline-flex items-center rounded-full border bg-muted/40 px-3 py-1 text-xs font-medium text-muted-foreground">
          Part of orvacon · MIT licensed
        </span>
        <h1 className="mt-4 max-w-3xl text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
          Checkout components you actually own
        </h1>
        <p className="mt-4 max-w-2xl text-pretty text-lg text-muted-foreground">
          Type-safe React components for orvacon payments — copied into your app with the CLI. No
          black-box package, no runtime lock-in. Style them, ship them, keep them.
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Link
            href="/docs/installation"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Get started <ArrowRight className="size-4" />
          </Link>
          <Link
            href="/components/payment-status"
            className="inline-flex h-9 items-center rounded-lg border px-4 text-sm font-medium transition-colors hover:bg-accent"
          >
            Browse components
          </Link>
        </div>
        <div className="mt-6 max-w-md">
          <Command command="npx orvacon add payment-status" />
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-6 pb-20 lg:px-10">
        <HomeDemo />
      </section>
    </div>
  );
}
