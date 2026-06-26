import { addMoney, type Money, money } from "@orvacon/paykit";

/** A party on the invoice — the seller or the buyer. */
export interface InvoiceParty {
  name: string;
  taxId?: string;
  address?: string;
  email?: string;
}

/** One line of the invoice. The line total is `unitPrice × quantity`. */
export interface InvoiceLine {
  description: string;
  quantity: number;
  unitPrice: Money;
}

/** Input to {@link Invoicer.render}. */
export interface InvoiceInput {
  /** The settled payment — a full `Payment` satisfies this. */
  payment: { id: string; amount: Money; gatewayReference?: string; createdAt: string };
  buyer: InvoiceParty;
  lines: InvoiceLine[];
  /** Invoice number. Defaults to the payment id. */
  number?: string;
  /** ISO issue date. Defaults to the payment's `createdAt`. */
  issuedAt?: string;
}

/** Options for {@link invoicekit}. */
export interface InvoicekitOptions {
  seller: InvoiceParty;
  /** BCP-47 locale for dates and money. Defaults to the runtime's. */
  locale?: string;
}

/** What {@link invoicekit} returns. */
export interface Invoicer {
  /** Render a self-contained, printable HTML invoice for a payment. */
  render: (input: InvoiceInput) => string;
}

/**
 * Render a printable HTML invoice from an orvacon payment. The output is a
 * single self-contained document — inline styles, no external assets — that you
 * can email, attach, or print to PDF.
 *
 * ```ts
 * const invoicer = invoicekit({ seller: { name: "Acme", taxId: "123" } });
 * const html = invoicer.render({ payment, buyer, lines });
 * ```
 */
export function invoicekit(options: InvoicekitOptions): Invoicer {
  return { render: (input) => renderInvoice(options, input) };
}

function renderInvoice(options: InvoicekitOptions, input: InvoiceInput): string {
  const { seller, locale } = options;
  const number = input.number ?? input.payment.id;
  const issuedAt = input.issuedAt ?? input.payment.createdAt;
  const subtotal = input.lines.reduce<Money | null>(
    (sum, line) => (sum ? addMoney(sum, lineTotal(line)) : lineTotal(line)),
    null,
  );

  const rows = input.lines
    .map(
      (line) => `
        <tr>
          <td>${esc(line.description)}</td>
          <td class="num">${line.quantity}</td>
          <td class="num">${money_(line.unitPrice, locale)}</td>
          <td class="num">${money_(lineTotal(line), locale)}</td>
        </tr>`,
    )
    .join("");

  return `<!doctype html>
<html lang="${esc(locale ?? "en")}">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Invoice ${esc(number)}</title>
<style>
  :root { --accent: #15b886; --ink: #15151a; --dim: #6b7280; --line: #e5e7eb; }
  * { box-sizing: border-box; }
  body { margin: 0; background: #f4f4f3; color: var(--ink);
    font: 14px/1.55 ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }
  .invoice { max-width: 720px; margin: 32px auto; background: #fff; padding: 44px;
    border: 1px solid var(--line); border-radius: 14px; }
  header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 36px; }
  .brand { font-size: 22px; font-weight: 700; letter-spacing: -0.02em; }
  .meta { text-align: right; color: var(--dim); font-size: 13px; }
  .badge { display: inline-block; margin-bottom: 8px; padding: 3px 10px; border-radius: 999px;
    background: rgba(21,184,134,0.12); color: var(--accent); font-weight: 600; font-size: 12px;
    letter-spacing: 0.04em; }
  .parties { display: flex; gap: 48px; margin-bottom: 32px; }
  .parties h3 { margin: 0 0 6px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--dim); }
  .parties .name { font-weight: 600; }
  .parties .muted { color: var(--dim); font-size: 13px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
  th { text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em;
    color: var(--dim); padding: 0 0 10px; border-bottom: 1px solid var(--line); }
  td { padding: 12px 0; border-bottom: 1px solid var(--line); }
  .num { text-align: right; font-variant-numeric: tabular-nums; }
  th.num { text-align: right; }
  .totals { margin-left: auto; width: 260px; }
  .totals > div { display: flex; justify-content: space-between; padding: 8px 0; }
  .totals .paid { margin-top: 6px; padding-top: 14px; border-top: 2px solid var(--ink);
    font-size: 17px; font-weight: 700; }
  footer { margin-top: 40px; padding-top: 18px; border-top: 1px solid var(--line);
    color: var(--dim); font-size: 12.5px; }
  @media print { body { background: #fff; } .invoice { margin: 0; border: 0; } }
</style>
</head>
<body>
  <div class="invoice">
    <header>
      <div class="brand">${esc(seller.name)}</div>
      <div class="meta">
        <div class="badge">PAID</div>
        <div>Invoice <strong>${esc(number)}</strong></div>
        <div>${esc(formatDate(issuedAt, locale))}</div>
      </div>
    </header>
    <section class="parties">
      <div>
        <h3>From</h3>
        <div class="name">${esc(seller.name)}</div>
        ${party(seller)}
      </div>
      <div>
        <h3>Bill to</h3>
        <div class="name">${esc(input.buyer.name)}</div>
        ${party(input.buyer)}
      </div>
    </section>
    <table>
      <thead>
        <tr><th>Description</th><th class="num">Qty</th><th class="num">Unit</th><th class="num">Amount</th></tr>
      </thead>
      <tbody>${rows}
      </tbody>
    </table>
    <div class="totals">
      ${subtotal ? `<div><span>Subtotal</span><span class="num">${money_(subtotal, locale)}</span></div>` : ""}
      <div class="paid"><span>Total paid</span><span class="num">${money_(input.payment.amount, locale)}</span></div>
    </div>
    <footer>
      Paid${input.payment.gatewayReference ? ` · ref ${esc(input.payment.gatewayReference)}` : ""} ·
      ${esc(formatDate(input.payment.createdAt, locale))}
    </footer>
  </div>
</body>
</html>`;
}

function party(p: InvoiceParty): string {
  const lines = [p.address, p.email, p.taxId ? `Tax ID: ${p.taxId}` : undefined].filter(Boolean);
  return lines.map((line) => `<div class="muted">${esc(String(line))}</div>`).join("");
}

function lineTotal(line: InvoiceLine): Money {
  return money(line.unitPrice.amount * line.quantity, line.unitPrice.currency);
}

function money_(value: Money, locale?: string): string {
  const scale = minorScale(value.currency, locale);
  return new Intl.NumberFormat(locale, { style: "currency", currency: value.currency }).format(
    value.amount / scale,
  );
}

function minorScale(currency: string, locale?: string): number {
  const decimals =
    new Intl.NumberFormat(locale, { style: "currency", currency }).resolvedOptions()
      .maximumFractionDigits ?? 2;
  return 10 ** decimals;
}

function formatDate(iso: string, locale?: string): string {
  const ms = Date.parse(iso);
  if (Number.isNaN(ms)) {
    return iso;
  }
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(ms));
}

const ENTITIES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

/** Escape a value before it lands in HTML — invoices carry user-provided strings. */
function esc(value: string): string {
  return value.replace(/[&<>"']/g, (c) => ENTITIES[c] ?? c);
}
