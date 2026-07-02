# TWF Stats Randomizer

A balanced, interactive Pokémon-style stat randomizer built with React. Pick an archetype, then **draft your six stats one at a time** — each roll spends from a shared budget, so greedy early picks leave scraps for whatever you roll last.

**Live app:** https://dreadfarer.github.io/TWF-Stats-Randomizer/

## About this project

A personal project built to practice React and front-end development after completing the Python and Go tracks. The interesting problem here wasn't the UI — it was the **constrained randomization engine** underneath it.

## The core problem

Every generated stat block belongs to an *archetype* (Fast Weakling, Phys Tank, Attacker, Legendary, etc.), each defining a total stat budget (BST) range and a min–max range for each of the six stats.

The twist: stats are drafted **one at a time, in any order the user chooses**, drawing from a shared pool. Rolling a stat high early eats the budget and squeezes later stats toward their floors; rolling low early forces later stats up to spend the remainder.

The engineering challenge was guaranteeing that **no matter what order the user picks, every roll stays legal** — the remaining stats can always be filled within their own ranges, and the BST target is always hit exactly. This is solved with a two-sided reservation clamp: before each roll, the stat's effective range is narrowed so that whatever it rolls, the *remaining* stats can still reach both their minimums and maximums. The result is a system that can never reach an impossible state, while the player only ever sees the consequences of how they spent their budget.

The UI surfaces this live: the remaining pool and each pending stat's *effective range* are shown and visibly tighten as the budget drains.

## What I practised

- **Separating pure logic from UI** — the drafting engine (`src/logic/`) contains no React and is testable standalone in Node. The UI is a thin layer that calls it.
- **React state and component structure** — managing an in-progress draft as state, driving a step-by-step interaction.
- **Data-driven design** — archetypes live as plain data (`src/data/archetypes.js`), so tuning or adding one requires no logic changes.
- **Deployment** — automated build-and-deploy to GitHub Pages via GitHub Actions on every push.

## Running locally

Requires [Node.js](https://nodejs.org/) (v20+).

```bash
npm install     # install dependencies
npm run dev     # dev server with hot-reload
npm run build   # production build
```

## Tech

React + Vite, deployed to GitHub Pages via GitHub Actions.