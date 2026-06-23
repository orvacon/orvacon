import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { ImageResponse } from "next/og";
import opentype from "opentype.js";
import { createElement as h } from "react";

const require = createRequire(import.meta.url);
const OUT = "public/brand";
mkdirSync(OUT, { recursive: true });

const ACCENT = "#15b886";
const THEMES = {
  dark: { bg: "#08080a", fg: "#f4f3f1" },
  light: { bg: "#fbfbfa", fg: "#15151a" },
};

const WORD = "orvacon";
const TRACKING = -0.05; // em — matches the wordmark letter-spacing

// Geist-Regular is the face next/og renders the PNGs with; reuse it so the
// outlined SVGs match the rasters exactly.
const fontFile = join(
  dirname(require.resolve("next/package.json")),
  "dist/compiled/@vercel/og/Geist-Regular.ttf",
);
const fontData = readFileSync(fontFile);
const font = opentype.parse(
  fontData.buffer.slice(fontData.byteOffset, fontData.byteOffset + fontData.byteLength),
);

const round = (n) => Math.round(n * 100) / 100;

// --- PNG (next/og) -----------------------------------------------------------

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
  h("div", { style: { fontSize: size, fontWeight: 600, letterSpacing: "-0.05em", color } }, WORD);

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

async function savePng(element, name, size) {
  const buf = Buffer.from(await new ImageResponse(element, size).arrayBuffer());
  writeFileSync(`${OUT}/${name}`, buf);
  console.log("wrote", name, buf.length, "bytes");
}

const SQUARE = { width: 1024, height: 1024 };
const WIDE = { width: 1280, height: 420 };

// --- SVG (outlined, transparent) ---------------------------------------------

/** "orvacon" outlined at x=0, baseline=0 — path data + its tight bounding box. */
function measureWord(fontSize) {
  const scale = fontSize / font.unitsPerEm;
  const track = TRACKING * fontSize;
  const full = new opentype.Path();
  let pen = 0;
  for (const glyph of font.stringToGlyphs(WORD)) {
    full.extend(glyph.getPath(pen, 0, fontSize));
    pen += glyph.advanceWidth * scale + track;
  }
  const bb = full.getBoundingBox();
  return { d: full.toPathData(2), x1: bb.x1, y1: bb.y1, w: bb.x2 - bb.x1, h: bb.y2 - bb.y1 };
}

const svgDoc = (w, h, body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${round(w)}" height="${round(h)}" viewBox="0 0 ${round(w)} ${round(h)}" fill="none" role="img" aria-label="orvacon">\n${body}\n</svg>\n`;

// Place the word (local origin x=0/baseline=0) so its top-left lands at (tx,ty).
const wordAt = (m, tx, ty, fill) =>
  `  <path transform="translate(${round(tx - m.x1)} ${round(ty - m.y1)})" d="${m.d}" fill="${fill}"/>`;

const ringAt = (cx, cy, rad, sw) =>
  `  <circle cx="${round(cx)}" cy="${round(cy)}" r="${round(rad)}" stroke="${ACCENT}" stroke-width="${round(sw)}"/>`;

function svgMark() {
  const outer = 600;
  const border = 96;
  const pad = 40;
  const c = pad + outer / 2;
  return svgDoc(outer + pad * 2, outer + pad * 2, ringAt(c, c, (outer - border) / 2, border));
}

function svgWordmark(fill) {
  const m = measureWord(168);
  const pad = 56;
  return svgDoc(m.w + pad * 2, m.h + pad * 2, wordAt(m, pad, pad, fill));
}

function svgLockup(fill) {
  const outer = 320;
  const border = 50;
  const gap = 60;
  const pad = 56;
  const m = measureWord(100);
  const w = Math.max(outer, m.w) + pad * 2;
  const wordTop = pad + outer + gap;
  return svgDoc(
    w,
    wordTop + m.h + pad,
    [
      ringAt(w / 2, pad + outer / 2, (outer - border) / 2, border),
      wordAt(m, (w - m.w) / 2, wordTop, fill),
    ].join("\n"),
  );
}

function svgWide(fill) {
  const outer = 150;
  const border = 24;
  const gap = 56;
  const pad = 64;
  const m = measureWord(150);
  const h = Math.max(outer, m.h) + pad * 2;
  const wordX = pad + outer + gap;
  return svgDoc(
    wordX + m.w + pad,
    h,
    [
      ringAt(pad + outer / 2, h / 2, (outer - border) / 2, border),
      wordAt(m, wordX, (h - m.h) / 2, fill),
    ].join("\n"),
  );
}

function saveSvg(name, svg) {
  writeFileSync(`${OUT}/${name}`, svg);
  console.log("wrote", name, svg.length, "bytes");
}

// --- generate ----------------------------------------------------------------

for (const [theme, { bg, fg }] of Object.entries(THEMES)) {
  const s = theme === "light" ? "-light" : "";
  // PNG — solid themed background (org avatars, social, anywhere a baked bg helps)
  await savePng(center(bg, ring(600, 96)), `orvacon-mark${s}.png`, SQUARE);
  await savePng(center(bg, word(168, fg)), `orvacon-wordmark${s}.png`, SQUARE);
  await savePng(center(bg, word(168, ACCENT)), `orvacon-wordmark-accent${s}.png`, SQUARE);
  await savePng(
    center(bg, [ring(320, 50), word(100, fg)], "column", 60),
    `orvacon-lockup${s}.png`,
    SQUARE,
  );
  await savePng(
    center(bg, [ring(220, 34), word(150, fg)], "row", 52),
    `orvacon-wide${s}.png`,
    WIDE,
  );
  // SVG — transparent, foreground-only (READMEs, docs, decks)
  saveSvg(`orvacon-wordmark${s}.svg`, svgWordmark(fg));
  saveSvg(`orvacon-lockup${s}.svg`, svgLockup(fg));
  saveSvg(`orvacon-wide${s}.svg`, svgWide(fg));
}
// Accent-only marks are background-agnostic — one file each, no theme split.
saveSvg("orvacon-mark.svg", svgMark());
saveSvg("orvacon-wordmark-accent.svg", svgWordmark(ACCENT));

console.log("done");
