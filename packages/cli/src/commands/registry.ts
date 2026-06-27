import type { Command } from "commander";
import { buildRegistry } from "../registry/build";

/** Register `orvacon registry build` — the author side of the component registry. */
export function registerRegistry(program: Command): void {
  const registry = program.command("registry").description("author the component registry");

  registry
    .command("build")
    .description("inline component sources into servable JSON")
    .argument("[registry]", "path to the source registry.json", "registry.json")
    .option("-o, --output <dir>", "destination directory for the built JSON", "public/r")
    .action(async (registryFile: string, options: { output: string }) => {
      const { items } = await buildRegistry({ registryFile, outDir: options.output });
      process.stderr.write(
        `Built ${items.length} registry item(s) -> ${options.output}\n${items.map((name) => `  ${name}`).join("\n")}\n`,
      );
    });
}
