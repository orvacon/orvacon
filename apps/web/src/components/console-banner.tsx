"use client";

import { useEffect, useRef } from "react";

/**
 * ConsoleBanner
 *
 * Prints an ASCII banner + links to the browser console exactly once.
 *
 * Why the ref guard?
 *   In dev, React StrictMode mounts -> unmounts -> remounts every component,
 *   so a plain useEffect fires TWICE and the banner prints twice. The
 *   `hasRun` ref makes the effect idempotent without disabling StrictMode.
 *
 * Why an array (not a template string)?
 *   The "slant" ASCII contains backticks and backslashes that are painful
 *   to escape inside a template literal. Joining an array keeps it clean.
 *
 * Why inside useEffect (not module top-level)?
 *   Top-level runs on the server too (Next.js SSR) and can pollute server
 *   logs. useEffect guarantees client-only execution.
 */

const BANNER = [
  "  ____  ______   ______ __________  ____ ",
  " / __ \\/ ___/ | / / __ `/ ___/ __ \\/ __ \\",
  "/ /_/ / /   | |/ / /_/ / /__/ /_/ / / / /",
  "\\____/_/    |___/\\__,_/\\___/\\____/_/ /_/ ",
].join("\n");

const LINKS: { label: string; url: string }[] = [
  { label: "Website", url: "https://orvacon.com" },
  { label: "Docs", url: "https://orvacon.com/docs" },
  { label: "Careers", url: "https://orvacon.com/careers" },
  { label: "Status", url: "https://status.orvacon.com" },
];

export function ConsoleBanner() {
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    console.log(
      `%c${BANNER}`,
      "color:#15b886;font-family:monospace;font-weight:700;line-height:1.15;",
    );

    LINKS.forEach(({ label, url }) => {
      console.log(
        `%c- ${label} %c${url}`,
        "color:#999;font-family:monospace;",
        "color:#7c3aed;font-family:monospace;",
      );
    });
  }, []);

  return null;
}
