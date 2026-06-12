# CLAUDE.md

Guidance for AI agents (Claude Code, Cursor, etc.) working in this repository.

> **orvacon** is a provider-agnostic, open-source, TypeScript-first payment orchestration library. Gateways (Iyzico, PayTR, bank virtual POS) plug in as connectors behind a single, clean, type-safe API. The app code never knows which gateway is used.

This file is the self-contained operational guide for agents working in this repository.

## Language: English only

**Everything that lands in this repo is written in English — no exceptions.** Code, identifiers, comments, TSDoc, commit messages, PR descriptions, READMEs, CLI output and error strings, package metadata, issue text. **The agent never writes Turkish into the repository.** The sole exception is the `docs/` folder, which is gitignored and not part of the published repo.

## Non-negotiable rules

1. **TypeScript everywhere.** Core included. No separate service — this is a library that runs in the dev's own runtime, installed into their app.
2. **Never hold money.** Funds flow card → merchant's gateway account directly. orvacon only orchestrates. This keeps it out of financial regulation. No wallet, no balance, no marketplace payout.
3. **Money is `integer minor units + currency`.** Never `float`. Use the branded `Money` type. Floats may only appear at the connector's gateway boundary, never in the core.
4. **Constant-time comparison for all signatures/tokens.** Use cryptokit `timingSafeEqual`. NEVER copy gateway sample code that uses `==` / `===` / `!=` (timing-unsafe). Both Iyzico and PayTR official samples are timing-unsafe.
5. **Two signature worlds, never conflate.** (a) orvacon → dev webhook = Ed25519 (asymmetric). (b) gateway → orvacon webhook = the gateway's own scheme (Iyzico hex / PayTR base64), verified in `parseWebhook`.
6. **Bring-your-own-database.** No imposed DB. The dev brings theirs via an adapter. The Supabase adapter generates default-deny RLS.
7. **Self-contained.** Keep the repo self-contained; do not reference unrelated external projects.

## Package taxonomy (don't mix roles)

Four kinds of package, three binding points:

- **Connector** — gateway adapter (`@orvacon/connector-iyzico`). Binds via `connectors: []`. Talks to a gateway; does NOT expose HTTP endpoints.
- **Kit (plugin)** — adds behavior (`@orvacon/subkit`, `fraudkit`, `taxkit`, `ledgerkit`, `testkit`). Binds via `plugins: []`.
- **Adapter** — infra bridge (`@orvacon/adapter-supabase`, framework handlers). Binds via `database:` / `toNextJsHandler(...)`.
- **Primitive/tool** — standalone (`@orvacon/cryptokit`, `tsconfig`, and the CLI). Imported/run, binds nowhere. The CLI publishes as the **unscoped `orvacon`** package (so `npx orvacon` just works, shadcn-style), not `@orvacon/cli`.

The core package is **`@orvacon/paykit`** — there is NO `@orvacon/core` (the name "core" never appears as a package; it breaks the kit aesthetic). `uikit` is the exception: not npm, it ships via a shadcn-style registry (`npx orvacon add`).

"Connector ≠ kit." Say "iyzico connector," never "iyzico kit."

## Bundle isolation

Every kit and connector is a **separate npm package**. The dev installs only what they need; an unused connector's deps never enter the bundle. Don't bundle everything into one `plugins` package. Connectors/kits take the `@orvacon/paykit` core type as a `peerDependency`. The shared connector type is exported from `@orvacon/paykit/connector`, separate from heavy runtime. Adapters are separate packages too (`@orvacon/adapter-*`), not paykit subpaths, to keep e.g. `@supabase/supabase-js` out of paykit.

## Code style

- **No decorative comment dividers** (`// ─────` is banned). Use TSDoc for documentation; no inline explanatory comments.
- **Discriminated unions** for results and state. Connectors return `{ ok: true, ... } | { ok: false, error }`, never throw.
- **State machine** transitions (`created → authorized → captured → refunded`, plus `requires_action`, `failed`, `voided`) enforced at compile time via discriminated unions.
- **Fail-fast config validation** in factory functions — missing keys / invalid config throw at setup, not at first payment.
- **Ledger writes** happen in the same DB transaction as the state transition. Never leave a half-applied state.

