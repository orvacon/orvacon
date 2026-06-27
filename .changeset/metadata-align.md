---
"@orvacon/cryptokit": patch
"@orvacon/connector-iyzico": patch
"@orvacon/adapter-supabase": patch
"@orvacon/adapter-nextjs": patch
---

Mark these packages side-effect-free (`"sideEffects": false`) so bundlers can tree-shake them, and align their package metadata: a `repository.directory` (so npm links to the right subdirectory), an `engines.node` floor, and a `homepage`. The other publishable packages pick the same up through their pending releases.
