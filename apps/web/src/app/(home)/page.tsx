import { CTA } from "@/components/cta";
import { Bento } from "@/components/home/bento";
import { Changelog } from "@/components/home/changelog";
import { Comparison } from "@/components/home/comparison";
import { Definition } from "@/components/home/definition";
import { Features } from "@/components/home/features";
import { GetStarted } from "@/components/home/get-started";
import { Hero } from "@/components/home/hero";
import { Lead } from "@/components/home/lead";
import { Marquee } from "@/components/home/marquee";
import { Overview } from "@/components/home/overview";
import { Principles } from "@/components/home/principles";
import { Status } from "@/components/home/status";
import { ThreeDS } from "@/components/home/three-ds";

export default function HomePage() {
  return (
    <>
      <div className="orv-guides mx-auto max-w-[1232px] overflow-x-clip">
        <Hero />
        <Marquee />
        <Lead />
        <Overview />
        <Comparison />
        <Features />
        <ThreeDS />
        <Definition />
        <Principles />
        <Status />
        <Bento />
        <GetStarted />
        <Changelog />
      </div>
      <CTA />
    </>
  );
}
