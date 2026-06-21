import { metaSchema, pageSchema } from "fumadocs-core/source/schema";
import { defineCollections, defineConfig, defineDocs } from "fumadocs-mdx/config";
import { z } from "zod";

// You can customize Zod schemas for frontmatter and `meta.json` here
// see https://fumadocs.dev/docs/mdx/collections
export const docs = defineDocs({
  dir: "content/docs",
  docs: {
    schema: pageSchema,
    postprocess: {
      includeProcessedMarkdown: true,
    },
  },
  meta: {
    schema: metaSchema,
  },
});

export const blog = defineCollections({
  type: "doc",
  dir: "content/blog",
  schema: z.object({
    title: z.string(),
    description: z.string(),
    author: z.string(),
    date: z.string(),
    tag: z.string().optional(),
  }),
});

export const changelog = defineCollections({
  type: "doc",
  dir: "content/changelog",
  schema: z.object({
    title: z.string(),
    date: z.string(),
    tag: z.string().optional(),
  }),
});

export default defineConfig({
  mdxOptions: {
    // MDX options
  },
});
