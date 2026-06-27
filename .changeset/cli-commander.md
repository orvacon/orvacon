---
"orvacon": patch
---

Refactor the CLI onto commander. Each command now lives in its own `src/commands/*` module, with auto-generated `--help`, typed option parsing, and real subcommands (`orvacon registry build`). `--version` now reports the package version (it was hard-coded and stale), and a bare `orvacon` prints help instead of erroring. What the commands do is unchanged.
