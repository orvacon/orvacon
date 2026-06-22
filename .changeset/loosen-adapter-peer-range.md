---
"@orvacon/adapter-nextjs": patch
"@orvacon/adapter-supabase": patch
---

Widen the `@orvacon/paykit` peer range to `>=0.1.1 <1.0.0` so a pre-1.0 paykit
minor (which is breaking by convention, not by semver) no longer forces a major
version bump on the adapter.
