# Security Policy

## Supported versions

Only the latest commit on the default branch is supported.

## Reporting a vulnerability

Please do **not** open a public issue for security problems. Use GitHub's **private vulnerability reporting** (Security tab, "Report a vulnerability") on this repository. If that option is unavailable, contact the maintainers through the channels listed on [levvis.app](https://levvis.app) once published, and ask for a private route before sharing details.

Include what you found, how to reproduce it, and the impact you expect. Expect an acknowledgement within a few days and a status update as the work progresses.

## Scope

In scope: this repository's code, build output and gates, including handling of third-party data (`src/sanitize.js`, `src/live.js`).

Out of scope: third-party services (RPC nodes, DefiLlama, DexScreener), social engineering, and denial-of-service testing.

## Verifying addresses

Treat any contract address as unverified until it appears in `src/register.js` with state `stated` and on levvis.app. Impersonation of the project is a common attack; the site's contract-address slot stays inert until an address is formally announced.

## Disclosure

Please allow reasonable time for a fix before public disclosure. Good-faith research will be credited, with consent.
