# Levvis OS Whitepaper

*Version 0.1, working draft*

## 1. Summary

A public X account is a large, unstructured diary. Anyone can scroll it; almost nobody can summarise it. Levvis OS turns that archive into four compact analysis cards that a person can keep, set beside someone else's, and pass on.

The product is delivered as an operating-system-style layer: one entry point (a handle), a shared pipeline, and a consistent set of outputs. Its home chain is Robinhood Chain.

## 2. The problem

- Timelines are chronological, but understanding is thematic. Scrolling hides patterns.
- Existing analytics dashboards answer narrow questions (impressions, follower counts) and say little about voice, habit or reputation.
- Comparison is hard. Two accounts rarely expose the same metrics in the same shape.

## 3. The four cards

| Card | Question it answers |
| --- | --- |
| Content | What does this account write about, and what recurs? |
| Behaviour | When and how does it act: pace, replies, habits? |
| Presence | What overall impression does it leave on a first visit? |
| Audience | Who engages, and what does that crowd reveal? |

Each card is a self-contained visual. Cards are generated together so they stay consistent with one another.

## 4. How a run works

1. **Intake.** The user supplies a handle.
2. **Reading.** The full reachable archive is processed as one body of material, not post by post.
3. **Synthesis.** Findings are grouped into the four lenses.
4. **Snapshot.** Four finished cards are returned together, in a format designed for saving and comparison.

## 5. Why Robinhood Chain

The chain gives the project a public, verifiable home for anything that benefits from being on record: ownership of outputs, access rules and settlement. Chain facts used by this repository's site (chain id 4663, public RPC) are listed in `src/register.js`.

## 6. Principles

- **Plain outputs.** A card should make sense without a manual.
- **Honest gaps.** If a source is silent or a fact is unconfirmed, the product says so.
- **Privacy-aware.** Analysis targets public posts only.
- **Portable.** Cards are meant to leave the product and travel.

## 7. Limitations

Analysis reflects only what is publicly reachable at run time and is an interpretation, not a verdict. Platform rules and rate limits may change what can be read.

## 8. Status

This document describes intent and shape. Specifics that are not yet announced, such as a contract address, are deliberately omitted and will appear in the register once stated.
