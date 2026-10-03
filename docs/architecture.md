# Architecture

## Overview

The site is a static Vite build. All live data is fetched in the visitor's browser; there is no server component in this repository.

```
index.html --> src/main.js
                 |- register.js   facts + states
                 |- links.js      href rules, handle derivation
                 |- ca.js         address check + CA slot markup
                 |- live.js       RPC / DefiLlama / DexScreener reads
                 |- sanitize.js   allowlists and clean-up for 3rd-party data
                 |- motion.js     reveal, count-up, scroll, copy
                 '- tokens.css + style.css
```

## Register pattern

Each external fact is a record: `{ id, label, value | url, state }` with `state` in `stated | absent | unconfirmed`. The UI is derived from records. An absent record renders as an inert element with no `href`.

## Live data

| Source | Call | Used for |
| --- | --- | --- |
| Robinhood Chain RPC | `eth_blockNumber`, `eth_gasPrice`, `eth_chainId` | Height, gas, chain check |
| DefiLlama | `/v2/chains` | Chain TVL |
| DexScreener | search, `token-profiles/latest/v1`, `tokens/v1/robinhood/...` | Pair count, marquee |

Every read has a timeout and a visible failure state; a skeleton never hangs.

## Trust boundary

Third-party responses are untrusted. Images must come from an allowlisted HTTPS host. Text is stripped of markup and control characters and length-limited. Chips are built with DOM APIs, never from HTML strings.

## Styling

`src/tokens.css` is the only file allowed to contain colour literals, and its header records where each swatch was sampled. Everything else references tokens.

## Quality gates

`npm run gates` serves `dist/` locally, mocks the network with synthetic fixtures and checks static rules (no stray colour literals, no unit misuse, register integrity) plus browser rules (no overflow, 48 px tap targets, skeleton and failure states, reduced motion, marquee behaviour).
