---
"orvacon": minor
---

Add the registry commands to the `orvacon` CLI. `orvacon add <name...>` installs UI components from a registry — it fetches each item, follows its registry dependencies (guarding cycles), writes the files (last write to a path wins), installs the npm dependencies, and reports any shadcn base components to add separately. `orvacon registry build` is the author side: it turns a source `registry.json` plus on-disk component files into self-contained, servable `<name>.json` blobs (inlining each file's content). The format is a deliberate subset of shadcn's `registry-item.json`, so a component published here also installs via `npx shadcn add @orvacon/<name>` — interop for free. Path traversal and absolute/URL file paths are rejected at both build and write.
