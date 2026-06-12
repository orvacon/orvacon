# Security Policy

orvacon is payment-orchestration infrastructure. We take security reports seriously and appreciate responsible disclosure.

## Reporting a vulnerability

**Do not open a public issue, pull request, or discussion for security problems.**

Report privately through one of:

- **GitHub private vulnerability reporting** (preferred): open a draft advisory at
  [Security → Report a vulnerability](https://github.com/orvacon/orvacon/security/advisories/new).
- **Email:** security@orvacon.com

Please include:

- A description of the vulnerability and its impact.
- Steps to reproduce or a proof of concept.
- Affected package(s) and version(s).
- Any suggested remediation, if you have one.

Never include real cardholder data, live API keys, or other production secrets in a report.

## What to expect

- We aim to acknowledge a report within 72 hours.
- We will keep you informed as we investigate and work on a fix.
- Once a fix is released, we will credit you in the advisory unless you prefer to remain anonymous.

## Scope

This policy covers the code in this repository and the packages it publishes to npm
(`@orvacon/*`). orvacon never holds funds; money flows directly from the cardholder to
the merchant's gateway account. Vulnerabilities in third-party gateways (Iyzico, PayTR,
banks) should be reported to those providers directly, though we welcome a heads-up if
orvacon's handling of them can be hardened.

## Supported versions

orvacon is pre-1.0 and under active development. Security fixes target the latest
published version. Pin exact versions and upgrade promptly until a stable release line
is established.
