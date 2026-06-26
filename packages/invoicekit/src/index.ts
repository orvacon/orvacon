import { addMoney, type Money, money } from "@orvacon/paykit";

/** A party on the invoice — the seller or the buyer. */
export interface InvoiceParty {
  name: string;
  /** Tax number — VKN (companies) or TCKN (individuals). */
  taxId?: string;
  /** Tax office (Turkey's *vergi dairesi*). */
  taxOffice?: string;
  /** Full open address. */
  address?: string;
  email?: string;
  phone?: string;
}

/** Tax applied to the subtotal. The lines are the pre-tax base (Turkey's *matrah*). */
export interface InvoiceTax {
  /** Rate as a fraction, e.g. `0.20` for 20% KDV. */
  rate: number;
  /** Line label, e.g. `"KDV %20"`. Defaults to `Tax NN%`. */
  label?: string;
}

/** One line of the invoice. The line total is `unitPrice × quantity`. */
export interface InvoiceLine {
  description: string;
  quantity: number;
  /** Unit of measure shown next to the quantity, e.g. `"Adet"`, `"Ay"`, `"Yıl"`. */
  unit?: string;
  unitPrice: Money;
}

/** Overridable field labels — set Turkish strings for a *fatura*, or your own language. */
export interface InvoiceLabels {
  document: string;
  from: string;
  billTo: string;
  description: string;
  quantity: string;
  unitPrice: string;
  amount: string;
  subtotal: string;
  total: string;
  taxId: string;
  taxOffice: string;
  paid: string;
}

/** Input to {@link Invoicer.render}. */
export interface InvoiceInput {
  /** The settled payment — a full `Payment` satisfies this. */
  payment: { id: string; amount: Money; gatewayReference?: string; createdAt: string };
  buyer: InvoiceParty;
  lines: InvoiceLine[];
  /** Tax applied to the line subtotal. Omit for a tax-free invoice. */
  tax?: InvoiceTax;
  /** Invoice number. Defaults to the payment id. */
  number?: string;
  /** ISO issue timestamp. Defaults to the payment's `createdAt`. */
  issuedAt?: string;
  /** Document type, e.g. `"e-Arşiv Fatura"`. */
  documentType?: string;
  /** Reference for the fiscal document this accompanies (e.g. an e-Fatura ETTN/UUID). */
  ettn?: string;
  /** The total spelled out, e.g. `"İkibindörtyüz Türk Lirası"`. Rendered if you provide it. */
  amountInWords?: string;
}

/** Options for {@link invoicekit}. */
export interface InvoicekitOptions {
  seller: InvoiceParty;
  /** BCP-47 locale for dates and money. Defaults to the runtime's. */
  locale?: string;
  /** Override any field label (e.g. Turkish for a *fatura*). */
  labels?: Partial<InvoiceLabels>;
}

/** What {@link invoicekit} returns. */
export interface Invoicer {
  /** Render a self-contained, printable HTML invoice for a payment. */
  render: (input: InvoiceInput) => string;
}

const DEFAULT_LABELS: InvoiceLabels = {
  document: "Invoice",
  from: "From",
  billTo: "Bill to",
  description: "Description",
  quantity: "Qty",
  unitPrice: "Unit price",
  amount: "Amount",
  subtotal: "Subtotal",
  total: "Total",
  taxId: "Tax ID",
  taxOffice: "Tax office",
  paid: "PAID",
};

/**
 * Render a printable HTML invoice from an orvacon payment. The output is a single
 * self-contained document (inline styles, no external assets) you can email,
 * attach, or print to PDF.
 *
 * Built for a real tax invoice: it breaks out the tax (the lines are the pre-tax
 * base, then a tax line, then the total), carries both parties' tax id and tax
 * office, and shows a document type + ETTN for an e-Arşiv / e-Fatura. Set
 * `labels` to Turkish for a *fatura*.
 *
 * ```ts
 * const invoicer = invoicekit({
 *   seller: { name: "Acme A.Ş.", taxId: "1234567890", taxOffice: "Boğaziçi V.D.", address: "…" },
 *   locale: "tr-TR",
 *   labels: { subtotal: "Ara Toplam", total: "Genel Toplam", taxId: "VKN", taxOffice: "Vergi Dairesi" },
 * });
 * const html = invoicer.render({ payment, buyer, lines, tax: { rate: 0.2, label: "KDV %20" } });
 * ```
 */
export function invoicekit(options: InvoicekitOptions): Invoicer {
  return { render: (input) => renderInvoice(options, input) };
}

