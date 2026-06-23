# orvacon brand

Logo set, rendered by [`../../scripts/gen-logo.mjs`](../../scripts/gen-logo.mjs)
(`bun scripts/gen-logo.mjs` from `apps/web`). Accent `#15B886`. The wordmark is
set in **Geist** — the typeface the site uses and the one `next/og` bundles as
its default, so the PNGs and the outlined SVGs share the same letterforms.

Two formats, by use:

- **PNG** — solid themed background, baked in. For places that need an opaque
  image: GitHub org avatar, social cards, app icons. `1024×1024` square, plus a
  `1280×420` `-wide` rectangle for banners.
- **SVG** — transparent, foreground only, glyphs outlined to paths (no font
  needed at render). For READMEs, docs, and slides — scales to any size.

Append `-light` for light backgrounds (the foreground flips dark). The
accent-only marks are background-agnostic, so they ship as a single file each.

| File | Use |
| --- | --- |
| `orvacon-mark.{png,svg}` | **Icon / avatar** — the ring is the "o". Org avatar, app icons, favicon. Reads at any size. |
| `orvacon-wide.{png,svg}` | **Rectangular lockup** — mark beside the wordmark. The README / banner asset. |
| `orvacon-lockup.{png,svg}` | **Stacked logo** — mark over the wordmark. Headers, slides, square-ish space. |
| `orvacon-wordmark.{png,svg}` | Wordmark only, for inline or wide contexts. |
| `orvacon-wordmark-accent.{png,svg}` | Wordmark in accent green. |

`*-light.*` exist for every foreground-colored asset above. `orvacon-mark.svg`
and `orvacon-wordmark-accent.svg` have no `-light` twin — accent green works on
either background.
