import type { LedgerEntry } from "@orvacon/paykit";

/** One exported ledger leg in double-entry shape — exactly one of `debit` / `credit` is filled. */
export interface LedgerRow {
  date: string;
  paymentId: string;
  account: string;
  debit: string;
  credit: string;
  currency: string;
  hash: string;
}

/** Options for {@link ledgerkit}. */
export interface LedgerkitOptions {
  /** BCP-47 locale, used only to resolve each currency's decimal scale. Defaults to the runtime's. */
  locale?: string;
}

/** Result of {@link Ledgerkit.verifyChain}. */
export type ChainCheck = { ok: true } | { ok: false; brokenAt: number };

/** What {@link ledgerkit} returns. */
export interface Ledgerkit {
  /** Convert ledger entries to double-entry rows. */
  toRows: (entries: readonly LedgerEntry[]) => LedgerRow[];
  /** Export ledger entries as CSV (RFC 4180) for import into accounting software. */
  toCsv: (entries: readonly LedgerEntry[]) => string;
  /** Verify the hash chain links: each entry's `prevHash` must equal the previous entry's `hash`. */
  verifyChain: (entries: readonly LedgerEntry[]) => ChainCheck;
}

const COLUMNS = ["date", "paymentId", "account", "debit", "credit", "currency", "hash"] as const;

/**
 * Export and audit orvacon's hash-chained ledger. The core already keeps a
 * tamper-evident double-entry ledger; ledgerkit turns a slice of it into a CSV
 * your accountant can import, and re-checks the chain links. It's stateless —
 * you fetch the {@link LedgerEntry} rows, it formats and verifies them.
 *
 * ```ts
 * const lk = ledgerkit();
 * const csv = lk.toCsv(entries); // → accounting import
 * lk.verifyChain(entries);       // → { ok: true } | { ok: false, brokenAt }
 * ```
 */
export function ledgerkit(options: LedgerkitOptions = {}): Ledgerkit {
  const toRows = (entries: readonly LedgerEntry[]): LedgerRow[] =>
    entries.map((e) => {
      const amount = majorUnits(e.amount.amount, e.amount.currency, options.locale);
      return {
        date: e.occurredAt,
        paymentId: e.paymentId,
        account: e.account,
        debit: e.direction === "debit" ? amount : "",
        credit: e.direction === "credit" ? amount : "",
        currency: e.amount.currency,
        hash: e.hash,
      };
    });

  return {
    toRows,
    toCsv: (entries) => {
      const lines = [COLUMNS.join(",")];
      for (const row of toRows(entries)) {
        lines.push(COLUMNS.map((column) => csvCell(row[column])).join(","));
      }
      return lines.join("\r\n");
    },
    verifyChain: (entries) => {
      for (let i = 1; i < entries.length; i++) {
        if (entries[i]?.prevHash !== entries[i - 1]?.hash) {
          return { ok: false, brokenAt: i };
        }
      }
      return { ok: true };
    },
  };
}

/** Minor units → a plain decimal string ("24.00"), machine-parseable and not localized. */
function majorUnits(minor: number, currency: string, locale?: string): string {
  const decimals = decimalsFor(currency, locale);
  return (minor / 10 ** decimals).toFixed(decimals);
}

function decimalsFor(currency: string, locale?: string): number {
  return (
    new Intl.NumberFormat(locale, { style: "currency", currency }).resolvedOptions()
      .maximumFractionDigits ?? 2
  );
}

/** RFC 4180 CSV cell — quote when it holds a comma, quote, or newline. */
function csvCell(value: string): string {
  return /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}
