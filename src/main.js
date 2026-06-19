// Bootstrap: wires the canvas, UI, input, and runs the fixed-step game loop.
import { Game } from './game.js';
import { Renderer } from './renderer.js';
import { UI } from './ui.js';

const canvas = document.getElementById('game');
const game = new Game();
const renderer = new Renderer(canvas);
const ui = new UI(game);

const overlay = document.getElementById('overlay');
const result = document.getElementById('result');
const resultTitle = document.getElementById('resultTitle');
const resultSub = document.getElementById('resultSub');

document.getElementById('startBtn').addEventListener('click', () => {
  overlay.classList.add('hidden');
  game.start();
});
document.getElementById('againBtn').addEventListener('click', () => {
  result.classList.add('hidden');
  game.start();
});

// Tap a unit to fire its special skill.
function handleTap(clientX, clientY) {
  if (game.state !== 'playing') return;
  const { x, y } = renderer.toWorld(clientX, clientY);
  const unit = game.unitAt(x, y);
  if (unit && unit.skillReady) game.activateSkill(unit);
}
canvas.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  handleTap(e.clientX, e.clientY);
});

// Keyboard shortcuts: 1-4 deploy units.
const KEY_TO_UNIT = { '1': 'ranger', '2': 'archer', '3': 'tank', '4': 'bomber' };
window.addEventListener('keydown', (e) => {
  const id = KEY_TO_UNIT[e.key];
  if (id) game.deployPlayer(id);
});

let lastResultState = 'playing';
function showResultIfNeeded() {
  if ((game.state === 'won' || game.state === 'lost') && lastResultState === 'playing') {
    resultTitle.textContent = game.state === 'won' ? 'VICTORY' : 'DEFEAT';
    resultTitle.style.color = game.state === 'won' ? 'var(--accent)' : 'var(--enemy)';
    resultSub.textContent = game.state === 'won'
      ? `Enemy base destroyed in ${game.elapsed.toFixed(1)}s. Well defended!`
      : 'Your base has fallen. Try a different unit mix!';
    result.classList.remove('hidden');
  }
  lastResultState = game.state;
}

// Fixed-timestep simulation with a render every frame.
const STEP = 1 / 60;
let acc = 0;
let last = performance.now();

function frame(now) {
  let dt = (now - last) / 1000;
  last = now;
  if (dt > 0.25) dt = 0.25; // avoid spiral after tab switch
  acc += dt;
  while (acc >= STEP) {
    game.update(STEP);
    acc -= STEP;
  }
  ui.update();
  renderer.draw(game);
  showResultIfNeeded();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
