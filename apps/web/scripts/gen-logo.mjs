import { mkdirSync, writeFileSync } from "node:fs";
import { ImageResponse } from "next/og";
import { createElement as h } from "react";

const OUT = "public/brand";
mkdirSync(OUT, { recursive: true });

const ACCENT = "#15b886";
const SIZE = { width: 1024, height: 1024 };

const THEMES = {
  dark: { bg: "#08080a", fg: "#f4f3f1" },
  light: { bg: "#fbfbfa", fg: "#15151a" },
};

const ring = (outer, border) =>
  h("div", {
    style: {
      display: "flex",
      width: outer,
      height: outer,
      borderRadius: 9999,
      border: `${border}px solid ${ACCENT}`,
    },
  });

const word = (size, color) =>
  h(
    "div",
    { style: { fontSize: size, fontWeight: 600, letterSpacing: "-0.05em", color } },
    "orvacon",
  );

const center = (bg, child, direction = "row", gap = 0) =>
  h(
    "div",
    {
      style: {
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: direction,
        alignItems: "center",
        justifyContent: "center",
        gap,
        background: bg,
      },
    },
    child,
  );

async function save(element, name) {
  const buf = Buffer.from(await new ImageResponse(element, SIZE).arrayBuffer());
  writeFileSync(`${OUT}/${name}`, buf);
  console.log("wrote", name, buf.length, "bytes");
}

for (const [theme, { bg, fg }] of Object.entries(THEMES)) {
  const suffix = theme === "light" ? "-light" : "";
  await save(center(bg, ring(600, 96)), `orvacon-mark${suffix}.png`);
  await save(center(bg, word(168, fg)), `orvacon-wordmark${suffix}.png`);
  await save(center(bg, word(168, ACCENT)), `orvacon-wordmark-accent${suffix}.png`);
  await save(
    center(bg, [ring(320, 50), word(100, fg)], "column", 60),
    `orvacon-lockup${suffix}.png`,
  );
}
console.log("done");
