// Core game state, simulation loop, combat resolution, and enemy AI.
import { WORLD, ENERGY, ENEMY_AI, COLORS } from './config.js';
import { UNITS, ENEMY_ROSTER } from './characters.js';
import { Unit, Base, Projectile, FloatingEffect } from './entities.js';

export class Game {
  constructor() {
    this.reset();
  }

  reset() {
    this.units = [];
    this.projectiles = [];
    this.effects = [];

    this.playerBase = new Base('player');
    this.enemyBase = new Base('enemy');

    this.energy = ENERGY.start;
    this.energyMax = ENERGY.max;

    this.enemyEnergy = ENEMY_AI.energy.start;
    this.enemyEnergyMax = ENEMY_AI.energy.max;
    this.enemyThinkTimer = 0;

    this.deployCd = {};            // per-unit-id button cooldowns (player)
    for (const id of Object.keys(UNITS)) this.deployCd[id] = 0;

    this.state = 'menu';           // 'menu' | 'playing' | 'won' | 'lost'
    this.elapsed = 0;
  }

  start() {
    this.reset();
    this.state = 'playing';
  }

  // ---------- Deploy ----------
  canDeploy(unitId) {
    const t = UNITS[unitId];
    return this.state === 'playing' && this.energy >= t.cost && this.deployCd[unitId] <= 0;
  }

  deployPlayer(unitId) {
    if (!this.canDeploy(unitId)) return false;
    const t = UNITS[unitId];
    this.energy -= t.cost;
    this.deployCd[unitId] = t.deployCd;
    this.units.push(new Unit(t, 'player'));
    return true;
  }

  deployEnemy(unitId) {
    const t = UNITS[unitId];
    this.enemyEnergy -= t.cost;
    this.units.push(new Unit(t, 'enemy'));
  }

  // ---------- Skill activation (player taps a ranger) ----------
  unitAt(x, y) {
    // topmost player unit under the point that has a ready skill preferred
    let best = null;
    for (const u of this.units) {
      if (u.side !== 'player' || u.dead) continue;
      const dx = u.x - x, dy = u.y - y;
      if (dx * dx + dy * dy <= (u.t.radius + 10) ** 2) {
        if (!best || (u.skillReady && !best.skillReady)) best = u;
      }
    }
    return best;
  }

  // Allies on `unit`'s side within `radius` px (used by support skills).
  alliesNear(unit, radius) {
    return this.units.filter(a =>
      a.side === unit.side && !a.dead && Math.abs(a.x - unit.x) <= radius);
  }

  activateSkill(unit) {
    if (!unit || !unit.skillReady || unit.dead) return false;
    const s = unit.t.skill;
    unit.skillReady = false;
    unit.gauge = 0;
    unit.skillTimer = 0.5; // play the skill animation briefly

    switch (s.kind) {
      // ---- offensive ----
      case 'aoe': {                 // area damage burst around the unit
        const cx = unit.x + unit.dir * (s.radius * 0.4);
        this.damageArea(cx, unit.y, s.radius, s.power, 'enemy', unit.color);
        this.effects.push(new FloatingEffect(cx, unit.y, {
          kind: 'blast', color: unit.color, maxRadius: s.radius, life: 0.45,
        }));
        break;
      }
      case 'pierce': {              // fast shot that passes through enemies
        const p = new Projectile(unit.x, unit.y - 8, 'enemy', s.power, '#ffe08a', true);
        p.speed = 520;
        this.projectiles.push(p);
        break;
      }
      case 'slow': {                // slow nearby enemies for `duration`s
        const r = s.radius || 120;
        const factor = Math.max(0.05, 1 - s.power / 100); // power = % slow
        for (const e of this.units) {
          if (e.side === 'enemy' && !e.dead && Math.abs(e.x - unit.x) <= r) {
            e.slowFactor = factor;
            e.slowTimer = Math.max(e.slowTimer, s.duration);
          }
        }
        this.effects.push(new FloatingEffect(unit.x, unit.y - 20, {
          kind: 'text', text: '❄ SLOW', color: '#9fd4ff', life: 0.9,
        }));
        break;
      }

      // ---- support (affect allies near the caster) ----
      case 'shield': {              // absorb-damage shield
        for (const a of this.alliesNear(unit, s.radius || 90)) a.shield += s.power;
        this.popText(unit, '🛡 SHIELD', '#9fe7ff');
        break;
      }
      case 'heal': {                // restore HP to nearby allies
        for (const a of this.alliesNear(unit, s.radius || 110)) {
          a.heal(s.power);
          this.effects.push(new FloatingEffect(a.x, a.y - 14, {
            kind: 'text', text: '+' + Math.round(s.power), color: '#7ee787', life: 0.6, vy: -40,
          }));
        }
        this.popText(unit, '✚ HEAL', '#7ee787');
        break;
      }
      case 'invincible':            // a.k.a. "immortal"
      case 'immortal': {            // make nearby allies invulnerable briefly
        for (const a of this.alliesNear(unit, s.radius || 90)) {
          a.invuln = Math.max(a.invuln, s.duration);
        }
        this.popText(unit, '✦ IMMORTAL', '#ffd54a');
        break;
      }
      case 'buff': {                // temporary attack boost (power = % bonus)
        const mult = 1 + s.power / 100;
        for (const a of this.alliesNear(unit, s.radius || 100)) {
          a.atkMult = Math.max(a.atkMult, mult);
          a.atkBuffTimer = Math.max(a.atkBuffTimer, s.duration);
        }
        this.popText(unit, '⚔ RAGE', '#ffb35c');
        break;
      }
      default:
        return false; // 'none' or unknown kind: nothing happens
    }

    this.effects.push(new FloatingEffect(unit.x, unit.y - 28, {
      kind: 'text', text: s.name + '!', color: COLORS.player, life: 0.9,
    }));
    return true;
  }

