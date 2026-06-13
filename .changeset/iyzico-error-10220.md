---
"@orvacon/connector-iyzico": patch
---

Classify Iyzico error code `10220` (errorGroup `DECLINED`) as `declined` rather than the safe-default `unknown`. The sandbox smoke-test surfaced it on a declined refund: a definite decline was being reported as an ambiguous `unknown`, which is needlessly imprecise for consumers handling the result. This is the error-code table's intended sandbox-driven expansion — real codes added as they appear, not guessed up front.
