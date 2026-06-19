// Character roster loaded from characters.json at startup.
// Edit characters.json to add / remove / rebalance characters — no code changes.
//
// These containers are populated in place by loadCharacters(), so other modules
// can import them once and keep referencing the same live objects.
export const UNITS = {};        // id -> internal template used by the engine
export const DOCK_ORDER = [];   // ids shown as player deploy buttons (file order)
export const ENEMY_ROSTER = []; // ids the enemy AI is allowed to field

const num = (v, d) => (typeof v === 'number' && !Number.isNaN(v) ? v : d);

// Map a friendly characters.json entry onto the internal template shape the
// rest of the engine expects (hp/atk/cooldown/radius/skill...).
function normalize(c) {
  const ability = c.ability || {};
  const kind = ability.type || 'none';
  return {
    id: c.id,
    name: c.name || c.id,
    icon: c.icon || '⭐',
    cost: num(c.cost, 20),
    hp: num(c.health, 100),
    atk: num(c.power, 10),
    range: num(c.range, 34),
    speed: num(c.speed, 50),
    cooldown: num(c.attackSpeed, 1.0),
    radius: num(c.size, 14),
    deployCd: num(c.deployCooldown, 2.0),
    playable: c.playable !== false,
    enemyCanUse: c.enemyCanUse !== false,
    skill: {
      name: ability.name || 'None',
      kind,
      power: num(ability.power, 0),
      radius: num(ability.radius, 0),
      // No ability => gauge never fills, so the special never lights up.
      gauge: kind === 'none' ? Infinity : num(ability.chargeTime, 8),
    },
  };
}

export async function loadCharacters(url = 'characters.json') {
  const res = await fetch(url, { cache: 'no-cache' });
  if (!res.ok) throw new Error(`Failed to load ${url}: HTTP ${res.status}`);
  const data = await res.json();
  const list = Array.isArray(data) ? data : (data.characters || []);

  // Reset containers in place.
  for (const k of Object.keys(UNITS)) delete UNITS[k];
  DOCK_ORDER.length = 0;
  ENEMY_ROSTER.length = 0;

  for (const raw of list) {
    if (!raw || !raw.id) { console.warn('characters.json: skipping entry without an id', raw); continue; }
    if (UNITS[raw.id]) { console.warn(`characters.json: duplicate id "${raw.id}" ignored`); continue; }
    const t = normalize(raw);
    UNITS[t.id] = t;
    if (t.playable) DOCK_ORDER.push(t.id);
    if (t.enemyCanUse) ENEMY_ROSTER.push(t.id);
  }

  if (DOCK_ORDER.length === 0) console.warn(`characters.json: no playable characters found in ${url}`);
  if (ENEMY_ROSTER.length === 0) console.warn(`characters.json: no enemy-usable characters found in ${url}`);
  return { UNITS, DOCK_ORDER, ENEMY_ROSTER };
}
