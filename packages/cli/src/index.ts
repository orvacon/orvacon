#!/usr/bin/env node

import { generateSigningKeyPair } from "@orvacon/cryptokit";

const VERSION = "0.0.1";

const HELP = `orvacon — provider-agnostic, TypeScript-first payment orchestration

Usage
  orvacon <command> [options]

Commands
  keys            generate an Ed25519 webhook signing key pair

Options
  -v, --version   print the version
  -h, --help      show this help

Learn more: https://orvacon.com`;

const KEYS_GUIDANCE = `Generated an Ed25519 webhook signing key pair.

  ORVACON_WEBHOOK_SIGNING_KEY  secret — pass to orvacon({ webhookSigningKey }). Keep it in an env var; never commit it.
  ORVACON_WEBHOOK_PUBLIC_KEY   public — give to whoever verifies your webhooks. Safe to share.

The two ORVACON_* lines are written to stdout; redirect to capture them, e.g.  orvacon keys >> .env.local
`;

async function runKeys(): Promise<number> {
  const { publicKey, secretKey } = await generateSigningKeyPair();
  process.stdout.write(
    `ORVACON_WEBHOOK_SIGNING_KEY=${secretKey}\nORVACON_WEBHOOK_PUBLIC_KEY=${publicKey}\n`,
  );
  process.stderr.write(`\n${KEYS_GUIDANCE}`);
  return 0;
}

async function main(args: string[]): Promise<number> {
  const arg = args[0];

  if (arg === "-v" || arg === "--version") {
    process.stdout.write(`${VERSION}\n`);
    return 0;
  }

  if (arg === "keys") {
    const sub = args[1];
    if (sub !== undefined && sub !== "generate") {
      process.stderr.write(`Unknown subcommand: keys ${sub}\nRun: orvacon keys\n`);
      return 1;
    }
    return runKeys();
  }

  if (!arg || arg === "-h" || arg === "--help") {
    process.stdout.write(`${HELP}\n`);
    return 0;
  }

  process.stderr.write(`Unknown command: ${arg}\nRun: orvacon --help\n`);
  return 1;
}

main(process.argv.slice(2))
  .then((code) => process.exit(code))
  .catch((error: unknown) => {
    process.stderr.write(`orvacon: ${error instanceof Error ? error.message : String(error)}\n`);
    process.exit(1);
  });
