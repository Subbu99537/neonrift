// ============================================================
// CYBER FLAP — Cyberpunk Flappy Bird
// ============================================================
function initFlappy(container) {
  const W = 400, H = 500;
  const PIPE_W = 52, GAP = 140;

  container.innerHTML = `
    <div style="position:relative;width:${W}px;max-width:100%;">
      <canvas id="flappy-canvas" width="${W}" height="${H}" style="display:block;max-width:100%;border:1px solid rgba(0,207,255,0.2);"></canvas>
      <div class="game-start-screen" id="flappy-start">
        <h2>🐦 CYBER FLAP</h2>
        <p>Tap, click, or press <strong style="color:#00cfff">SPACE</strong> to fly.<br>
        Dodge the neon towers.<br>
        Every gap counts.</p>
        <button class="start-btn" onclick="startFlappyGame()">▶ FLY</button>
      </div>
      <div class="game-over-screen" id="flappy-over" style="display:none;">
        <h2>CRASHED</h2>
        <div class="final-score" id="flappy-final">SCORE: 0</div>
        <div class="over-btns">
          <button class="start-btn" onclick="startFlappyGame()">▶ TRY AGAIN</button>
        </div>
      </div>
    </div>`;

  window.startFlappyGame = startFlappyGame;
  window.restartFlappy = function(c) { initFlappy(c); };

  function startFlappyGame() {
    document.getElementById('flappy-start').style.display = 'none';
    document.getElementById('flappy-over').style.display = 'none';
    runFlappy();
  }

  function runFlappy() {
    const canvas = document.getElementById('flappy-canvas');
    const ctx = canvas.getContext('2d');

    let bird = { x: 80, y: H / 2, vy: 0, r: 14, angle: 0 };
    let pipes = [];
    let particles = [];
    let score = 0;
    let gameRunning = true;
    let frameCount = 0;
    let bgStars = Array.from({ length: 60 }, () => ({
      x: Math.random() * W, y: Math.random() * H * 0.7,
      r: Math.random() * 1.5 + 0.3, twinkle: Math.random() * Math.PI * 2
    }));

    const GRAVITY = 0.45;
    const FLAP_FORCE = -9;
    let pipeSpeed = 2.5;

    function flap() {
      bird.vy = FLAP_FORCE;
      for (let i = 0; i < 6; i++) {
        particles.push({
          x: bird.x, y: bird.y,
          vx: (Math.random() - 0.5) * 3 - 1,
          vy: (Math.random() - 0.5) * 3,
          life: 18, color: '#00cfff'
        });
      }
    }

    function handleKey(e) {
      if ((e.code === 'Space' || e.code === 'ArrowUp') && gameRunning) { e.preventDefault(); flap(); }
    }
    document.addEventListener('keydown', handleKey);
    canvas.addEventListener('click', () => { if (gameRunning) flap(); });
    canvas.addEventListener('touchstart', e => { e.preventDefault(); if (gameRunning) flap(); }, { passive: false });

    function spawnPipe() {
      const topH = Math.floor(Math.random() * (H - GAP - 80)) + 40;
      pipes.push({ x: W + 10, topH, passed: false });
    }
    spawnPipe();
    let pipeTimer = 0;

    function drawBird() {
      ctx.save();
      ctx.translate(bird.x, bird.y);
      bird.angle = Math.min(Math.PI / 4, Math.max(-Math.PI / 4, bird.vy * 0.07));
      ctx.rotate(bird.angle);

      // Glow
      ctx.shadowColor = '#00cfff';
      ctx.shadowBlur = 20;

      // Body
      ctx.fillStyle = '#00cfff';
      ctx.beginPath();
      ctx.ellipse(0, 0, 14, 10, 0, 0, Math.PI * 2);
      ctx.fill();

      // Wing
      ctx.fillStyle = '#007faa';
      ctx.beginPath();
      ctx.ellipse(-4, 2, 10, 6, 0.3, 0, Math.PI * 2);
      ctx.fill();

      // Eye
      ctx.fillStyle = '#000';
      ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.arc(7, -3, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(8, -4, 1.2, 0, Math.PI * 2);
      ctx.fill();

      // Beak
      ctx.fillStyle = '#ff8c00';
      ctx.beginPath();
      ctx.moveTo(13, 0);
      ctx.lineTo(20, -2);
      ctx.lineTo(20, 3);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    }

    function drawPipe(pipe) {
      const grad = ctx.createLinearGradient(pipe.x, 0, pipe.x + PIPE_W, 0);
      grad.addColorStop(0, '#0a2a3a');
      grad.addColorStop(0.5, '#00cfff');
      grad.addColorStop(1, '#0a2a3a');

      // Top pipe
      ctx.save();
      ctx.fillStyle = '#0a1e2e';
      ctx.shadowColor = '#00cfff';
      ctx.shadowBlur = 12;
      ctx.fillRect(pipe.x, 0, PIPE_W, pipe.topH);
      // Cap
      ctx.fillStyle = grad;
      ctx.fillRect(pipe.x - 4, pipe.topH - 14, PIPE_W + 8, 14);
      // Edge lines
      ctx.fillStyle = 'rgba(0,207,255,0.2)';
      ctx.fillRect(pipe.x + 4, 0, 3, pipe.topH - 14);
      ctx.fillRect(pipe.x + PIPE_W - 7, 0, 3, pipe.topH - 14);

      // Bottom pipe
      const botY = pipe.topH + GAP;
      ctx.fillStyle = '#0a1e2e';
      ctx.fillRect(pipe.x, botY, PIPE_W, H - botY);
      // Cap
      ctx.fillStyle = grad;
      ctx.fillRect(pipe.x - 4, botY, PIPE_W + 8, 14);
      ctx.fillStyle = 'rgba(0,207,255,0.2)';
      ctx.fillRect(pipe.x + 4, botY + 14, 3, H - botY - 14);
      ctx.fillRect(pipe.x + PIPE_W - 7, botY + 14, 3, H - botY - 14);
      ctx.restore();
    }

    function loop() {
      if (!gameRunning) return;
      requestAnimationFrame(loop);
      frameCount++;

      // Sky
      const sky = ctx.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0, '#020408');
      sky.addColorStop(0.6, '#060d1a');
      sky.addColorStop(1, '#0a1525');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, W, H);

      // Stars
      bgStars.forEach(s => {
        s.twinkle += 0.04;
        const a = 0.3 + Math.sin(s.twinkle) * 0.3;
        ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = '#fff'; ctx.shadowColor = '#fff'; ctx.shadowBlur = 4;
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      });

      // City skyline
      [[W, '#040c18', 0.3], [W * 1.5, '#06101f', 0.6]].forEach(([span, col, spd], li) => {
        ctx.fillStyle = col;
        for (let bx = (frameCount * spd * 0.5) % (W / 5) - W / 5; bx < W; bx += W / 5 + li * 20) {
          const bh = 40 + Math.sin(bx * 0.3 + li) * 30;
          ctx.fillRect(bx, H - 80 - bh, 30 + li * 10, bh);
          if (Math.sin(bx + frameCount * 0.02) > 0.5) {
            ctx.fillStyle = 'rgba(255,0,128,0.3)';
            ctx.fillRect(bx + 5, H - 80 - bh + 6, 4, 5);
            ctx.fillStyle = col;
          }
        }
      });

      // Ground
      ctx.fillStyle = '#060d1a';
      ctx.fillRect(0, H - 50, W, 50);
      ctx.strokeStyle = '#ff0080';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#ff0080';
      ctx.shadowBlur = 8;
      ctx.beginPath(); ctx.moveTo(0, H - 50); ctx.lineTo(W, H - 50); ctx.stroke();
      ctx.shadowBlur = 0;

      // Physics
      bird.vy += GRAVITY;
      bird.y += bird.vy;

      // Pipes
      pipeTimer++;
      if (pipeTimer >= 100) { spawnPipe(); pipeTimer = 0; }
      pipes.forEach((p, i) => {
        p.x -= pipeSpeed;
        drawPipe(p);
        if (!p.passed && p.x + PIPE_W < bird.x) {
          p.passed = true;
          score++;
          updateModalScore(score);
          pipeSpeed = Math.min(5, 2.5 + score * 0.08);
          for (let k = 0; k < 10; k++) {
            particles.push({ x: bird.x, y: bird.y, vx: (Math.random()-0.5)*5, vy: (Math.random()-0.5)*5, life: 25, color: '#00ff88' });
          }
        }
        if (p.x + PIPE_W < 0) pipes.splice(i, 1);
        // Collision
        if (bird.x + bird.r > p.x && bird.x - bird.r < p.x + PIPE_W) {
          if (bird.y - bird.r < p.topH || bird.y + bird.r > p.topH + GAP) {
            endFlappy(score);
          }
        }
      });

      // Ground/ceiling collision
      if (bird.y + bird.r > H - 50 || bird.y - bird.r < 0) endFlappy(score);

      // Particles
      particles.forEach((p, i) => {
        p.x += p.vx; p.y += p.vy; p.life--;
        ctx.save();
        ctx.globalAlpha = p.life / 25;
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 6;
        ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
        if (p.life <= 0) particles.splice(i, 1);
      });

      drawBird();

      // Score display
      ctx.font = `bold 28px 'Orbitron', monospace`;
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(255,255,255,0.8)';
      ctx.shadowColor = '#00cfff';
      ctx.shadowBlur = 10;
      ctx.fillText(score, W / 2, 52);
      ctx.shadowBlur = 0;
      ctx.textAlign = 'left';
    }

    requestAnimationFrame(loop);
    window._gameStop = () => { gameRunning = false; document.removeEventListener('keydown', handleKey); };
  }

  function endFlappy(score) {
    window._gameStop && window._gameStop();
    gameOver('flappy', score);
    document.getElementById('flappy-final').textContent = `SCORE: ${score}`;
    document.getElementById('flappy-over').style.display = 'flex';
  }
}

function restartFlappy(container) { initFlappy(container); }
