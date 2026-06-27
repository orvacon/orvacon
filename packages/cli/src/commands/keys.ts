import { generateSigningKeyPair } from "@orvacon/cryptokit";
import type { Command } from "commander";

const KEYS_GUIDANCE = `Generated an Ed25519 webhook signing key pair.

  ORVACON_WEBHOOK_SIGNING_KEY  secret — pass to orvacon({ webhookSigningKey }). Keep it in an env var; never commit it.
  ORVACON_WEBHOOK_PUBLIC_KEY   public — give to whoever verifies your webhooks. Safe to share.

The two ORVACON_* lines are written to stdout; redirect to capture them, e.g.  orvacon keys >> .env.local
`;

/** Register `orvacon keys` — generate an Ed25519 webhook signing key pair. */
export function registerKeys(program: Command): void {
  program
    .command("keys")
    .description("generate an Ed25519 webhook signing key pair")
    .action(async () => {
      const { publicKey, secretKey } = await generateSigningKeyPair();
      process.stdout.write(
        `ORVACON_WEBHOOK_SIGNING_KEY=${secretKey}\nORVACON_WEBHOOK_PUBLIC_KEY=${publicKey}\n`,
      );
      process.stderr.write(`\n${KEYS_GUIDANCE}`);
    });
}
