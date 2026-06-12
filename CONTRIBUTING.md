# Contributing to orvacon

Thanks for your interest in contributing. orvacon is a provider-agnostic, TypeScript-first
payment orchestration library. This guide covers the basics; read [`CLAUDE.md`](./CLAUDE.md)
for the architectural rules that PRs are held to.

## Ground rules

- **English only.** All code, comments, commits, PRs, and issues are written in English.
- **TypeScript everywhere**, end to end. No separate service; orvacon runs in the dev's own runtime.
- **Never hold money.** Funds flow card → merchant's gateway account directly. No wallet, balance, or payout logic — ever.
- **Money is `integer minor units + currency`.** Never `float`. Use the branded `Money` type.
- **Constant-time comparison** for all signatures and tokens. Never copy gateway sample code that uses `==` / `===`.
- **No secrets in commits** — no API keys, sandbox credentials, or card data.

## Project setup

This is a [Turborepo](https://turborepo.dev) monorepo managed with [Bun](https://bun.sh).

```bash
bun install
bun run build        # build all packages
bun run dev          # run apps/packages in dev
bun run lint         # lint + format check (Biome)
bun run format       # auto-format (Biome)
bun run check-types  # type check
```

Workspaces live under `apps/*`, `packages/*`, `connectors/*`, and `adapters/*`.

Scaffold a new package with `bun run turbo gen` (`connector`, `kit`, or `adapter`).

## Workflow

1. Open an issue first for anything non-trivial, so direction is agreed before code.
2. Branch off `main`. Keep PRs focused — one logical change per PR.
3. Make sure `bun run lint`, `bun run check-types`, and `bun run build` pass.
4. Use clear, conventional commit messages (e.g. `feat(paykit): ...`, `fix(cli): ...`).
5. Fill in the pull request template, including the checklist.

## Scope

orvacon is **not** an Iyzico wrapper, **not** an e-commerce platform, and **not** a
money-holding wallet or marketplace. Features that cross those lines will be declined.
A good idea is not the same as "in scope for now" — see the scope section in `CLAUDE.md`.

## Reporting security issues

Do not open public issues for vulnerabilities. See [`SECURITY.md`](./SECURITY.md).

## License

By contributing, you agree that your contributions are licensed under the [MIT License](./LICENSE).