## Architecture quick reference

- **Stateful orchestrator, not a thin wrapper.** 3DS = two requests + a wait, linked by `conversationId` (= `paymentId`); intermediate state is persisted as `requires_action`. Trust the signed *finalize* response, never the raw callback POST.
- **Connector capabilities** declare gateway differences (signature encoding, callback source, 3DS flow, webhook response) so the core adapts without leaking gateway specifics into app code.
- **Idempotency** via DB unique constraint, not Redis.
- **Ledger immutability** via hash chain, not blockchain.
- **Cross-cutting infra** (logger, error hierarchy, timeout, retry, config validation) lives in the core as interfaces — not as kits.
- **Framework-agnostic core** via Web-standard `Request`/`Response` (`toWebHandler`). v1 ships only the Next.js adapter.

## Gateway specifics (verified against gateway docs)

Iyzico and PayTR differ in real, documented ways. Do not write a single signature function and assume it works for both:

- **Iyzico:** IYZWSv2 request auth (`HMACSHA256(randomKey + uri_path + body)`, hex, base64-wrapped). Webhook signature is **format-specific** (direct / hpp / subscription each use a different string). Response signature has a **trailing-zero** trap on price fields. 3DS is two-step (initialize → htmlContent → auth). No partial capture.
- **PayTR:** Two **different** hash formulas (token: 10 fields + salt; callback: 4 fields). Callback **requires a plain-text `OK` response** (JSON leaves the payment "in progress"). Notification URL is set in the **panel** (not API); the callback route must be public (no session/middleware).

When unsure about a gateway detail, verify against the gateway's official docs and test against the sandbox — do not write from memory.

## Scope discipline

**v1 = `paykit` core + Iyzico connector + Next.js adapter + Supabase adapter + CLI + cross-cutting infra.** Done when a dev can install orvacon, generate schema+RLS, take a real sandbox 3DS payment, capture/refund, and verify a signed webhook.

**Not v1:** PayTR, uikit, subkit/taxkit/fraudkit/ledgerkit, other framework adapters, docs site. A good idea is not the same as "now." Flag scope creep; prefer one vertical slice (one working payment) over breadth.

## Tooling and workflow

Bun monorepo (Turborepo). The agent runs these — don't leave them for the human:

- **Format + lint: Biome.** Run `bun run lint` (and `bun run format` / `bun run lint:fix` to fix) before committing. CI runs `biome ci .` and fails on any issue. No ESLint, no Prettier.
- **Types:** `bun run check-types` (per-package `tsc --noEmit`, wired through Turborepo). Must pass before committing.
- **New package:** `bun run turbo gen` (`connector` / `kit` / `adapter`) — never hand-copy a package.
- **Commits:** Conventional Commits (`type(scope): subject`). **Never add a `Co-Authored-By` or any AI-attribution trailer.**
- **Branches/PRs:** Real feature work goes on a branch + PR so CI and the changeset check gate it; `main` stays green and releasable. Never force-push or rewrite `main`.
- **Dependencies:** Lockfile is committed and CI installs with `--frozen-lockfile`. Pin GitHub Actions to a commit SHA (Dependabot updates them). Don't add a dependency a payments library shouldn't carry.

## Versioning (Changesets)

Versions are managed with [Changesets](https://github.com/changesets/changesets) — never bump `version` in a `package.json` by hand. **The agent adds a changeset whenever it changes a publishable package in a way a consumer would notice** (new/changed API, bug fix, behavior change).

- Add one with `bun run changeset` (or write `.changeset/<name>.md` directly): list the affected `@orvacon/*` packages and pick `patch` / `minor` / `major` (semver; pre-1.0, breaking goes in `minor`). Write the summary in English, consumer-facing.
- No changeset for internal-only edits: tests, tooling, docs, CI, private packages (`uikit`, `tsconfig`, the apps).
- `bun run version` applies pending changesets (bumps + changelogs); `bun run release` builds then publishes. These are release steps, not per-change steps.

## When working here

- Give reasoning, not orders. State the rejected alternative.
- Verify gateway details against official docs/sandbox before making architectural claims.
- Most open questions close in real code, not on paper. Don't manufacture false certainty.
