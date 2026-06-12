import type { LedgerEntry } from "./database";
import type { PaymentId } from "./ids";
import type { Money } from "./money";

/** `prevHash` of the first entry in an empty ledger. */
export const LEDGER_GENESIS = "0".repeat(64);

/** The money movement a balanced ledger pair records. */
export type LedgerMovement = {
  paymentId: PaymentId;
  amount: Money;
  occurredAt: string;
  kind: "capture" | "refund";
};

async function sha256Hex(input: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

async function sealEntry(entry: Omit<LedgerEntry, "hash">): Promise<LedgerEntry> {
  const preimage = [
    entry.prevHash,
    entry.paymentId,
    entry.direction,
    entry.account,
    String(entry.amount.amount),
    entry.amount.currency,
    entry.occurredAt,
  ].join("\n");
  return { ...entry, hash: await sha256Hex(preimage) };
}

/**
 * Build the balanced double-entry pair for one movement, chained onto
 * `prevHash` (the current ledger head's hash, or {@link LEDGER_GENESIS}).
 * A capture moves value from the gateway clearing account to the merchant
 * receivable; a refund reverses it. Account naming is v1-minimal and will be
 * finalized with the reporting layer.
 */
export async function buildLedgerPair(
  prevHash: string,
  movement: LedgerMovement,
): Promise<readonly [LedgerEntry, LedgerEntry]> {
  const [debitAccount, creditAccount] =
    movement.kind === "capture"
      ? (["merchant_receivable", "gateway_clearing"] as const)
      : (["gateway_clearing", "merchant_receivable"] as const);
  const base = {
    paymentId: movement.paymentId,
    amount: movement.amount,
    occurredAt: movement.occurredAt,
  };
  const debit = await sealEntry({ ...base, direction: "debit", account: debitAccount, prevHash });
  const credit = await sealEntry({
    ...base,
    direction: "credit",
    account: creditAccount,
    prevHash: debit.hash,
  });
  return [debit, credit];
}
