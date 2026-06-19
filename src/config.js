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

// Faction-agnostic unit templates. `range` is attack reach in px,
// `speed` is px/sec, `cooldown` is seconds between attacks.
export const UNITS = {
  ranger: {
    id: 'ranger',
    name: 'Ranger',
    icon: '🗡️',
    cost: 20,
    hp: 120,
    atk: 18,
    range: 34,
    speed: 60,
    cooldown: 0.7,
    radius: 14,
    deployCd: 2.0,      // button cooldown
    skill: { name: 'Slash Burst', gauge: 6, kind: 'aoe', power: 60, radius: 80 },
  },
  archer: {
    id: 'archer',
    name: 'Archer',
    icon: '🏹',
    cost: 28,
    hp: 70,
    atk: 14,
    range: 150,
    speed: 52,
    cooldown: 0.9,
    radius: 12,
    deployCd: 2.5,
    skill: { name: 'Volley', gauge: 7, kind: 'pierce', power: 40 },
  },
  tank: {
    id: 'tank',
    name: 'Tank',
    icon: '🛡️',
    cost: 45,
    hp: 420,
    atk: 12,
    range: 30,
    speed: 36,
    cooldown: 1.1,
    radius: 18,
    deployCd: 5.0,
    skill: { name: 'Taunt Wall', gauge: 9, kind: 'shield', power: 200 },
  },
  bomber: {
    id: 'bomber',
    name: 'Bomber',
    icon: '💣',
    cost: 38,
    hp: 90,
    atk: 8,
    range: 40,
    speed: 70,
    cooldown: 1.0,
    radius: 14,
    deployCd: 4.0,
    skill: { name: 'Big Boom', gauge: 5, kind: 'aoe', power: 120, radius: 110 },
  },
};

// Order units appear in the dock.
export const DOCK_ORDER = ['ranger', 'archer', 'tank', 'bomber'];

// Enemy AI: which units it can field and how aggressively it spends.
export const ENEMY_AI = {
  energy: { start: 30, max: 120, regenPerSec: 8, capGrowthPerSec: 1.4 },
  roster: ['ranger', 'archer', 'tank', 'bomber'],
  thinkEvery: 1.1,     // seconds between deploy decisions
};

export const COLORS = {
  player: '#4ad7d1',
  enemy: '#ff6b6b',
  playerDark: '#2c8f8b',
  enemyDark: '#b8474a',
};
