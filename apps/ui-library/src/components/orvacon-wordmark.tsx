import type { CSSProperties } from "react";

/**
 * The orvacon wordmark, recolored with `currentColor` via a CSS mask so it adapts
 * to light and dark themes. Size it and set the text color through `className`
 * (e.g. `h-[18px] w-[60px] bg-current text-foreground`).
 */
const MASK: CSSProperties = {
  maskImage: "url(/orvacon-wordmark.svg)",
  maskRepeat: "no-repeat",
  maskSize: "contain",
  maskPosition: "left center",
  WebkitMaskImage: "url(/orvacon-wordmark.svg)",
  WebkitMaskRepeat: "no-repeat",
  WebkitMaskSize: "contain",
  WebkitMaskPosition: "left center",
};

export function OrvaconWordmark({ className }: { className?: string }) {
  return <span role="img" aria-label="orvacon" className={className} style={MASK} />;
}
