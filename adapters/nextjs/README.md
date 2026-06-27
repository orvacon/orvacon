# @orvacon/adapter-nextjs

The Next.js App Router adapter for **[orvacon](https://github.com/orvacon/orvacon)** — `toNextJsHandler` mounts the gateway callback route (a public, middleware-exempt endpoint) and drains signed-webhook delivery with `after()`.

**Adapter.** Binds via `toNextJsHandler(orva, …)`.

## Install

```bash
bun add @orvacon/adapter-nextjs @orvacon/paykit
```

## Use

```ts
// app/api/orva/callback/[connector]/route.ts
import { toNextJsHandler } from "@orvacon/adapter-nextjs";
import { orva } from "@/orva/server";

export const { POST } = toNextJsHandler(orva, {
  returnUrl: { success: "/checkout/done", failure: "/checkout/failed" },
});
```

Keep the callback route public — exempt it from auth middleware. orvacon trusts the signed *finalize* response, never the raw callback POST, and picks the `success` / `failure` redirect from the finalize result so your app never has to decide.

## License

MIT
