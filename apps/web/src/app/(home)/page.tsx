import { Comparison } from "@/components/home/comparison";
import { Definition } from "@/components/home/definition";
import { Features } from "@/components/home/features";
import { Hero } from "@/components/home/hero";
import { Overview } from "@/components/home/overview";
import { Status } from "@/components/home/status";
import { ThreeDS } from "@/components/home/three-ds";

export default function HomePage() {
  return (
    <div className="orv-guides mx-auto max-w-[1232px] overflow-x-clip">
      <Hero />
      <Overview />
      <Comparison />
      <Features />
      <ThreeDS />
      <Definition />
      <Status />
    </div>
  );
}
