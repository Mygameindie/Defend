// Bootstrap: load characters, wire the canvas/UI/input, run the game loop.
import { Game } from './game.js';
import { Renderer } from './renderer.js';
import { UI } from './ui.js';
import { loadCharacters, DOCK_ORDER } from './characters.js';

const overlay = document.getElementById('overlay');
const result = document.getElementById('result');
const resultTitle = document.getElementById('resultTitle');
const resultSub = document.getElementById('resultSub');

init();

async function init() {
  // Characters must be loaded before the Game/UI are built.
  try {
    await loadCharacters();
  } catch (err) {
    console.error(err);
    const startBtn = document.getElementById('startBtn');
    if (startBtn) {
      startBtn.textContent = 'FAILED TO LOAD characters.json';
      startBtn.disabled = true;
    }
    return;
  }

  const canvas = document.getElementById('game');
  const game = new Game();
  const renderer = new Renderer(canvas);
  const ui = new UI(game);

  document.getElementById('startBtn').addEventListener('click', () => {
    overlay.classList.add('hidden');
    game.start();
  });
  document.getElementById('againBtn').addEventListener('click', () => {
    result.classList.add('hidden');
    game.start();
  });

  // Tap a unit to fire its special skill.
  canvas.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    if (game.state !== 'playing') return;
    const { x, y } = renderer.toWorld(e.clientX, e.clientY);
    const unit = game.unitAt(x, y);
    if (unit && unit.skillReady) game.activateSkill(unit);
  });

  // Number keys 1-9 deploy the units in dock order.
  window.addEventListener('keydown', (e) => {
    const idx = parseInt(e.key, 10) - 1;
    const id = DOCK_ORDER[idx];
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
}
