# Defend — a Line Ranger–style lane battle

A browser game inspired by **Line Ranger**: a side-scrolling, tug-of-war lane
defense. Spend energy to deploy units that march toward the enemy base and
auto-fight along a single line. Tap a unit when its skill gauge is full to
unleash a special. Smash the enemy base before they smash yours.

## Run it

The game uses native ES modules, so it must be served over HTTP (opening
`index.html` directly via `file://` is blocked by browsers).

```bash
# from the project root
python3 -m http.server 8000
# then open http://localhost:8000
```

Any static server works (`npx serve`, `php -S localhost:8000`, etc.).

## How to play

- **Energy** refills over time at the bottom of the screen.
- Click a **unit button** (or press `1`–`4`) to deploy that unit. Each costs
  energy and has a short redeploy cooldown.
- Units automatically march right and attack whatever they meet.
- When a player unit's gold gauge fills, it **glows** — **click it** to fire its
  special skill.
- Destroy the enemy base (top-right HP bar) to win; protect your own (top-left).

## Units

| Unit    | Role            | Special        |
|---------|-----------------|----------------|
| 🗡️ Ranger | Cheap melee     | Slash Burst (AoE) |
| 🏹 Archer | Ranged poke     | Volley (piercing shot) |
| 🛡️ Tank   | Frontline wall  | Taunt Wall (shields allies) |
| 💣 Bomber | Glass-cannon AoE| Big Boom (large AoE) |

## Adding / editing characters

All characters live in **`characters.json`** — edit that file and reload the
page; no code changes needed. Each entry looks like:

```json
{
  "id": "mage",
  "name": "Mage",
  "icon": "🔮",
  "cost": 35,
  "health": 80,
  "power": 22,
  "range": 180,
  "speed": 48,
  "attackSpeed": 0.9,
  "size": 13,
  "deployCooldown": 3.0,
  "playable": true,
  "enemyCanUse": true,
  "ability": {
    "name": "Frost Nova",
    "type": "aoe",
    "power": 90,
    "radius": 100,
    "chargeTime": 8
  }
}
```

### Fields

| Field            | Meaning                                                     | Default |
|------------------|-------------------------------------------------------------|---------|
| `id`             | Unique identifier (**required**)                            | —       |
| `name`           | Display name                                                | `id`    |
| `icon`           | Emoji drawn on the unit and its button                      | `⭐`    |
| `cost`           | Energy to deploy                                            | `20`    |
| `health`         | Hit points                                                  | `100`   |
| `power`          | Damage per attack                                           | `10`    |
| `range`          | Attack reach in px (`> 70` makes it ranged/projectile)      | `34`    |
| `speed`          | March speed in px/sec                                       | `50`    |
| `attackSpeed`    | Seconds between attacks (lower = faster)                    | `1.0`   |
| `size`           | Body radius in px                                           | `14`    |
| `deployCooldown` | Seconds before you can redeploy this unit                  | `2.0`   |
| `playable`       | Show in your deploy dock                                    | `true`  |
| `enemyCanUse`    | Let the enemy AI field this unit                            | `true`  |
| `ability`        | Special skill (see below); omit for no special             | none    |

### Ability types

- `aoe` — area blast at the unit, using `power` and `radius`.
- `pierce` — fast shot that passes through enemies, using `power`.
- `shield` — grants nearby allies a shield equal to `power`.
- `none` (or omitted) — the unit simply has no special.

`ability.chargeTime` is how many seconds until the special is ready to tap.

Tips: set `playable: false` for an enemy-only boss; set `enemyCanUse: false`
to keep a unit exclusive to you. Any omitted field falls back to its default,
so a minimal `{ "id": "scout" }` is a valid character.

## Project structure

```
index.html        # markup + HUD
styles.css        # layout and theming
characters.json   # ★ all characters — edit this to add/rebalance units
src/
  config.js       # world, energy, and enemy-AI tuning constants
  characters.js   # loads + normalizes characters.json into the engine
  entities.js     # Unit, Base, Projectile, FloatingEffect
  game.js         # simulation: combat, skills, enemy AI, win/lose
  renderer.js     # canvas drawing
  ui.js           # HP/energy meters + deploy dock
  main.js         # input + fixed-timestep game loop
```

Character stats and abilities live in **`characters.json`**. World/energy/AI
tuning (regen rates, enemy cadence) lives in `src/config.js`.
