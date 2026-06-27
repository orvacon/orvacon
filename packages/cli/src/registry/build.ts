import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { assertSafePath, parseRegistry, parseRegistryItem } from "./schema";

const ITEM_SCHEMA_URL = "https://orvacon.com/schema/registry-item.json";

/** Options for {@link buildRegistry}. */
export interface BuildOptions {
  /** Path to the source `registry.json`. */
  registryFile: string;
  /** Directory the built `<name>.json` files are written into. */
  outDir: string;
}

/** Outcome of {@link buildRegistry}: the names of the items written. */
export interface BuildResult {
  items: string[];
}

/**
 * Turn a source `registry.json` plus its on-disk component files into served,
 * self-contained `<name>.json` blobs: read each file, inline its content,
 * re-validate the built item, and write one JSON per item (plus the registry
 * index). This is the author-side mirror of `orvacon add`.
 */
export async function buildRegistry(options: BuildOptions): Promise<BuildResult> {
  const registryPath = resolve(options.registryFile);
  const registry = parseRegistry(JSON.parse(await readFile(registryPath, "utf8")));
  const sourceRoot = dirname(registryPath);
  const outDir = resolve(options.outDir);
  await mkdir(outDir, { recursive: true });

  const built: string[] = [];
  for (const item of registry.items) {
    for (const file of item.files ?? []) {
      assertSafePath(file.path);
      file.content = await readFile(resolve(sourceRoot, file.path), "utf8");
    }
    const validated = parseRegistryItem(item);
    const output = { $schema: ITEM_SCHEMA_URL, ...validated };
    await writeFile(resolve(outDir, `${output.name}.json`), `${JSON.stringify(output, null, 2)}\n`);
    built.push(output.name);
  }

  await copyFile(registryPath, resolve(outDir, "registry.json"));
  return { items: built };
}
