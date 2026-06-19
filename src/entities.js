// Entity classes: Unit, Base, Projectile, FloatingEffect.
import { WORLD, BASE, COLORS } from './config.js';

let _id = 0;
const nextId = () => ++_id;

export class Unit {
  constructor(template, side) {
    this.id = nextId();
    this.t = template;          // unit template from config
    this.side = side;           // 'player' | 'enemy'
    this.hp = template.hp;
    this.maxHp = template.hp;
    this.atkTimer = 0;          // counts down to next attack
    this.dead = false;

    // Player marches right (+1), enemy marches left (-1).
    this.dir = side === 'player' ? 1 : -1;
    this.x = side === 'player' ? WORLD.playerBaseX + 30 : WORLD.enemyBaseX - 30;
    // small vertical scatter so units don't perfectly overlap
    this.y = WORLD.groundY + (Math.random() * 28 - 14);

    // Skill gauge (player units only build a usable gauge).
    this.gauge = 0;
    this.gaugeMax = template.skill.gauge;
    this.skillReady = false;

    // transient combat shield (from shield skill)
    this.shield = 0;

    // timed status effects (set by skills, counted down each frame)
    this.invuln = 0;       // seconds of immortality remaining
    this.atkMult = 1;      // attack multiplier (from buff)
    this.atkBuffTimer = 0; // seconds the buff lasts
    this.slowFactor = 1;   // <1 while slowed
    this.slowTimer = 0;    // seconds the slow lasts

    // little bob animation
    this.bob = Math.random() * Math.PI * 2;
  }

  get color() { return this.side === 'player' ? COLORS.player : COLORS.enemy; }
  get darkColor() { return this.side === 'player' ? COLORS.playerDark : COLORS.enemyDark; }

  // Effective stats after active status effects.
  get attack() { return this.t.atk * this.atkMult; }
  get moveSpeed() { return this.t.speed * (this.slowTimer > 0 ? this.slowFactor : 1); }

  takeDamage(amount) {
    if (this.invuln > 0) return;     // immortal: ignore all damage
    if (this.shield > 0) {
      const absorbed = Math.min(this.shield, amount);
      this.shield -= absorbed;
      amount -= absorbed;
    }
    this.hp -= amount;
    if (this.hp <= 0) { this.hp = 0; this.dead = true; }
  }

  heal(amount) { this.hp = Math.min(this.maxHp, this.hp + amount); }

  // Tick down timed status effects.
  updateStatuses(dt) {
    if (this.invuln > 0) this.invuln = Math.max(0, this.invuln - dt);
    if (this.atkBuffTimer > 0) {
      this.atkBuffTimer -= dt;
      if (this.atkBuffTimer <= 0) this.atkMult = 1;
    }
    if (this.slowTimer > 0) {
      this.slowTimer -= dt;
      if (this.slowTimer <= 0) this.slowFactor = 1;
    }
  }

  // Build skill gauge over time while alive (player only).
  chargeGauge(dt) {
    if (this.side !== 'player' || this.skillReady) return;
    this.gauge += dt;
    if (this.gauge >= this.gaugeMax) { this.gauge = this.gaugeMax; this.skillReady = true; }
  }
}

export class Base {
  constructor(side) {
    this.side = side;
    this.hp = BASE.maxHp;
    this.maxHp = BASE.maxHp;
    this.x = side === 'player' ? WORLD.playerBaseX : WORLD.enemyBaseX;
    this.y = WORLD.groundY - 10;
    this.radius = BASE.radius;
  }
  get color() { return this.side === 'player' ? COLORS.player : COLORS.enemy; }
  takeDamage(amount) { this.hp = Math.max(0, this.hp - amount); }
  get destroyed() { return this.hp <= 0; }
}

export class Projectile {
  constructor(x, y, targetSide, damage, color, pierce = false) {
    this.id = nextId();
    this.x = x; this.y = y;
    this.targetSide = targetSide; // side this projectile hurts
    this.damage = damage;
    this.color = color;
    this.pierce = pierce;         // passes through multiple enemies
    this.hits = new Set();        // ids already hit (for pierce)
    this.speed = 360;
    this.dir = targetSide === 'enemy' ? 1 : -1;
    this.dead = false;
    this.life = 3;
  }
  update(dt) {
    this.x += this.speed * this.dir * dt;
    this.life -= dt;
    if (this.life <= 0 || this.x < -20 || this.x > WORLD.width + 20) this.dead = true;
  }
}

// Short-lived visual: damage numbers, blasts, text pops.
export class FloatingEffect {
  constructor(x, y, opts = {}) {
    this.id = nextId();
    this.x = x; this.y = y;
    this.kind = opts.kind || 'text';   // 'text' | 'blast' | 'ring'
    this.text = opts.text || '';
    this.color = opts.color || '#fff';
    this.radius = opts.radius || 0;
    this.maxRadius = opts.maxRadius || 0;
    this.life = opts.life || 0.6;
    this.maxLife = this.life;
    this.vy = opts.vy ?? -28;
    this.dead = false;
  }
  update(dt) {
    this.life -= dt;
    this.y += this.vy * dt;
    if (this.kind === 'ring' || this.kind === 'blast') {
      const p = 1 - this.life / this.maxLife;
      this.radius = this.maxRadius * p;
    }
    if (this.life <= 0) this.dead = true;
  }
}
