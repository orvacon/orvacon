---
"@orvacon/adapter-nextjs": minor
---

New package — the Next.js App Router adapter. `toNextJsHandler(orva, { returnUrl })` returns the `POST` route handler for `app/api/orva/callback/[connector]/route.ts`: it reads the connector from the route, runs the synchronous payment flow (finalize + state settle before the browser redirect), and drains the signed outbound webhook delivery with Next's `after`, so the redirect is never blocked on the dev's endpoint — the core payment logic is synchronous, only the notification side-effect is deferred. Documents the public-route requirement (exclude `/api/orva/callback` from the `middleware` matcher, or the gateway's session-less callback is rejected). `next` is a peer dependency.
