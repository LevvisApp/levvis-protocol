# Levvis OS

Levvis OS reads an X account end to end and returns four analysis cards in one pass: **Content**, **Behaviour**, **Presence** and **Audience**. The cards are built to be saved, compared and shared. Its home is **Robinhood Chain** (chain id 4663), and the public site lives at [levvis.app](https://levvis.app).

This repository holds the marketing and live-readout site.

## What the site does

- Explains the four-card analysis and the three-step flow (handle in, archive read, snapshot out).
- Shows the home chain's vital signs, fetched in the browser on every load: block height and gas from the public RPC, chain TVL from DefiLlama, pair count and token profiles from DexScreener.
- Carries a contract-address slot at the top of the page. It stays inert until an address is formally stated.

## Run it

```bash
npm install
npm run dev        # local dev server
npm run build      # production build into dist/
npm run gates      # automated checks (needs Microsoft Edge installed)
```

Node 20 or newer is recommended.

## Layout

| Path | Purpose |
| --- | --- |
| `src/register.js` | Every external fact as one record with a state: `stated`, `absent` or `unconfirmed` |
| `src/tokens.css` | The only place colour literals may live, with palette provenance |
| `src/live.js` | Chain, TVL, pair and token reads |
| `src/sanitize.js` | Allowlist and clean-up for everything fetched from third parties |
| `gates/run.mjs` | Fixture-driven checks for layout, links, motion and sanitising |
| `docs/` | Whitepaper, tokenomics, roadmap and architecture notes |

## Principles

1. **Register first.** A fact is either stated, absent or unconfirmed, and the UI mirrors that state. Nothing is linked until it is stated.
2. **Untrusted by default.** Third-party text and images are filtered before they touch the page.
3. **Motion with manners.** Every animation has an instant fallback under `prefers-reduced-motion`.

## Documentation

- [Whitepaper](docs/whitepaper.md)
- [Tokenomics (draft framework)](docs/tokenomics.md)
- [Roadmap](docs/roadmap.md)
- [Architecture](docs/architecture.md)
- [Contributing](.github/CONTRIBUTING.md) and [Security policy](.github/SECURITY.md)

## Licence

[MIT](LICENSE)
