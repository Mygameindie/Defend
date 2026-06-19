// Canvas renderer: draws the lane, bases, units, projectiles, and effects.
import { WORLD, COLORS } from './config.js';

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
  }

  // Convert a CSS-pixel pointer position into world coordinates.
  toWorld(clientX, clientY) {
    const r = this.canvas.getBoundingClientRect();
    return {
      x: (clientX - r.left) / r.width * WORLD.width,
      y: (clientY - r.top) / r.height * WORLD.height,
    };
  }

  draw(game) {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, WORLD.width, WORLD.height);
    this.drawBackground(ctx);
    this.drawBase(ctx, game.playerBase);
    this.drawBase(ctx, game.enemyBase);

    // draw units sorted by y so lower ones appear in front
    const sorted = [...game.units].sort((a, b) => a.y - b.y);
    for (const u of sorted) this.drawUnit(ctx, u);

    for (const p of game.projectiles) this.drawProjectile(ctx, p);
    for (const e of game.effects) this.drawEffect(ctx, e);
  }

  drawBackground(ctx) {
    // sky gradient
    const g = ctx.createLinearGradient(0, 0, 0, WORLD.height);
    g.addColorStop(0, '#141733');
    g.addColorStop(0.7, '#0e1024');
    g.addColorStop(1, '#0a0b18');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, WORLD.width, WORLD.height);

    // distant midline marker (no man's land)
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(WORLD.width / 2, 120);
    ctx.lineTo(WORLD.width / 2, WORLD.height);
    ctx.stroke();

    // ground band
    ctx.fillStyle = '#161a36';
    ctx.fillRect(0, WORLD.groundY - 6, WORLD.width, WORLD.height - WORLD.groundY + 6);
    ctx.fillStyle = 'rgba(255,255,255,0.04)';
    for (let x = 0; x < WORLD.width; x += 48) {
      ctx.fillRect(x, WORLD.groundY - 6, 24, 4);
    }
  }

  drawBase(ctx, base) {
    const x = base.x, y = base.y;
    const pct = base.hp / base.maxHp;

    // tower body
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = '#20243f';
    ctx.strokeStyle = base.color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(-base.radius, -base.radius - 18, base.radius * 2, base.radius * 2 + 18, 10);
    ctx.fill();
    ctx.stroke();

    // crystal core, dims as HP drops
    ctx.globalAlpha = 0.35 + pct * 0.65;
    ctx.fillStyle = base.color;
    ctx.beginPath();
    ctx.moveTo(0, -base.radius - 4);
    ctx.lineTo(base.radius * 0.5, -8);
    ctx.lineTo(0, base.radius * 0.5);
    ctx.lineTo(-base.radius * 0.5, -8);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.restore();

    // emoji marker
    ctx.font = '24px serif';
    ctx.textAlign = 'center';
    ctx.fillText(base.side === 'player' ? '🏰' : '👹', x, y + 6);
  }

  drawUnit(ctx, u) {
    const bobY = Math.sin(u.bob) * 2;
    const x = u.x, y = u.y + bobY;
    const r = u.t.radius;

    // shadow
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.ellipse(u.x, u.y + r * 0.9, r, r * 0.4, 0, 0, Math.PI * 2);
    ctx.fill();

    // shield aura
    if (u.shield > 0) {
      ctx.strokeStyle = 'rgba(159,231,255,0.8)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, r + 5, 0, Math.PI * 2);
      ctx.stroke();
    }

    // body
    ctx.fillStyle = u.color;
    ctx.strokeStyle = u.darkColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // icon
    ctx.font = `${Math.round(r * 1.3)}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(u.t.icon, x, y + 1);
    ctx.textBaseline = 'alphabetic';

    // hp bar
    const w = r * 2, hpct = u.hp / u.maxHp;
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(x - r, y - r - 9, w, 4);
    ctx.fillStyle = hpct > 0.4 ? '#7ee787' : '#ff7b7b';
    ctx.fillRect(x - r, y - r - 9, w * hpct, 4);

    // skill-ready glow ring (player tappable)
    if (u.skillReady) {
      const pulse = 0.5 + 0.5 * Math.sin(Date.now() / 120);
      ctx.strokeStyle = `rgba(255,207,92,${0.5 + pulse * 0.5})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(x, y, r + 6 + pulse * 2, 0, Math.PI * 2);
      ctx.stroke();
    } else if (u.side === 'player') {
      // gauge fill arc
      const gpct = u.gauge / u.gaugeMax;
      ctx.strokeStyle = 'rgba(255,207,92,0.85)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(x, y, r + 5, -Math.PI / 2, -Math.PI / 2 + gpct * Math.PI * 2);
      ctx.stroke();
    }
  }

  drawProjectile(ctx, p) {
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.pierce ? 6 : 4, 0, Math.PI * 2);
    ctx.fill();
    // little trail
    ctx.strokeStyle = p.color;
    ctx.globalAlpha = 0.4;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.x - p.dir * 12, p.y);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  drawEffect(ctx, e) {
    const a = Math.max(0, e.life / e.maxLife);
    if (e.kind === 'text') {
      ctx.globalAlpha = a;
      ctx.fillStyle = e.color;
      ctx.font = 'bold 16px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(e.text, e.x, e.y);
      ctx.globalAlpha = 1;
    } else if (e.kind === 'blast') {
      ctx.globalAlpha = a * 0.7;
      const grd = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, Math.max(1, e.radius));
      grd.addColorStop(0, e.color);
      grd.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.arc(e.x, e.y, Math.max(1, e.radius), 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    } else if (e.kind === 'ring') {
      ctx.globalAlpha = a;
      ctx.strokeStyle = e.color;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(e.x, e.y, Math.max(1, e.radius), 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }
}
