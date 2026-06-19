// Generates simple placeholder sprite frames (SVG) for the "ranger" character
// so the sprite pipeline works out of the box. Replace assets/ranger/*.svg with
// your own art (PNG works too) — this is only a reference example.
//
//   node tools/gen_sample_sprites.mjs
import { mkdirSync, writeFileSync } from 'node:fs';

const OUT = new URL('../assets/ranger/', import.meta.url);
mkdirSync(OUT, { recursive: true });

const TUNIC = '#4ad7d1', TUNIC_D = '#2c8f8b', SKIN = '#ffd9a0', BLADE = '#e9ecf5';
const rad = d => (d * Math.PI) / 180;

// A limb/sword as a rounded line from a pivot at the given angle.
function limb(px, py, angleDeg, len, w, color) {
  const x2 = px + len * Math.cos(rad(angleDeg));
  const y2 = py + len * Math.sin(rad(angleDeg));
  return `<line x1="${px.toFixed(1)}" y1="${py.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${color}" stroke-width="${w}" stroke-linecap="round"/>`;
}

// Draw a little ranger facing right. opts tweak the pose per frame.
function ranger({ legSwing = 0, armAngle = 60, glow = 0, flash = false, fade = 1, rot = 0, dy = 0 } = {}) {
  const body = TUNIC, glowEl = glow > 0
    ? `<circle cx="32" cy="34" r="${glow}" fill="${flash ? '#ffe08a' : TUNIC}" opacity="0.35"/>` : '';
  // arm + sword pivot at the shoulder
  const shoulderX = 38, shoulderY = 30;
  const armLen = 9, swordLen = 16;
  const handX = shoulderX + armLen * Math.cos(rad(armAngle));
  const handY = shoulderY + armLen * Math.sin(rad(armAngle));
  const sword = `<line x1="${shoulderX}" y1="${shoulderY}" x2="${handX.toFixed(1)}" y2="${handY.toFixed(1)}" stroke="${SKIN}" stroke-width="4" stroke-linecap="round"/>` +
    limb(handX, handY, armAngle, swordLen, 3, BLADE);

  const inner = `
    ${glowEl}
    ${limb(28, 44, 90 + legSwing, 12, 5, TUNIC_D)}
    ${limb(36, 44, 90 - legSwing, 12, 5, TUNIC_D)}
    <ellipse cx="32" cy="35" rx="11" ry="13" fill="${body}" stroke="${TUNIC_D}" stroke-width="2"/>
    ${sword}
    <circle cx="32" cy="19" r="9" fill="${SKIN}" stroke="${TUNIC_D}" stroke-width="2"/>
    <circle cx="35" cy="18" r="1.6" fill="#22324a"/>
    <circle cx="29" cy="18" r="1.6" fill="#22324a"/>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
  <g transform="translate(0 ${dy}) rotate(${rot} 32 36)" opacity="${fade}">${inner}
  </g>
</svg>`;
}

const frames = {
  // run: legs swing, sword held back
  run1: ranger({ legSwing: -14, armAngle: 35, dy: 0 }),
  run2: ranger({ legSwing: 0, armAngle: 45, dy: -2 }),
  run3: ranger({ legSwing: 14, armAngle: 35, dy: 0 }),
  run4: ranger({ legSwing: 0, armAngle: 45, dy: -2 }),
  // attack: overhead swing down
  atk1: ranger({ armAngle: -70 }),
  atk2: ranger({ armAngle: -10 }),
  atk3: ranger({ armAngle: 60 }),
  // skill: growing glow + raised blade flash
  skill1: ranger({ armAngle: -80, glow: 10, flash: true }),
  skill2: ranger({ armAngle: -80, glow: 18, flash: true }),
  skill3: ranger({ armAngle: -80, glow: 26, flash: true }),
  // death: tip over and fade
  die1: ranger({ rot: 25, fade: 0.9, dy: 2 }),
  die2: ranger({ rot: 60, fade: 0.6, dy: 6 }),
  die3: ranger({ rot: 85, fade: 0.3, dy: 10 }),
};

for (const [name, svg] of Object.entries(frames)) {
  writeFileSync(new URL(`${name}.svg`, OUT), svg);
}
console.log(`Wrote ${Object.keys(frames).length} frames to assets/ranger/`);
