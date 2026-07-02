import { archetypes } from "../data/archetypes.js";

const getRandomInt = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

export function startRoll(archetype) {
    const targetBST = getRandomInt(archetype.bst.min, archetype.bst.max);

    return {
        archetype,
        targetBST,
        rolled: {},
        remaining: Object.keys(archetype.stats),
        pool: targetBST,
    };
}

export function getEffectiveRange(rollState, statName) {
    const { archetype, remaining, pool } = rollState;
    const min = archetype.stats[statName].min;
    const max = archetype.stats[statName].max;

    const remainingAfterThis = remaining.filter((s) => s !== statName);
    const minRemainingBST = remainingAfterThis.reduce((sum, s) => sum + archetype.stats[s].min, 0);
    const maxRemainingBST = remainingAfterThis.reduce((sum, s) => sum + archetype.stats[s].max, 0);

    // Don't take so much that remaining stats can't reach their minimums,
    // and don't take so little that remaining stats can't absorb the leftover within their maximums.
    return {
        min: Math.max(min, pool - maxRemainingBST),
        max: Math.min(max, pool - minRemainingBST),
    };
}

export function rollNextStat(rollState, statName) {
    const { archetype, rolled, remaining, pool } = rollState;
    const { min: effectiveMin, max: effectiveMax } = getEffectiveRange(rollState, statName);
    const value = getRandomInt(effectiveMin, effectiveMax);

    const remainingAfterThis = remaining.filter((s) => s !== statName);
    const state = {
        archetype,
        targetBST: rollState.targetBST,
        rolled: { ...rolled, [statName]: value },
        remaining: remainingAfterThis,
        pool: pool - value,
    };

    return { value, state };
}

export function rollStats(archetype, statOrder) {
    let state = startRoll(archetype);

    for (const statName of statOrder) {
        ({ state } = rollNextStat(state, statName));
    }

    return { bst: state.targetBST, stats: state.rolled };
}

const result = rollStats(archetypes[0], ['spe', 'atk', 'hp', 'def', 'spd', 'spa']);
console.log("bst:", result.bst);
console.log("stats:", result.stats);
