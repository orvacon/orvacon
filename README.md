<div align="center">

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="apps/web/public/brand/orvacon-wide.svg">
  <img alt="orvacon" src="apps/web/public/brand/orvacon-wide-light.svg" width="320">
</picture>


**Provider-agnostic, TypeScript-first payment orchestration.**

[![CI](https://github.com/orvacon/orvacon/actions/workflows/ci.yml/badge.svg)](https://github.com/orvacon/orvacon/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)

</div>

> [!NOTE]
> **v0.3 — early release.** The Iyzico raw-card **and stored-card** 3-D Secure flows
> are verified end-to-end against the gateway sandbox: authorize → 3DS → capture →
> refund → reconcile. The API is `0.x` and may still change before `1.0`.

## What is orvacon?

orvacon is a payment orchestration library. Gateways (Iyzico, PayTR, bank virtual POS)
plug in behind a single, clean, type-safe API as **connectors** — your application code
never knows which gateway is handling a payment. Swap or add a gateway by changing
configuration, not application logic.

It is a library that runs in your own runtime, not a hosted
service you have to deploy and route money through.

## Principles

- **Never holds money.** Funds flow from the cardholder directly to the merchant's
  gateway account. orvacon only orchestrates — no wallet, no balance, no payout.
- **End-to-end type safety.** TypeScript everywhere. Payment state and results are
  discriminated unions, enforced at compile time.
- **Money is `integer minor units + currency`.** Never floats.
- **Bring your own database.** No imposed datastore; you connect yours through an adapter.
- **Asymmetric webhook signatures.** Outgoing webhooks are signed with Ed25519, so a
  leaked verification key can't be used to forge events.

## What orvacon is not

- **Not an Iyzico wrapper** — it's a stateful orchestrator across gateways.
- **Not an e-commerce platform** — no catalog, cart, or inventory.
- **Not a wallet / marketplace** — it never custodies funds.

## Getting started

Install the core plus the connector and database adapter you need — unused gateways
never enter your bundle:

```bash
bun add @orvacon/paykit @orvacon/connector-iyzico @orvacon/adapter-supabase @orvacon/adapter-nextjs postgres
```

Generate an Ed25519 key pair for signing your outbound webhooks:

```bash
npx orvacon keys >> .env.local
```

Wire it together once. Your application code calls `orva.authorize(...)` and never
references the gateway directly:

```ts
import { orvacon } from "@orvacon/paykit";
import { iyzico } from "@orvacon/connector-iyzico";
import { supabaseAdapter } from "@orvacon/adapter-supabase";
import postgres from "postgres";

const sql = postgres(process.env.SUPABASE_DB_URL!, { prepare: false });

export const orva = orvacon({
  database: supabaseAdapter({ sql }),
  connectors: [
    iyzico({ apiKey: process.env.IYZICO_API_KEY!, secretKey: process.env.IYZICO_SECRET_KEY! }),
  ],
  webhookSigningKey: process.env.ORVACON_WEBHOOK_SIGNING_KEY!,
});
```

Generate the database schema with default-deny row-level security, then apply it with
Supabase's own tooling:

```bash
npx orvacon generate --write    # writes supabase/migrations/<timestamp>_orvacon.sql
supabase db push
```

Mount the gateway callback as a **public** route — the gateway POSTs to it without a
session, so exclude it from your auth middleware:

```ts
// app/api/orva/callback/[connector]/route.ts
import { toNextJsHandler } from "@orvacon/adapter-nextjs";
import { orva } from "@/lib/orva";

export const { POST } = toNextJsHandler(orva, {
  returnUrl: { success: "/checkout/success", failure: "/checkout/failure" },
});
```

> [!IMPORTANT]
> Keep your Supabase `service_role` key server-only — never expose it to the client
> or commit it. It bypasses the row-level security that protects your payment data.

## Repository layout

This is a [Turborepo](https://turborepo.dev) monorepo managed with [Bun](https://bun.sh).

```
packages/
  paykit/        @orvacon/paykit — the core orchestrator
  cryptokit/     @orvacon/cryptokit — Ed25519 / HMAC / webhook signing
  cli/           orvacon — the CLI (keys, generate)
connectors/
  iyzico/        @orvacon/connector-iyzico — Iyzico gateway
adapters/
  supabase/      @orvacon/adapter-supabase — Postgres + default-deny RLS
  nextjs/        @orvacon/adapter-nextjs — Next.js route handler
```

## Development

```bash
bun install
bun run build         # build all packages
bun run dev           # run in dev
bun run lint          # lint + format check (Biome)
bun run format        # auto-format (Biome)
bun run check-types   # type check
```

## Contributing

Contributions are welcome — please read [CONTRIBUTING.md](./CONTRIBUTING.md) first, and
note the [Code of Conduct](./CODE_OF_CONDUCT.md). For security issues, see
[SECURITY.md](./SECURITY.md) — do not open public issues for vulnerabilities.

## License

[MIT](./LICENSE)
