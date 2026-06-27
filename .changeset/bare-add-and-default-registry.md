---
"orvacon": minor
---

`orvacon add <name>` now resolves a bare top-level component name against the orvacon registry, so `orvacon add payment-status` works without the `@orvacon/` prefix. Bare names nested in a component's `registryDependencies` are still treated as shadcn base components. The default registry resolves to `https://ui.orvacon.com/r/{name}.json`.
