import { Comparison } from "@/components/home/comparison";
import { Features } from "@/components/home/features";
import { Hero } from "@/components/home/hero";
import { Overview } from "@/components/home/overview";

export default function HomePage() {
  return (
    <div className="orv-guides mx-auto max-w-[1232px] overflow-x-clip">
      <Hero />
      <Overview />
      <Comparison />
      <Features />
    </div>
  );
}
