---
"@orvacon/paykit": minor
---

Add an optional `userId` to a payment — the payment's owner (the app's user id, e.g. a Supabase `auth.uid()`), supplied on the authorize request and stored on the `Payment`. It is a generic ownership concept (audit, support tooling, per-user access) that the core stores and **never sends to the connector**; adapters that enforce isolation — the Supabase adapter's row-level security — key off it, while adapters that don't simply ignore it. Nullable for guest checkout: a null-owner payment is visible only to the server (service role / direct connection), never to a client user, since `auth.uid() = null` never matches.
