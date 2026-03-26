// ============================================================
// GRID RUNNER — Endless Runner with Story
// ============================================================
function initRunner(container) {
  const W = 600, H = 300;

  const storyLines = [
    { text: "YEAR 2087. THE GRID.", color: '#00cfff' },
    { text: "You are KAI — a rogue data courier.", color: '#ffffff' },
    { text: "The Corporation wants you dead.", color: '#ff0080' },
    { text: "Your only option?", color: '#ffffff' },
    { text: "RUN.", color: '#00ff88' },
  ];

  container.innerHTML = `
    <div style="position:relative;width:${W}px;max-width:100%;">
      <canvas id="runner-canvas" width="${W}" height="${H}" style="display:block;max-width:100%;border:1px solid rgba(255,0,128,0.3);"></canvas>
      <div class="game-start-screen" id="runner-story" style="background:rgba(2,4,8,0.97);">
        <div id="story-text" style="min-height:160px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;"></div>
        <button class="start-btn" id="story-btn" style="opacity:0;border-color:#ff0080;color:#ff0080;" onclick="startRunnerGame()">▶ START RUNNING</button>
      </div>
      <div class="game-over-screen" id="runner-over" style="display:none;">
        <h2>YOU FELL</h2>
        <div class="final-score" id="runner-final">SCORE: 0</div>
        <div style="font-family:var(--font-mono);font-size:0.75rem;color:var(--text-dim);margin-bottom:20px;">The Corporation wins... for now.</div>
        <div class="over-btns">
          <button class="start-btn" style="border-color:#ff0080;color:#ff0080;" onclick="startRunnerGame()">▶ RUN AGAIN</button>
        </div>
      </div>
    </div>`;

  // Play story
  let storyIdx = 0;
  const storyEl = document.getElementById('story-text');
  const storyBtn = document.getElementById('story-btn');

  function showNextLine() {
    if (storyIdx < storyLines.length) {
      const line = storyLines[storyIdx];
      const p = document.createElement('p');
      p.style.cssText = `font-family:'Orbitron',monospace;font-size:clamp(0.85rem,2.5vw,1.1rem);font-weight:700;letter-spacing:0.15em;color:${line.color};opacity:0;transition:opacity 0.6s;`;
      storyEl.appendChild(p);
      requestAnimationFrame(() => { p.style.opacity = '1'; p.textContent = line.text; });
      storyIdx++;
      if (storyIdx < storyLines.length) setTimeout(showNextLine, 800);
      else setTimeout(() => {
        storyBtn.style.opacity = '1';
        storyBtn.style.transition = 'opacity 0.6s';
      }, 800);
    }
  }
  setTimeout(showNextLine, 400);

  window.startRunnerGame = startRunnerGame;
  window.restartRunner = function(c) { initRunner(c); };

  function startRunnerGame() {
    document.getElementById('runner-story').style.display = 'none';
    document.getElementById('runner-over').style.display = 'none';
    runRunner();
  }

  function runRunner() {
    const canvas = document.getElementById('runner-canvas');
    const ctx = canvas.getContext('2d');

    const GROUND = H - 60;
    let player = { x: 80, y: GROUND, w: 28, h: 40, vy: 0, jumping: false, frame: 0, frameTimer: 0, running: true };
    let obstacles = [];
    let particles = [];
    let bgLayers = initBgLayers();
    let score = 0;
    let speed = 4;
    let frameCount = 0;
    let gameRunning = true;
    let nextObstacle = 80;
    let groundX = 0;

    const GRAVITY = 0.55;
    const JUMP_FORCE = -13;

    function initBgLayers() {
      return [
        { objs: Array.from({ length: 6 }, (_, i) => ({ x: i * 180, h: Math.random() * 100 + 80, w: 30 + Math.random() * 40 })), speed: 0.5, color: '#0a1525' },
        { objs: Array.from({ length: 5 }, (_, i) => ({ x: i * 200 + 50, h: Math.random() * 60 + 60, w: 20 + Math.random() * 30 })), speed: 1.2, color: '#0f1e35' },
        { objs: Array.from({ length: 4 }, (_, i) => ({ x: i * 250 + 80, h: Math.random() * 40 + 40, w: 15 + Math.random() * 25 })), speed: 2, color: '#162840' },
      ];
    }

    function jump() {
      if (!player.jumping) {
        player.vy = JUMP_FORCE;
        player.jumping = true;
        // Particle burst
        for (let i = 0; i < 8; i++) {
          particles.push({ x: player.x + player.w / 2, y: player.y + player.h, vx: (Math.random() - 0.5) * 4, vy: -Math.random() * 3, life: 20, color: '#ff0080' });
        }
      }
    }

    function handleKey(e) {
      if ((e.code === 'Space' || e.code === 'ArrowUp' || e.key === 'w') && gameRunning) {
        e.preventDefault();
        jump();
      }
    }
    document.addEventListener('keydown', handleKey);
    document.getElementById('runner-canvas').addEventListener('click', () => { if (gameRunning) jump(); });
    document.getElementById('runner-canvas').addEventListener('touchstart', e => { e.preventDefault(); if (gameRunning) jump(); }, { passive: false });

    function spawnObstacle() {
      const types = [
        { w: 18, h: 40, color: '#ff0080', type: 'wall' },
        { w: 30, h: 25, color: '#00cfff', type: 'barrier' },
        { w: 12, h: 60, color: '#a855f7', type: 'spike' },
      ];
      const t = types[Math.floor(Math.random() * types.length)];
      obstacles.push({ x: W + 20, y: GROUND + player.h - t.h, w: t.w, h: t.h, color: t.color, type: t.type });
    }

    function drawBuildings(layer) {
      ctx.fillStyle = layer.color;
      layer.objs.forEach(b => {
        ctx.fillRect(b.x, GROUND - b.h + player.h, b.w, b.h);
        // Windows
        ctx.fillStyle = 'rgba(0,207,255,0.15)';
        for (let wy = GROUND - b.h + player.h + 8; wy < GROUND + player.h - 8; wy += 14) {
          for (let wx = b.x + 4; wx < b.x + b.w - 4; wx += 10) {
            if (Math.random() > 0.3) ctx.fillRect(wx, wy, 5, 7);
          }
        }
        ctx.fillStyle = layer.color;
      });
    }

    function updateBgLayers() {
      bgLayers.forEach(layer => {
        layer.objs.forEach(b => {
          b.x -= speed * layer.speed;
          if (b.x + b.w < 0) b.x = W + Math.random() * 200;
        });
      });
    }

    function drawPlayer() {
      const px = player.x, py = player.y;
      // Body glow
      ctx.save();
      ctx.shadowColor = '#ff0080';
      ctx.shadowBlur = 20;
      // Legs animation
      const legOff = player.jumping ? 0 : Math.sin(frameCount * 0.3) * 6;
      // Body
      ctx.fillStyle = '#ff0080';
      ctx.fillRect(px + 6, py + 10, 16, 22);
      // Head
      ctx.fillStyle = '#ff6ab0';
      ctx.fillRect(px + 7, py, 14, 13);
      // Visor
      ctx.fillStyle = '#00cfff';
      ctx.shadowColor = '#00cfff';
      ctx.fillRect(px + 9, py + 3, 10, 5);
      // Legs
      ctx.fillStyle = '#c0006a';
      ctx.shadowColor = 'transparent';
      ctx.fillRect(px + 6, py + 32, 6, 8 + legOff);
      ctx.fillRect(px + 16, py + 32, 6, 8 - legOff);
      // Arms
      ctx.fillStyle = '#ff0080';
      ctx.fillRect(px, py + 12, 6, 14 - legOff / 2);
      ctx.fillRect(px + 22, py + 12, 6, 14 + legOff / 2);
      ctx.restore();
    }

    function loop() {
      if (!gameRunning) return;
      requestAnimationFrame(loop);
      frameCount++;
      ctx.fillStyle = '#020408';
      ctx.fillRect(0, 0, W, H);

      // Sky gradient
      const sky = ctx.createLinearGradient(0, 0, 0, GROUND + player.h);
      sky.addColorStop(0, '#020408');
      sky.addColorStop(1, '#080d18');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, W, H);

      // Moon
      ctx.save();
      ctx.fillStyle = 'rgba(0,207,255,0.15)';
      ctx.shadowColor = '#00cfff';
      ctx.shadowBlur = 30;
      ctx.beginPath();
      ctx.arc(W - 80, 50, 25, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Buildings
      updateBgLayers();
      bgLayers.forEach(drawBuildings);

      // Ground
      groundX = (groundX - speed) % 40;
      ctx.fillStyle = '#0a1525';
      ctx.fillRect(0, GROUND + player.h, W, H - GROUND - player.h);
      ctx.strokeStyle = 'rgba(0,207,255,0.3)';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(0, GROUND + player.h); ctx.lineTo(W, GROUND + player.h); ctx.stroke();
      // Ground dashes
      ctx.strokeStyle = 'rgba(0,207,255,0.15)';
      ctx.lineWidth = 1;
      for (let x = groundX; x < W; x += 40) {
        ctx.beginPath(); ctx.moveTo(x, GROUND + player.h + 10); ctx.lineTo(x + 20, GROUND + player.h + 10); ctx.stroke();
      }

      // Physics
      player.vy += GRAVITY;
      player.y += player.vy;
      if (player.y >= GROUND) { player.y = GROUND; player.vy = 0; player.jumping = false; }

      // Obstacles
      nextObstacle--;
      if (nextObstacle <= 0) {
        spawnObstacle();
        nextObstacle = Math.floor(Math.random() * 60 + 50);
      }
      obstacles.forEach((ob, i) => {
        ob.x -= speed;
        // Draw
        ctx.save();
        ctx.fillStyle = ob.color;
        ctx.shadowColor = ob.color;
        ctx.shadowBlur = 15;
        ctx.fillRect(ob.x, ob.y, ob.w, ob.h);
        // Top glow strip
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.fillRect(ob.x, ob.y, ob.w, 3);
        ctx.restore();
        // Collision
        if (
          player.x + 6 < ob.x + ob.w &&
          player.x + player.w - 6 > ob.x &&
          player.y + 4 < ob.y + ob.h &&
          player.y + player.h > ob.y
        ) {
          gameRunning = false;
          document.removeEventListener('keydown', handleKey);
          gameOver('runner', Math.floor(score));
          document.getElementById('runner-final').textContent = `SCORE: ${Math.floor(score)}`;
          document.getElementById('runner-over').style.display = 'flex';
        }
        if (ob.x + ob.w < 0) obstacles.splice(i, 1);
      });

      // Particles
      particles.forEach((p, i) => {
        p.x += p.vx; p.y += p.vy; p.vy += 0.2; p.life--;
        ctx.save();
        ctx.globalAlpha = p.life / 20;
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
        ctx.fillRect(p.x - 2, p.y - 2, 4, 4);
        ctx.restore();
        if (p.life <= 0) particles.splice(i, 1);
      });

      drawPlayer();

      // Score
      score += 0.05 * (speed / 4);
      speed = Math.min(10, 4 + score / 500);
      updateModalScore(Math.floor(score));

      ctx.font = `bold 12px 'Share Tech Mono'`;
      ctx.fillStyle = 'rgba(255,0,128,0.6)';
      ctx.fillText(`SPEED: ${speed.toFixed(1)}x`, 8, 18);

      // Distance markers
      ctx.fillStyle = 'rgba(0,207,255,0.3)';
      ctx.fillText(`KM: ${(score * 0.1).toFixed(1)}`, W - 90, 18);
    }

    requestAnimationFrame(loop);
    window._gameStop = () => { gameRunning = false; document.removeEventListener('keydown', handleKey); };
  }
}

function restartRunner(container) { initRunner(container); }
