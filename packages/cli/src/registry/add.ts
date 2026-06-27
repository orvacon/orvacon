import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { basename, dirname, join } from "node:path";
import { type AddConfig, loadConfig } from "./config";
import { parseRegistryItem, type RegistryFile, type RegistryItem } from "./schema";

/** Options for {@link addComponents}. */
export interface AddOptions {
  cwd: string;
  /** Write components here instead of the default `components/orvacon`. */
  path?: string;
  /** Skip installing npm dependencies. */
  noInstall?: boolean;
}

/** What {@link addComponents} did. */
export interface AddResult {
  written: string[];
  npmDependencies: string[];
  /** Bare registry deps (shadcn base components) the user should add with shadcn. */
  shadcnDependencies: string[];
}

/**
 * Turn a registry reference into a fetch URL, or `null` for a bare name. A bare
 * name (`button`) is a shadcn base component orvacon doesn't serve; `@ns/name`
 * resolves through the configured registries; a full URL is fetched directly.
 */
function urlFor(ref: string, registries: Record<string, string>): string | null {
  if (/^https?:\/\//i.test(ref)) {
    return ref;
  }
  if (ref.startsWith("@")) {
    const slash = ref.indexOf("/");
    if (slash < 0) {
      throw new Error(`orvacon add: "${ref}" is missing an item name (expected @namespace/name)`);
    }
    const namespace = ref.slice(0, slash);
    const template = registries[namespace];
    if (!template) {
      throw new Error(
        `orvacon add: registry "${namespace}" is not configured — add it to components.json "registries"`,
      );
    }
    return template.replace("{name}", ref.slice(slash + 1));
  }
  return null;
}

async function fetchItem(url: string): Promise<RegistryItem> {
  let response: Response;
  try {
    response = await fetch(url, { headers: { Accept: "application/json" } });
  } catch (error) {
    throw new Error(`orvacon add: could not reach ${url} (${(error as Error).message})`);
  }
  if (!response.ok) {
    throw new Error(`orvacon add: ${response.status} fetching ${url}`);
  }
  return parseRegistryItem(await response.json());
}

interface Tree {
  items: RegistryItem[];
  npm: string[];
  shadcn: string[];
}

/** Fetch each ref and recurse its `registryDependencies`, guarding cycles via `seen`. */
async function resolveTree(
  refs: readonly string[],
  registries: Record<string, string>,
  seen: Set<string>,
  tree: Tree,
): Promise<Tree> {
  for (const ref of refs) {
    if (seen.has(ref)) {
      continue;
    }
    seen.add(ref);
    const url = urlFor(ref, registries);
    if (url === null) {
      tree.shadcn.push(ref);
      continue;
    }
    const item = await fetchItem(url);
    tree.items.push(item);
    tree.npm.push(...(item.dependencies ?? []));
    if (item.registryDependencies?.length) {
      await resolveTree(item.registryDependencies, registries, seen, tree);
    }
  }
  return tree;
}

/** Where a file lands: its explicit `target` (`~/` cwd, `@/` src-or-root), else the target dir. */
function destinationFor(file: RegistryFile, config: AddConfig): string {
  if (file.target) {
    if (file.target.startsWith("~/")) {
      return join(config.cwd, file.target.slice(2));
    }
    if (file.target.startsWith("@/")) {
      const root = existsSync(join(config.cwd, "src")) ? "src" : ".";
      return join(config.cwd, root, file.target.slice(2));
    }
    return join(config.cwd, file.target);
  }
  return join(config.cwd, config.targetDir, basename(file.path));
}

function detectPackageManager(cwd: string): string {
  if (existsSync(join(cwd, "bun.lock")) || existsSync(join(cwd, "bun.lockb"))) {
    return "bun";
  }
  if (existsSync(join(cwd, "pnpm-lock.yaml"))) {
    return "pnpm";
  }
  if (existsSync(join(cwd, "yarn.lock"))) {
    return "yarn";
  }
  return "npm";
}

function installNpm(cwd: string, dependencies: string[]): void {
  const pm = detectPackageManager(cwd);
  const result = spawnSync(pm, ["add", ...dependencies], { cwd, stdio: "inherit" });
  if (result.status !== 0) {
    process.stderr.write(
      `orvacon add: "${pm} add" failed — install these manually: ${dependencies.join(" ")}\n`,
    );
  }
}

/**
 * Add one or more orvacon components to the project: fetch each item from the
 * configured registry, follow its registry dependencies, write the files (last
 * write to a path wins), and install npm dependencies. Bare registry dependencies
 * (shadcn base components) are returned for the user to add with shadcn.
 */
export async function addComponents(
  refs: readonly string[],
  options: AddOptions,
): Promise<AddResult> {
  const config = await loadConfig(options.cwd, options.path);
  const tree = await resolveTree(refs, config.registries, new Set(), {
    items: [],
    npm: [],
    shadcn: [],
  });
  if (tree.items.length === 0) {
    throw new Error("orvacon add: nothing to add");
  }

  const files = new Map<string, string>();
  for (const item of tree.items) {
    for (const file of item.files ?? []) {
      files.set(destinationFor(file, config), file.content ?? "");
    }
  }
  for (const [destination, content] of files) {
    await mkdir(dirname(destination), { recursive: true });
    await writeFile(destination, content);
  }

  const npmDependencies = [...new Set(tree.npm)];
  if (!options.noInstall && npmDependencies.length > 0) {
    installNpm(config.cwd, npmDependencies);
  }

  return {
    written: [...files.keys()],
    npmDependencies,
    shadcnDependencies: [...new Set(tree.shadcn)],
  };
}
