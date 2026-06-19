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

## Project structure

```
index.html        # markup + HUD
styles.css        # layout and theming
src/
  config.js       # tuning constants + unit/skill definitions
  entities.js     # Unit, Base, Projectile, FloatingEffect
  game.js         # simulation: combat, skills, enemy AI, win/lose
  renderer.js     # canvas drawing
  ui.js           # HP/energy meters + deploy dock
  main.js         # input + fixed-timestep game loop
```

Tuning lives in `src/config.js` — adjust unit stats, costs, energy regen, and
enemy aggression there.
