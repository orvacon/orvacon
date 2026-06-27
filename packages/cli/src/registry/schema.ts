/**
 * The registry format orvacon authors and serves. A deliberate subset of the
 * shadcn `registry-item.json` shape, so a component published here also installs
 * via `npx shadcn add @orvacon/<name>` — interop for free. Validation is
 * hand-rolled (no schema dependency) and the path checks are the security
 * boundary: a fetched item drives file writes, so an unsafe path must be rejected.
 */

/** The file/item kinds orvacon distributes. */
export type RegistryType =
  | "registry:ui"
  | "registry:component"
  | "registry:lib"
  | "registry:hook"
  | "registry:file";

/** One file an item ships. `content` is inlined by the build. */
export interface RegistryFile {
  /** Path to the source file, relative to the `registry.json` that declares it. */
  path: string;
  /** The file's source, inlined at build time and read by `add`. */
  content?: string;
  type: RegistryType;
  /** Where to write the file in the consumer's project. Required for `registry:file`. */
  target?: string;
}

/** A registry item — one installable unit: a component plus its files and deps. */
export interface RegistryItem {
  $schema?: string;
  name: string;
  type: RegistryType;
  title?: string;
  description?: string;
  /** npm runtime dependencies to install. */
  dependencies?: string[];
  /** npm dev dependencies to install. */
  devDependencies?: string[];
  /** Other registry items this one needs — bare names, `@ns/name`, or URLs. */
  registryDependencies?: string[];
  files?: RegistryFile[];
}

/** A source registry index: every item the registry serves. */
export interface Registry {
  name: string;
  homepage: string;
  items: RegistryItem[];
}

const TYPES: ReadonlySet<string> = new Set<RegistryType>([
  "registry:ui",
  "registry:component",
  "registry:lib",
  "registry:hook",
  "registry:file",
]);

/**
 * Reject a file path that could escape its destination root — an absolute path,
 * a Windows drive path, a URL, or a `..` traversal. Enforced both when building
 * (reading source files) and before any write by `add`.
 */
export function assertSafePath(path: string): void {
  if (
    /^[a-z][a-z\d+.-]*:\/\//i.test(path) ||
    path.startsWith("/") ||
    /^[A-Za-z]:[\\/]/.test(path)
  ) {
    throw new Error(`orvacon registry: unsafe file path (absolute or URL): ${path}`);
  }
  if (path.split(/[\\/]/).includes("..")) {
    throw new Error(`orvacon registry: unsafe file path (traversal): ${path}`);
  }
}

function asString(value: unknown, field: string): string {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`orvacon registry: ${field} must be a non-empty string`);
  }
  return value;
}

function asStringArray(value: unknown, field: string): string[] | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (!Array.isArray(value) || value.some((entry) => typeof entry !== "string")) {
    throw new Error(`orvacon registry: ${field} must be an array of strings`);
  }
  return value as string[];
}

function asType(value: unknown, field: string): RegistryType {
  const type = asString(value, field);
  if (!TYPES.has(type)) {
    throw new Error(`orvacon registry: unknown ${field} "${type}"`);
  }
  return type as RegistryType;
}

function parseFile(value: unknown): RegistryFile {
  if (typeof value !== "object" || value === null) {
    throw new Error("orvacon registry: each file must be an object");
  }
  const raw = value as Record<string, unknown>;
  const path = asString(raw.path, "file.path");
  assertSafePath(path);
  const type = asType(raw.type, "file.type");
  if (type === "registry:file" && typeof raw.target !== "string") {
    throw new Error(`orvacon registry: file.target is required for registry:file (${path})`);
  }
  const file: RegistryFile = { path, type };
  if (typeof raw.content === "string") {
    file.content = raw.content;
  }
  if (typeof raw.target === "string") {
    file.target = raw.target;
  }
  return file;
}

/** Validate and narrow an unknown value (e.g. fetched JSON) to a {@link RegistryItem}. */
export function parseRegistryItem(value: unknown): RegistryItem {
  if (typeof value !== "object" || value === null) {
    throw new Error("orvacon registry: item must be an object");
  }
  const raw = value as Record<string, unknown>;
  const item: RegistryItem = {
    name: asString(raw.name, "item.name"),
    type: asType(raw.type, "item.type"),
  };
  if (typeof raw.title === "string") {
    item.title = raw.title;
  }
  if (typeof raw.description === "string") {
    item.description = raw.description;
  }
  item.dependencies = asStringArray(raw.dependencies, "dependencies");
  item.devDependencies = asStringArray(raw.devDependencies, "devDependencies");
  item.registryDependencies = asStringArray(raw.registryDependencies, "registryDependencies");
  if (raw.files !== undefined) {
    if (!Array.isArray(raw.files)) {
      throw new Error("orvacon registry: files must be an array");
    }
    item.files = raw.files.map(parseFile);
  }
  return item;
}

/** Validate and narrow a source `registry.json` to a {@link Registry}. */
export function parseRegistry(value: unknown): Registry {
  if (typeof value !== "object" || value === null) {
    throw new Error("orvacon registry: registry.json must be an object");
  }
  const raw = value as Record<string, unknown>;
  if (!Array.isArray(raw.items)) {
    throw new Error("orvacon registry: registry.items must be an array");
  }
  return {
    name: asString(raw.name, "name"),
    homepage: asString(raw.homepage, "homepage"),
    items: raw.items.map(parseRegistryItem),
  };
}
