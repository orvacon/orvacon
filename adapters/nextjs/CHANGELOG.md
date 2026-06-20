# @orvacon/adapter-nextjs

## 0.1.1

### Patch Changes

- Fix the published packages so they install. Internal `@orvacon/*` dependencies were left as the `workspace:` protocol, which npm cannot resolve — the libraries were uninstallable. They now use explicit semver ranges. Also add a per-package README so the npm page is not bare.
- Updated dependencies
  - @orvacon/paykit@0.1.1

## 0.1.0

### Minor Changes

- 8eb1cfb: New package — the Next.js App Router adapter. `toNextJsHandler(orva, { returnUrl })` returns the `POST` route handler for `app/api/orva/callback/[connector]/route.ts`: it reads the connector from the route, runs the synchronous payment flow (finalize + state settle before the browser redirect), and drains the signed outbound webhook delivery with Next's `after`, so the redirect is never blocked on the dev's endpoint — the core payment logic is synchronous, only the notification side-effect is deferred. Documents the public-route requirement (exclude `/api/orva/callback` from the `middleware` matcher, or the gateway's session-less callback is rejected). `next` is a peer dependency.

### Patch Changes

- Updated dependencies [46cc3f8]
- Updated dependencies [57e0933]
- Updated dependencies [66d0558]
- Updated dependencies [28b5c5f]
- Updated dependencies [4555ca9]
- Updated dependencies [e7a0d8a]
- Updated dependencies [d871036]
- Updated dependencies [8eb1cfb]
- Updated dependencies [a0229b7]
- Updated dependencies [8ada81f]
  - @orvacon/paykit@0.1.0