function renderInvoice(options: InvoicekitOptions, input: InvoiceInput): string {
  const { seller, locale } = options;
  const t = { ...DEFAULT_LABELS, ...options.labels };
  const number = input.number ?? input.payment.id;
  const issuedAt = input.issuedAt ?? input.payment.createdAt;

  const subtotal = input.lines.reduce<Money | null>(
    (sum, line) => (sum ? addMoney(sum, lineTotal(line)) : lineTotal(line)),
    null,
  );
  const taxAmount =
    subtotal && input.tax
      ? money(Math.round(subtotal.amount * input.tax.rate), subtotal.currency)
      : null;
  const total = subtotal
    ? taxAmount
      ? addMoney(subtotal, taxAmount)
      : subtotal
    : input.payment.amount;
  const taxLabel = input.tax?.label ?? `Tax ${(input.tax?.rate ?? 0) * 100}%`;

  const rows = input.lines
    .map(
      (line) => `
        <tr>
          <td>${esc(line.description)}</td>
          <td class="num">${line.quantity}${line.unit ? `&nbsp;${esc(line.unit)}` : ""}</td>
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
<title>${esc(t.document)} ${esc(number)}</title>
<style>
  :root { --accent: #15b886; --ink: #15151a; --dim: #6b7280; --line: #e5e7eb; }
  * { box-sizing: border-box; }
  body { margin: 0; background: #f4f4f3; color: var(--ink);
    font: 14px/1.55 ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }
  .invoice { max-width: 760px; margin: 32px auto; background: #fff; padding: 44px;
    border: 1px solid var(--line); border-radius: 14px; }
  header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 34px; }
  .brand { font-size: 22px; font-weight: 700; letter-spacing: -0.02em; }
  .doctype { color: var(--dim); font-size: 13px; margin-top: 2px; }
  .meta { text-align: right; color: var(--dim); font-size: 13px; }
  .badge { display: inline-block; margin-bottom: 8px; padding: 3px 10px; border-radius: 999px;
    background: rgba(21,184,134,0.12); color: var(--accent); font-weight: 600; font-size: 12px;
    letter-spacing: 0.04em; }
  .meta .ettn { margin-top: 6px; font-size: 11px; word-break: break-all; max-width: 260px; }
  .parties { display: flex; gap: 48px; margin-bottom: 30px; }
  .parties > div { flex: 1; }
  .parties h3 { margin: 0 0 6px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: var(--dim); }
  .parties .name { font-weight: 600; }
  .parties .muted { color: var(--dim); font-size: 12.5px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
  th { text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.06em;
    color: var(--dim); padding: 0 0 10px; border-bottom: 1px solid var(--line); }
  td { padding: 12px 0; border-bottom: 1px solid var(--line); vertical-align: top; }
  .num { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
  th.num { text-align: right; }
  .totals { margin-left: auto; width: 300px; }
  .totals > div { display: flex; justify-content: space-between; gap: 24px; padding: 7px 0; }
  .totals .grand { margin-top: 6px; padding-top: 14px; border-top: 2px solid var(--ink);
    font-size: 17px; font-weight: 700; }
  .words { margin-top: 22px; padding-top: 16px; border-top: 1px solid var(--line);
    color: var(--dim); font-size: 12.5px; }
  @media print { body { background: #fff; } .invoice { margin: 0; border: 0; } }
</style>
</head>
<body>
  <div class="invoice">
    <header>
      <div>
        <div class="brand">${esc(seller.name)}</div>
        ${input.documentType ? `<div class="doctype">${esc(input.documentType)}</div>` : ""}
      </div>
      <div class="meta">
        <div class="badge">${esc(t.paid)}</div>
        <div>${esc(t.document)} <strong>${esc(number)}</strong></div>
        <div>${esc(formatDateTime(issuedAt, locale))}</div>
        ${input.ettn ? `<div class="ettn">ETTN: ${esc(input.ettn)}</div>` : ""}
      </div>
    </header>
    <section class="parties">
      <div>
        <h3>${esc(t.from)}</h3>
        <div class="name">${esc(seller.name)}</div>
        ${party(seller, t)}
      </div>
      <div>
        <h3>${esc(t.billTo)}</h3>
        <div class="name">${esc(input.buyer.name)}</div>
        ${party(input.buyer, t)}
      </div>
    </section>
    <table>
      <thead>
        <tr>
          <th>${esc(t.description)}</th>
          <th class="num">${esc(t.quantity)}</th>
          <th class="num">${esc(t.unitPrice)}</th>
          <th class="num">${esc(t.amount)}</th>
        </tr>
      </thead>
      <tbody>${rows}
      </tbody>
    </table>
    <div class="totals">
      ${subtotal ? `<div><span>${esc(t.subtotal)}</span><span class="num">${money_(subtotal, locale)}</span></div>` : ""}
      ${taxAmount ? `<div><span>${esc(taxLabel)}</span><span class="num">${money_(taxAmount, locale)}</span></div>` : ""}
      <div class="grand"><span>${esc(t.total)}</span><span class="num">${money_(total, locale)}</span></div>
    </div>
    ${input.amountInWords ? `<div class="words">${esc(input.amountInWords)}</div>` : ""}
  </div>
</body>
</html>`;
}

function party(p: InvoiceParty, t: InvoiceLabels): string {
  const lines = [
    p.address,
    p.taxOffice ? `${t.taxOffice}: ${p.taxOffice}` : undefined,
    p.taxId ? `${t.taxId}: ${p.taxId}` : undefined,
    p.email,
    p.phone,
  ].filter((v): v is string => Boolean(v));
  return lines.map((line) => `<div class="muted">${esc(line)}</div>`).join("");
}

function lineTotal(line: InvoiceLine): Money {
  return money(line.unitPrice.amount * line.quantity, line.unitPrice.currency);
}

function money_(value: Money, locale?: string): string {
  const scale = minorScale(value.currency, locale);
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: value.currency,
    currencyDisplay: "narrowSymbol",
  }).format(value.amount / scale);
}

function minorScale(currency: string, locale?: string): number {
  const decimals =
    new Intl.NumberFormat(locale, { style: "currency", currency }).resolvedOptions()
      .maximumFractionDigits ?? 2;
  return 10 ** decimals;
}

function formatDateTime(iso: string, locale?: string): string {
  const ms = Date.parse(iso);
  if (Number.isNaN(ms)) {
    return iso;
  }
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(
    new Date(ms),
  );
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
