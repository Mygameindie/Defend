// Sprite/animation loading from sprites.json.
//
// Each character may define animation clips for these states:
//   run  | attack | skill | death
// A clip is either a list of frame images, or a horizontal sprite-sheet strip.
// Characters without sprites fall back to the built-in emoji rendering, so
// adding art is purely additive — drop frames in assets/ and list them here.

export const SPRITES = {}; // charId -> { run, attack, skill, death } of Clip
export const STATES = ['run', 'attack', 'skill', 'death'];

const num = (v, d) => (typeof v === 'number' && !Number.isNaN(v) ? v : d);

// A Clip = { frames: [{ url, sx, sy, sw, sh }], fps, loop }
// sw/sh === 0 means "draw the whole image" (used for plain frame lists).
function planClip(cfg) {
  if (!cfg) return null;
  const fps = num(cfg.fps, 10);
  const loop = cfg.loop !== false; // default loop, except where caller overrides
  let frames = [];

  if (Array.isArray(cfg.frames) && typeof cfg.frames[0] === 'string') {
    // Frame list: ["a.png", "b.png", ...]
    frames = cfg.frames.map(url => ({ url, sx: 0, sy: 0, sw: 0, sh: 0 }));
  } else if (cfg.sheet) {
    // Sprite sheet: one horizontal strip on `row`, `count` frames.
    const fw = num(cfg.frameWidth, 0), fh = num(cfg.frameHeight, 0);
    const count = num(cfg.count, 1), row = num(cfg.row, 0);
    for (let i = 0; i < count; i++) {
      frames.push({ url: cfg.sheet, sx: i * fw, sy: row * fh, sw: fw, sh: fh });
    }
  }
  if (frames.length === 0) return null;
  return { frames, fps, loop };
}

// Pure: turn raw JSON into a per-character plan (no image loading yet).
export function planSprites(data) {
  const src = (data && data.sprites) || {};
  const plan = {};
  for (const [charId, clips] of Object.entries(src)) {
    const out = {};
    for (const state of STATES) {
      // death defaults to non-looping unless the author says otherwise
      const cfg = clips[state];
      if (!cfg) continue;
      if (state === 'death' && cfg.loop === undefined) cfg.loop = false;
      const clip = planClip(cfg);
      if (clip) out[state] = clip;
    }
    out.facesRight = clips.facesRight !== false; // art faces right by default
    if (Object.keys(out).length > 1) plan[charId] = out;
  }
  return plan;
}

// Pure animation stepper. Mutates `anim` ({ idx, t }) and returns the frame
// index to draw. Reusable + unit-testable without a DOM.
export function advanceFrame(anim, frameCount, fps, loop, dt) {
  const frameDur = 1 / (fps || 10);
  anim.t += dt;
  while (anim.t >= frameDur) {
    anim.t -= frameDur;
    anim.idx++;
    if (anim.idx >= frameCount) anim.idx = loop ? 0 : frameCount - 1;
  }
  return Math.min(anim.idx, frameCount - 1);
}

function loadImage(url) {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => { console.warn('sprites: failed to load', url); resolve(null); };
    img.src = url;
  });
}

export async function loadSprites(url = 'sprites.json') {
  for (const k of Object.keys(SPRITES)) delete SPRITES[k];

  let data;
  try {
    const res = await fetch(url, { cache: 'no-cache' });
    if (!res.ok) { console.warn(`sprites: ${url} not found (HTTP ${res.status}); using emoji fallback`); return SPRITES; }
    data = await res.json();
  } catch (err) {
    console.warn('sprites: could not load', url, '- using emoji fallback', err);
    return SPRITES;
  }

  const plan = planSprites(data);

  // Load every unique image once, then attach to frames.
  const cache = new Map();
  const urls = new Set();
  for (const clips of Object.values(plan))
    for (const state of STATES)
      if (clips[state]) for (const f of clips[state].frames) urls.add(f.url);
  await Promise.all([...urls].map(async u => cache.set(u, await loadImage(u))));

  for (const [charId, clips] of Object.entries(plan)) {
    const out = { facesRight: clips.facesRight };
    for (const state of STATES) {
      if (!clips[state]) continue;
      const frames = clips[state].frames
        .map(f => ({ ...f, img: cache.get(f.url) }))
        .filter(f => f.img); // drop frames whose image failed to load
      if (frames.length) out[state] = { ...clips[state], frames };
    }
    if (out.run || out.attack || out.skill || out.death) SPRITES[charId] = out;
  }
  return SPRITES;
}
