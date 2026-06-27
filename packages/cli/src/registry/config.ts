import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

const DEFAULT_REGISTRY_URL = "https://orvacon.com/r/{name}.json";

/** Resolved consumer configuration for `add`. */
export interface AddConfig {
  cwd: string;
  /** `@namespace` → a URL template containing `{name}`. */
  registries: Record<string, string>;
  /** Directory that bare component / ui files are written into. */
  targetDir: string;
}

/**
 * Resolve which registries to read and where to install. Reads the project's
 * `components.json` `registries` block if present — so a shared shadcn config Just
 * Works — and otherwise falls back to the public orvacon registry and a
 * `components/orvacon` target (`src/` aware). `ORVACON_REGISTRY_URL` overrides the
 * default URL, which is how `add` is pointed at a local build during development.
 */
export async function loadConfig(cwd: string, pathOverride?: string): Promise<AddConfig> {
  const registries: Record<string, string> = {
    "@orvacon": process.env.ORVACON_REGISTRY_URL ?? DEFAULT_REGISTRY_URL,
  };

  const componentsJson = join(cwd, "components.json");
  if (existsSync(componentsJson)) {
    try {
      const raw = JSON.parse(await readFile(componentsJson, "utf8")) as {
        registries?: Record<string, unknown>;
      };
      for (const [name, value] of Object.entries(raw.registries ?? {})) {
        if (typeof value === "string") {
          registries[name] = value;
        }
      }
    } catch {
      // A malformed components.json shouldn't block an add — fall back to defaults.
    }
  }

  const targetDir =
    pathOverride ??
    (existsSync(join(cwd, "src")) ? "src/components/orvacon" : "components/orvacon");
  return { cwd, registries, targetDir };
}