  popText(unit, text, color) {
    this.effects.push(new FloatingEffect(unit.x, unit.y - 20, { kind: 'text', text, color, life: 0.9 }));
  }

  damageArea(cx, cy, radius, power, targetSide, color) {
    for (const u of this.units) {
      if (u.side !== targetSide || u.dead) continue;
      const dx = u.x - cx, dy = u.y - cy;
      if (dx * dx + dy * dy <= radius * radius) {
        u.takeDamage(power);
        this.spawnHit(u.x, u.y, power, color);
      }
    }
    // also damage the base if in radius
    const base = targetSide === 'enemy' ? this.enemyBase : this.playerBase;
    if (Math.abs(base.x - cx) <= radius + base.radius) {
      base.takeDamage(power * 0.5);
    }
  }

  spawnHit(x, y, amount, color) {
    this.effects.push(new FloatingEffect(x, y - 14, {
      kind: 'text', text: '-' + Math.round(amount), color, life: 0.5, vy: -40,
    }));
  }

  // ---------- Main update ----------
  update(dt) {
    if (this.state !== 'playing') return;
    this.elapsed += dt;

    // Energy regen + slow cap growth.
    this.energyMax = Math.min(220, this.energyMax + ENERGY.capGrowthPerSec * dt);
    this.energy = Math.min(this.energyMax, this.energy + ENERGY.regenPerSec * dt);
    this.enemyEnergyMax = Math.min(220, this.enemyEnergyMax + ENEMY_AI.energy.capGrowthPerSec * dt);
    this.enemyEnergy = Math.min(this.enemyEnergyMax, this.enemyEnergy + ENEMY_AI.energy.regenPerSec * dt);

    for (const id of Object.keys(this.deployCd)) {
      if (this.deployCd[id] > 0) this.deployCd[id] = Math.max(0, this.deployCd[id] - dt);
    }

    this.runEnemyAI(dt);
    this.updateUnits(dt);
    this.updateProjectiles(dt);
    this.updateEffects(dt);
    this.cleanup();
    this.checkWin();
  }

  runEnemyAI(dt) {
    this.enemyThinkTimer -= dt;
    if (this.enemyThinkTimer > 0) return;
    this.enemyThinkTimer = ENEMY_AI.thinkEvery;

    // Difficulty ramps: enemy gets slightly hungrier over time.
    const affordable = ENEMY_ROSTER.filter(id => this.enemyEnergy >= UNITS[id].cost);
    if (affordable.length === 0) return;

    // Bias: when the player is pushing, field the toughest affordable unit.
    const playerPush = this.units.filter(u => u.side === 'player' && u.x > WORLD.width * 0.5).length;
    let pick;
    if (playerPush >= 2 && Math.random() < 0.5) {
      pick = affordable.reduce((a, b) => (UNITS[b].hp > UNITS[a].hp ? b : a));
    } else {
      pick = affordable[Math.floor(Math.random() * affordable.length)];
    }
    // Don't always spend; keep some tension.
    if (Math.random() < 0.85) this.deployEnemy(pick);
  }

