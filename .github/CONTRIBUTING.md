# Contributing to Levvis OS

Thanks for helping. A few ground rules keep the project tidy.

## Setup

```bash
npm install
npm run dev
```

Before opening a pull request, run both:

```bash
npm run build
npm run gates
```

Both must exit 0.

## Ground rules

- **Facts go in the register.** Add or change external facts (addresses, links, handles) in `src/register.js` with an honest state. Never hard-code them elsewhere.
- **No links for unstated facts.** Unstated records render inert.
- **Colours live in `src/tokens.css`.** No colour literals anywhere else. If you add a swatch, note where it was sampled.
- **Treat third-party data as hostile.** Route it through `src/sanitize.js`.
- **Respect reduced motion.** Every animation needs an instant fallback.
- **Touch targets are at least 48 px**, and layouts must not overflow at 360, 390, 430, 1366 and 1440 px wide.
- **Original writing only.** Copy and docs must be your own words.

## Pull requests

1. Keep changes focused; one concern per PR.
2. Describe what changed and why, and mention any gate you added or altered.
3. Add or update a gate when behaviour changes.

## Reporting problems

Bugs and ideas: open an issue with steps to reproduce. Security problems: follow [SECURITY.md](SECURITY.md) instead of filing a public issue.
