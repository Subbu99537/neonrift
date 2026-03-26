// ============================================================
// NEONRIFT — Main JS
// Particles, Game Router, Score Management
// ============================================================

// ---- PARTICLE SYSTEM ----
(function initParticles() {
  const canvas = document.getElementById('particle-canvas');
  const ctx = canvas.getContext('2d');
  let W, H, particles = [];

  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resize);
  resize();

  function Particle() {
    this.reset();
  }
  Particle.prototype.reset = function() {
    this.x = Math.random() * W;
    this.y = Math.random() * H;
    this.vx = (Math.random() - 0.5) * 0.4;
    this.vy = (Math.random() - 0.5) * 0.4;
    this.size = Math.random() * 1.5 + 0.5;
    this.opacity = Math.random() * 0.4 + 0.1;
    const colors = ['#00cfff', '#ff0080', '#00ff88', '#a855f7'];
    this.color = colors[Math.floor(Math.random() * colors.length)];
    this.life = 0;
    this.maxLife = Math.random() * 300 + 200;
  };
  Particle.prototype.update = function() {
    this.x += this.vx;
    this.y += this.vy;
    this.life++;
    if (this.life > this.maxLife || this.x < 0 || this.x > W || this.y < 0 || this.y > H) {
      this.reset();
    }
  };
  Particle.prototype.draw = function() {
    const alpha = this.opacity * Math.sin((this.life / this.maxLife) * Math.PI);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  for (let i = 0; i < 80; i++) particles.push(new Particle());

  function loop() {
    ctx.clearRect(0, 0, W, H);
    particles.forEach(p => { p.update(); p.draw(); });
    requestAnimationFrame(loop);
  }
  loop();
})();

// ---- SCORE MANAGEMENT ----
const Scores = {
  get(game) {
    try { return JSON.parse(localStorage.getItem(`neonrift_scores_${game}`)) || []; } catch { return []; }
  },
  add(game, score) {
    let scores = this.get(game);
    scores.push({ score, date: new Date().toLocaleDateString() });
    scores.sort((a, b) => b.score - a.score);
    scores = scores.slice(0, 5);
    localStorage.setItem(`neonrift_scores_${game}`, JSON.stringify(scores));
    this.updateUI(game);
    this.updateCard(game);
  },
  best(game) {
    const scores = this.get(game);
    return scores.length ? scores[0].score : 0;
  },
  updateUI(game) {
    const list = document.getElementById(`lb-${game}-list`);
    if (!list) return;
    const scores = this.get(game);
    if (!scores.length) { list.innerHTML = '<div class="lb-empty">No scores yet. Be the first.</div>'; return; }
    const medals = ['🥇','🥈','🥉','4.','5.'];
    list.innerHTML = scores.map((s, i) => `
      <div class="lb-entry">
        <span class="lb-rank">${medals[i]}</span>
        <span class="lb-name">PLAYER</span>
        <span class="lb-val">${s.score}</span>
      </div>
    `).join('');
  },
  updateCard(game) {
    const el = document.getElementById(`${game}-score`);
    if (el) el.textContent = `HI: ${this.best(game)}`;
  },
  initAll() {
    ['snake','runner','flappy','2048','breakout'].forEach(g => {
      this.updateUI(g);
      this.updateCard(g);
    });
  }
};
Scores.initAll();

// ---- GAME ROUTER ----
let currentGame = null;

const gameConfig = {
  snake:    { title: 'NEON SNAKE',    init: initSnake,    restart: restartSnake },
  runner:   { title: 'GRID RUNNER',   init: initRunner,   restart: restartRunner },
  flappy:   { title: 'CYBER FLAP',    init: initFlappy,   restart: restartFlappy },
  '2048':   { title: 'FUSION 2048',   init: init2048,     restart: restart2048 },
  breakout: { title: 'LASER BREAK',   init: initBreakout, restart: restartBreakout },
};

function openGame(name) {
  currentGame = name;
  const cfg = gameConfig[name];
  const overlay = document.getElementById('game-overlay');
  const title = document.getElementById('modal-title');
  const body = document.getElementById('modal-body');
  const modalBest = document.getElementById('modal-best');

  title.textContent = cfg.title;
  body.innerHTML = '';
  document.getElementById('modal-score').textContent = '0';
  modalBest.textContent = Scores.best(name);

  overlay.classList.add('active');
  document.body.style.overflow = 'hidden';

  cfg.init(body);
}

function closeGame() {
  const overlay = document.getElementById('game-overlay');
  overlay.classList.remove('active');
  document.body.style.overflow = '';
  if (currentGame) {
    stopCurrentGame();
    currentGame = null;
  }
}

function restartGame() {
  if (currentGame) {
    const body = document.getElementById('modal-body');
    body.innerHTML = '';
    document.getElementById('modal-score').textContent = '0';
    gameConfig[currentGame].restart(body);
  }
}

function stopCurrentGame() {
  // Each game sets window._gameStop = fn
  if (typeof window._gameStop === 'function') {
    window._gameStop();
    window._gameStop = null;
  }
}

function updateModalScore(score) {
  document.getElementById('modal-score').textContent = score;
}

function gameOver(game, score) {
  Scores.add(game, score);
  document.getElementById('modal-best').textContent = Scores.best(game);
}

// Keyboard close
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeGame();
});

// Prevent modal close on click inside
document.getElementById('game-overlay').addEventListener('click', function(e) {
  if (e.target === this) closeGame();
});
