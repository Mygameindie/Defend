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

| `type`     | Effect                                                     | Uses |
|------------|------------------------------------------------------------|------|
| `aoe`      | Area damage burst around the unit                          | `power`, `radius` |
| `pierce`   | Fast shot that passes through multiple enemies             | `power` |
| `slow`     | Slows enemies in range by `power`% for `duration`s         | `power`, `radius`, `duration` |
| `heal`     | Restores `power` HP to nearby allies                       | `power`, `radius` |
| `shield`   | Gives nearby allies a damage-absorbing shield of `power`   | `power`, `radius` |
| `immortal` | Makes nearby allies invulnerable for `duration`s (alias `invincible`) | `radius`, `duration` |
| `buff`     | Boosts nearby allies' attack by `power`% for `duration`s   | `power`, `radius`, `duration` |
| `none`     | No special (also the default if `ability` is omitted)      | — |

Common ability fields:
- `chargeTime` — seconds until the special lights up and is tappable.
- `power` — amount or percent, depending on the type (HP healed, % slow, etc.).
- `radius` — area of effect in px.
- `duration` — seconds the timed effect lasts (`immortal`, `buff`, `slow`).

The shipped **Medic** (`heal`) and **Paladin** (`immortal`) characters are
working examples of support skills.

### Adding a *brand-new* kind of skill

The types above are data — you just pick one in `characters.json`. To invent a
genuinely new effect (e.g. `summon`, `freeze`, `lifesteal`), add one `case` to
the `switch (s.kind)` in `activateSkill()` in `src/game.js`. Timed effects can
reuse the status fields on `Unit` (`invuln`, `atkMult`/`atkBuffTimer`,
`slowFactor`/`slowTimer`) in `src/entities.js`, or add your own there. Once the
case exists, every character can use it from JSON.

Tips: set `playable: false` for an enemy-only boss; set `enemyCanUse: false`
to keep a unit exclusive to you. Any omitted field falls back to its default,
so a minimal `{ "id": "scout" }` is a valid character.

## Sprites & animations

Characters can have animated artwork defined in **`sprites.json`**. Each
character (keyed by its `id` from `characters.json`) supports four animation
clips:

| State    | When it plays                         |
|----------|---------------------------------------|
| `run`    | While marching down the lane          |
| `attack` | While fighting an enemy in place       |
| `skill`  | Briefly when its special fires         |
| `death`  | Once when it dies (then it fades out)  |

Any character **without** sprites just uses the emoji look, and any missing
clip falls back (e.g. no `death` → uses `run`/`attack`), so artwork is purely
additive.

A clip can be a **frame list** or a **sprite sheet**:

```json
{
  "sprites": {
    "ranger": {
      "facesRight": true,
      "run":    { "frames": ["assets/ranger/run1.svg", "assets/ranger/run2.svg"], "fps": 10 },
      "attack": { "sheet": "assets/ranger/attack.png", "frameWidth": 64, "frameHeight": 64, "count": 6, "row": 0, "fps": 14 },
      "death":  { "frames": ["assets/ranger/die1.svg", "assets/ranger/die2.svg"], "fps": 10, "loop": false }
    }
  }
}
```

- `frames` — ordered list of image URLs (PNG, SVG, etc.).
- `sheet` + `frameWidth`/`frameHeight`/`count`/`row` — slice one horizontal
  strip out of a sprite sheet.
- `fps` — playback speed (default `10`).
- `loop` — repeat the clip (default `true`; `death` defaults to `false` so it
  holds on the last frame).
- `facesRight` — set to `false` if your art faces left; units are flipped
  automatically to face their travel direction.

Drop image files anywhere the page can reach them (an `assets/` folder is
provided) and reload — no code changes needed. The shipped `ranger` uses
placeholder art generated by `tools/gen_sample_sprites.mjs`; run
`node tools/gen_sample_sprites.mjs` to regenerate it, or replace the files in
`assets/ranger/` with your own.

## Project structure

```
index.html        # markup + HUD
styles.css        # layout and theming
characters.json   # ★ all characters — edit this to add/rebalance units
sprites.json      # ★ per-character run/attack/skill/death animations
assets/           # sprite image frames (e.g. assets/ranger/*.svg)
tools/
  gen_sample_sprites.mjs  # regenerates the placeholder ranger art
src/
  config.js       # world, energy, and enemy-AI tuning constants
  characters.js   # loads + normalizes characters.json into the engine
  sprites.js      # loads sprites.json + animation frame stepping
  entities.js     # Unit, Base, Projectile, FloatingEffect
  game.js         # simulation: combat, skills, enemy AI, win/lose
  renderer.js     # canvas drawing (sprites + emoji fallback)
  ui.js           # HP/energy meters + deploy dock
  main.js         # input + fixed-timestep game loop
```

Character stats and abilities live in **`characters.json`**; animations live in
**`sprites.json`**. World/energy/AI tuning (regen rates, enemy cadence) lives in
`src/config.js`.
