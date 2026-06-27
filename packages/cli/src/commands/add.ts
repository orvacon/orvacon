import type { Command } from "commander";
import { addComponents } from "../registry/add";

/** Register `orvacon add <components...>` — install components from the registry. */
export function registerAdd(program: Command): void {
  program
    .command("add")
    .description("add orvacon UI components to your project from the registry")
    .argument("<components...>", "component names, @namespace/name refs, or registry URLs")
    .option("-p, --path <dir>", "write components here instead of components/orvacon")
    .option("--no-install", "skip installing npm dependencies")
    .action(async (components: string[], options: { path?: string; install: boolean }) => {
      const result = await addComponents(components, {
        cwd: process.cwd(),
        path: options.path,
        noInstall: !options.install,
      });
      process.stderr.write(
        `Added ${result.written.length} file(s):\n${result.written.map((file) => `  ${file}`).join("\n")}\n`,
      );
      if (result.shadcnDependencies.length > 0) {
        process.stderr.write(
          `\nThese shadcn base components are also required:\n  npx shadcn@latest add ${result.shadcnDependencies.join(" ")}\n`,
        );
      }
    });
}
