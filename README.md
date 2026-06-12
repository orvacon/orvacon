<div align="center">

# orvacon

**Provider-agnostic, TypeScript-first payment orchestration.**

[![CI](https://github.com/orvacon/orvacon/actions/workflows/ci.yml/badge.svg)](https://github.com/orvacon/orvacon/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)

</div>

> [!WARNING]
> **Pre-v1 / work in progress.** The API is being designed and is not stable yet. The
> published npm packages are placeholders to reserve names. Don't build on it in
> production until a `0.1` release lands.

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

## Repository layout

This is a [Turborepo](https://turborepo.dev) monorepo managed with [Bun](https://bun.sh).

```
apps/
  web/        Next.js app (placeholder)
  docs/       Next.js app (placeholder)
packages/
  cli/        orvacon — command-line tool (placeholder)
```

More packages (`@orvacon/paykit`, `connector-iyzico`, `adapter-supabase`, `cryptokit`, …)
land as development progresses.

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
