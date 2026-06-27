import { createHighlighter, type Highlighter } from "shiki";

let highlighterPromise: Promise<Highlighter> | null = null;

function getHighlighter(): Promise<Highlighter> {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: ["github-light", "github-dark"],
      langs: ["tsx", "bash", "json"],
    });
  }
  return highlighterPromise;
}

export type CodeLang = "tsx" | "bash" | "json";

/**
 * Highlight code to dual-theme HTML. Both themes are emitted as CSS variables so
 * the same markup recolors for light and dark without re-highlighting. Runs at
 * build time inside server components; the highlighter is created once and reused.
 */
export async function highlight(code: string, lang: CodeLang = "tsx"): Promise<string> {
  const highlighter = await getHighlighter();
  return highlighter.codeToHtml(code, {
    lang,
    themes: { light: "github-light", dark: "github-dark" },
    defaultColor: false,
  });
}
