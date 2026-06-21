import type { MetadataRoute } from "next";
import { blogSource, source } from "@/lib/source";

const base = "https://orvacon.com";

const marketing = [
  "",
  "/architecture",
  "/connectors",
  "/security",
  "/pricing",
  "/use-cases",
  "/roadmap",
  "/changelog",
  "/blog",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = marketing.map((route) => ({
    url: `${base}${route}`,
    changeFrequency: "weekly",
    priority: route === "" ? 1 : 0.7,
  }));

  for (const page of source.getPages()) {
    entries.push({ url: `${base}${page.url}`, changeFrequency: "weekly", priority: 0.6 });
  }

  for (const page of blogSource.getPages()) {
    entries.push({ url: `${base}${page.url}`, changeFrequency: "monthly", priority: 0.6 });
  }

  return entries;
}
