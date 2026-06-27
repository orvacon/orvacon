# orvacon

The command-line tool for **[orvacon](https://github.com/orvacon/orvacon)** — provider-agnostic, TypeScript-first payment orchestration. It publishes as the unscoped `orvacon` package, so `npx orvacon` just works.

**Tool.** Run with `npx orvacon`; it binds nowhere.

## Install

```bash
npx orvacon --help     # no install needed
```

## Use

```bash
npx orvacon keys                 # generate an Ed25519 webhook signing key pair
npx orvacon generate --write     # write the schema + default-deny RLS migration
npx orvacon add card-form        # add a UI component to your project from the registry
npx orvacon registry build       # author side: inline component sources into servable JSON
```

Components also install through the shadcn CLI (`npx shadcn add @orvacon/<name>`) — orvacon's registry uses the shadcn `registry-item.json` format, so the two are interchangeable.

## License

MIT
