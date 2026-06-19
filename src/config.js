// Game tuning constants and content definitions.

export const WORLD = {
  width: 960,
  height: 420,
  groundY: 330,        // y of the lane floor where units stand
  laneTop: 250,        // vertical jitter range top for stacking
  playerBaseX: 70,     // x where player units spawn / base sits
  enemyBaseX: 890,     // x where enemy units spawn / base sits
};

export const BASE = {
  maxHp: 1000,
  radius: 46,
};

export const ENERGY = {
  start: 40,
  max: 120,
  regenPerSec: 9,      // base regeneration
  capGrowthPerSec: 1.4 // max energy slowly grows so late game scales
};

// Character/unit definitions live in characters.json (loaded at startup via
// src/characters.js). Edit that file to add or rebalance characters.

// Enemy AI economy + cadence. The roster of units it can field is derived
// from characters.json (any character with "enemyCanUse" left on).
export const ENEMY_AI = {
  energy: { start: 30, max: 120, regenPerSec: 8, capGrowthPerSec: 1.4 },
  thinkEvery: 1.1,     // seconds between deploy decisions
};

export const COLORS = {
  player: '#4ad7d1',
  enemy: '#ff6b6b',
  playerDark: '#2c8f8b',
  enemyDark: '#b8474a',
};
