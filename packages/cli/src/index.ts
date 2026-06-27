#!/usr/bin/env node

import { Command } from "commander";
import { version } from "../package.json";
import { registerAdd } from "./commands/add";
import { registerGenerate } from "./commands/generate";
import { registerKeys } from "./commands/keys";
import { registerRegistry } from "./commands/registry";

const program = new Command();

program
  .name("orvacon")
  .description("provider-agnostic, TypeScript-first payment orchestration")
  .version(version, "-v, --version", "print the version")
  .showHelpAfterError()
  .addHelpText("after", "\nLearn more: https://orvacon.com");

registerAdd(program);
registerGenerate(program);
registerKeys(program);
registerRegistry(program);

// Bare `orvacon` prints help (exit 0) rather than erroring on a missing command.
if (process.argv.length <= 2) {
  program.help();
}

program.parseAsync(process.argv).catch((error: unknown) => {
  process.stderr.write(`orvacon: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
});
