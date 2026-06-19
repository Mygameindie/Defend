// HUD wiring: HP/energy meters and the deployable unit dock.
import { UNITS, DOCK_ORDER } from './characters.js';

export class UI {
  constructor(game) {
    this.game = game;
    this.buttons = {}; // unitId -> { el, cd, cost, disabled }

    this.playerHpFill = document.getElementById('playerHpFill');
    this.enemyHpFill = document.getElementById('enemyHpFill');
    this.energyFill = document.getElementById('energyFill');
    this.energyText = document.getElementById('energyText');
    this.statusEl = document.getElementById('status');

    this.buildDock();
  }

  buildDock() {
    const bar = document.getElementById('unitBar');
    bar.innerHTML = '';
    for (const id of DOCK_ORDER) {
      const t = UNITS[id];
      const btn = document.createElement('button');
      btn.className = 'unit-btn';
      btn.innerHTML = `
        <div class="cd"></div>
        <div class="icon">${t.icon}</div>
        <div class="name">${t.name}</div>
        <div class="cost">⚡${t.cost}</div>`;
      btn.addEventListener('click', () => this.game.deployPlayer(id));
      bar.appendChild(btn);
      this.buttons[id] = {
        el: btn,
        cd: btn.querySelector('.cd'),
        disabled: false,
      };
    }
  }

  update() {
    const g = this.game;
    // HP meters
    this.playerHpFill.style.width = (g.playerBase.hp / g.playerBase.maxHp * 100) + '%';
    this.enemyHpFill.style.width = (g.enemyBase.hp / g.enemyBase.maxHp * 100) + '%';

    // Energy meter
    this.energyFill.style.width = (g.energy / g.energyMax * 100) + '%';
    this.energyText.textContent = `${Math.floor(g.energy)} / ${Math.floor(g.energyMax)}`;

    // Buttons: affordability + cooldown shade
    for (const id of DOCK_ORDER) {
      const t = UNITS[id];
      const b = this.buttons[id];
      const affordable = g.energy >= t.cost;
      const onCd = g.deployCd[id] > 0;
      const disabled = !affordable || onCd || g.state !== 'playing';
      if (disabled !== b.disabled) {
        b.el.classList.toggle('disabled', disabled);
        b.disabled = disabled;
      }
      // cooldown overlay (scaleY from 1 -> 0)
      const frac = onCd ? g.deployCd[id] / t.deployCd : 0;
      b.cd.style.transform = `scaleY(${frac})`;
    }
  }
}
