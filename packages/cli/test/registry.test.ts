import { afterEach, describe, expect, test } from "bun:test";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { addComponents } from "../src/registry/add";
import { buildRegistry } from "../src/registry/build";
import { parseRegistryItem } from "../src/registry/schema";

const realFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = realFetch;
});

function tempDir(): Promise<string> {
  return mkdtemp(join(tmpdir(), "orva-reg-"));
}

function mockFetch(item: unknown, capture?: (url: string) => void): void {
  globalThis.fetch = (async (url: string) => {
    capture?.(url);
    return new Response(JSON.stringify(item), { status: 200 });
  }) as unknown as typeof fetch;
}

describe("registry schema", () => {
  test("rejects a traversal file path", () => {
    expect(() =>
      parseRegistryItem({
        name: "x",
        type: "registry:ui",
        files: [{ path: "../escape.tsx", type: "registry:ui" }],
      }),
    ).toThrow(/traversal/);
  });

  test("rejects an unknown type", () => {
    expect(() => parseRegistryItem({ name: "x", type: "registry:nope" })).toThrow(/unknown/);
  });
});

describe("registry build", () => {
  test("inlines file content, stamps $schema, and copies the index", async () => {
    const dir = await tempDir();
    await writeFile(
      join(dir, "registry.json"),
      JSON.stringify({
        name: "orvacon",
        homepage: "https://orvacon.com",
        items: [
          {
            name: "hello",
            type: "registry:ui",
            dependencies: ["clsx"],
            files: [{ path: "hello.tsx", type: "registry:ui" }],
          },
        ],
      }),
    );
    await writeFile(join(dir, "hello.tsx"), "export const Hello = () => null;\n");

    const outDir = join(dir, "out");
    const result = await buildRegistry({ registryFile: join(dir, "registry.json"), outDir });
    expect(result.items).toEqual(["hello"]);

    const built = JSON.parse(await readFile(join(outDir, "hello.json"), "utf8"));
    expect(built.$schema).toContain("registry-item.json");
    expect(built.files[0].content).toBe("export const Hello = () => null;\n");
    expect(await readFile(join(outDir, "registry.json"), "utf8")).toContain("hello");

    await rm(dir, { recursive: true, force: true });
  });
});

describe("orvacon add", () => {
  test("fetches a @namespace item, writes its files, reports npm and shadcn deps", async () => {
    const project = await tempDir();
    mockFetch({
      name: "payment-status",
      type: "registry:ui",
      dependencies: ["clsx"],
      registryDependencies: ["badge"],
      files: [
        {
          path: "payment-status.tsx",
          type: "registry:ui",
          content: "export const PaymentStatus = () => null;\n",
        },
      ],
    });

    const result = await addComponents(["@orvacon/payment-status"], {
      cwd: project,
      noInstall: true,
    });

    const written = await readFile(join(project, "components/orvacon/payment-status.tsx"), "utf8");
    expect(written).toContain("PaymentStatus");
    expect(result.npmDependencies).toEqual(["clsx"]);
    expect(result.shadcnDependencies).toEqual(["badge"]);

    await rm(project, { recursive: true, force: true });
  });

  test("resolves a bare top-level name against the default orvacon registry", async () => {
    const project = await tempDir();
    let fetched = "";
    mockFetch(
      {
        name: "payment-status",
        type: "registry:ui",
        files: [{ path: "payment-status.tsx", type: "registry:ui", content: "ok" }],
      },
      (url) => {
        fetched = url;
      },
    );

    const result = await addComponents(["payment-status"], { cwd: project, noInstall: true });
    expect(fetched).toContain("/r/payment-status.json");
    expect(result.written).toHaveLength(1);

    await rm(project, { recursive: true, force: true });
  });

  test("fetches a full URL ref directly", async () => {
    const project = await tempDir();
    let fetched = "";
    mockFetch(
      {
        name: "x",
        type: "registry:ui",
        files: [{ path: "x.tsx", type: "registry:ui", content: "x" }],
      },
      (url) => {
        fetched = url;
      },
    );

    await addComponents(["https://example.com/r/x.json"], { cwd: project, noInstall: true });
    expect(fetched).toBe("https://example.com/r/x.json");

    await rm(project, { recursive: true, force: true });
  });

  test("rejects a @namespace ref for an unconfigured registry", async () => {
    const project = await tempDir();
    expect(addComponents(["@nope/thing"], { cwd: project, noInstall: true })).rejects.toThrow(
      /not configured/,
    );
    await rm(project, { recursive: true, force: true });
  });
});
