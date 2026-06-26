---
"@orvacon/testkit": minor
---

Round out the mock connector. `mockConnector` now implements `retrievePayment` — so `orva.reconcile()` is testable — and `verifySetup`, with a `reconcile` option to drive the settled-but-unreflected path; `mockReconcile()` builds the resolved `ReconcileOutcome`. Ships with a package README and a full reference page.
