#!/usr/bin/env node

const VERSION = "0.0.1";

const HELP = `orvacon — provider-agnostic, TypeScript-first payment orchestration

Usage
  orvacon <command> [options]

Commands
  (none yet — this release is a placeholder)

Options
  -v, --version   print the version
  -h, --help      show this help

Learn more: https://orvacon.com`;

function main(args: string[]): number {
  const arg = args[0];

  if (arg === "-v" || arg === "--version") {
    process.stdout.write(`${VERSION}\n`);
    return 0;
  }

  if (!arg || arg === "-h" || arg === "--help") {
    process.stdout.write(`${HELP}\n`);
    return 0;
  }

  process.stderr.write(`Unknown command: ${arg}\nRun: orvacon --help\n`);
  return 1;
}

process.exit(main(process.argv.slice(2)));