  updateUnits(dt) {
    for (const u of this.units) {
      if (u.dead) { u.corpseTimer -= dt; continue; } // tick death animation
      u.bob += dt * 6;
      u.chargeGauge(dt);
      u.updateStatuses(dt);
      if (u.atkTimer > 0) u.atkTimer -= dt;

      const target = this.findTarget(u);
      if (target) {
        const dist = target.kind === 'base'
          ? Math.abs(target.x - u.x) - target.radius
          : Math.abs(target.x - u.x);
        if (dist <= u.t.range) {
          // In range: attack instead of moving.
          u.moving = false;
          if (u.atkTimer <= 0) {
            u.atkTimer = u.t.cooldown;
            this.performAttack(u, target);
          }
          continue;
        }
      }
      // March forward (slowed if a slow effect is active).
      u.moving = true;
      u.x += u.moveSpeed * u.dir * dt;
      // clamp so units don't walk into the opposing base spawn
      u.x = Math.max(WORLD.playerBaseX, Math.min(WORLD.enemyBaseX, u.x));
    }
  }

  // Find nearest enemy unit ahead, else the enemy base.
  findTarget(u) {
    const enemySide = u.side === 'player' ? 'enemy' : 'player';
    let best = null, bestDist = Infinity;
    for (const o of this.units) {
      if (o.side !== enemySide || o.dead) continue;
      // only target things in front (or overlapping)
      const ahead = u.dir > 0 ? o.x >= u.x - 12 : o.x <= u.x + 12;
      if (!ahead) continue;
      const d = Math.abs(o.x - u.x);
      if (d < bestDist) { bestDist = d; best = o; }
    }
    if (best && bestDist <= u.t.range + 6) return best;

    // If no unit blocks within reach, head for the base.
    const base = enemySide === 'enemy' ? this.enemyBase : this.playerBase;
    if (!base.destroyed) return { kind: 'base', x: base.x, radius: base.radius, ref: base };
    return best; // may be null
  }

  performAttack(u, target) {
    const dmg = u.attack; // includes buff multiplier
    if (u.t.range > 70) {
      // ranged: fire a projectile
      const color = u.side === 'player' ? '#bdfffb' : '#ffd0d0';
      this.projectiles.push(new Projectile(u.x + u.dir * 8, u.y - 8,
        u.side === 'player' ? 'enemy' : 'player', dmg, color));
    } else {
      // melee: instant hit
      if (target.kind === 'base') {
        target.ref.takeDamage(dmg);
        this.spawnHit(target.x + (u.dir < 0 ? target.radius : -target.radius), u.y - 10, dmg, u.color);
      } else {
        target.takeDamage(dmg);
        this.spawnHit(target.x, target.y, dmg, u.color);
      }
    }
  }

  updateProjectiles(dt) {
    for (const p of this.projectiles) {
      p.update(dt);
      if (p.dead) continue;
      // hit units of the target side
      for (const u of this.units) {
        if (u.side !== p.targetSide || u.dead) continue;
        if (p.hits.has(u.id)) continue;
        const dx = u.x - p.x, dy = u.y - p.y;
        if (dx * dx + dy * dy <= (u.t.radius + 6) ** 2) {
          u.takeDamage(p.damage);
          this.spawnHit(u.x, u.y, p.damage, p.color);
          if (p.pierce) { p.hits.add(u.id); }
          else { p.dead = true; break; }
        }
      }
      if (p.dead) continue;
      // hit base
      const base = p.targetSide === 'enemy' ? this.enemyBase : this.playerBase;
      if (!base.destroyed && Math.abs(base.x - p.x) <= base.radius) {
        base.takeDamage(p.damage);
        if (!p.pierce) p.dead = true;
      }
    }
  }

  updateEffects(dt) { for (const e of this.effects) e.update(dt); }

  cleanup() {
    // keep dead units around briefly so their death animation can play
    this.units = this.units.filter(u => !u.dead || u.corpseTimer > 0);
    this.projectiles = this.projectiles.filter(p => !p.dead);
    this.effects = this.effects.filter(e => !e.dead);
  }

  checkWin() {
    if (this.enemyBase.destroyed) this.state = 'won';
    else if (this.playerBase.destroyed) this.state = 'lost';
  }
}
