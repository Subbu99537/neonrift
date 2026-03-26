// ============================================================
// LASER BREAK — Neon Breakout
// ============================================================
function initBreakout(container) {
  const W = 480, H = 480;

  container.innerHTML = `
    <div style="position:relative;width:${W}px;max-width:100%;">
      <canvas id="breakout-canvas" width="${W}" height="${H}" style="display:block;max-width:100%;border:1px solid rgba(168,85,247,0.3);"></canvas>
      <div class="game-start-screen" id="breakout-start">
        <h2>💥 LASER BREAK</h2>
        <p>Move your paddle with the <strong style="color:#a855f7">Mouse</strong> or <strong style="color:#a855f7">Arrow Keys</strong>.<br>
        On mobile, touch and drag to aim.<br>
        Break all neon bricks. Don't miss the ball.</p>
        <button class="start-btn" style="border-color:#a855f7;color:#a855f7;" onclick="startBreakoutGame()">▶ FIRE</button>
      </div>
      <div class="game-over-screen" id="breakout-over" style="display:none;">
        <h2 id="breakout-over-title">GAME OVER</h2>
        <div class="final-score" id="breakout-final">SCORE: 0</div>
        <div class="over-btns">
          <button class="start-btn" style="border-color:#a855f7;color:#a855f7;" onclick="startBreakoutGame()">▶ RETRY</button>
        </div>
      </div>
    </div>`;

  window.startBreakoutGame = startBreakoutGame;
  window.restartBreakout = function(c) { initBreakout(c); };

  function startBreakoutGame() {
    document.getElementById('breakout-start').style.display = 'none';
    document.getElementById('breakout-over').style.display = 'none';
    runBreakout();
  }

  function runBreakout() {
    const canvas = document.getElementById('breakout-canvas');
    const ctx = canvas.getContext('2d');

    const PAD_W = 90, PAD_H = 12, PAD_Y = H - 40;
    const BALL_R = 8;
    const BRICK_COLS = 8, BRICK_ROWS = 6;
    const BRICK_W = (W - 40) / BRICK_COLS - 6;
    const BRICK_H = 20;

    let paddle = { x: W / 2 - PAD_W / 2, y: PAD_Y };
    let ball = { x: W / 2, y: PAD_Y - BALL_R - 5, vx: 3.5, vy: -4 };
    let particles = [];
    let lives = 3;
    let score = 0;
    let level = 1;
    let gameRunning = true;

    const BRICK_COLORS = [
      ['#ff0080','#ff4da6'], ['#ff0080','#ff4da6'],
      ['#00cfff','#40dfff'], ['#00cfff','#40dfff'],
      ['#a855f7','#c880ff'], ['#a855f7','#c880ff'],
    ];

    function buildBricks() {
      let bricks = [];
      for (let r = 0; r < BRICK_ROWS; r++) {
        for (let c = 0; c < BRICK_COLS; c++) {
          bricks.push({
            x: 20 + c * (BRICK_W + 6),
            y: 40 + r * (BRICK_H + 6),
            alive: true,
            hp: r < 2 ? 1 : r < 4 ? 1 : 2,
            color: BRICK_COLORS[r][0],
            glow: BRICK_COLORS[r][1],
            points: (BRICK_ROWS - r) * 10
          });
        }
      }
      return bricks;
    }

    let bricks = buildBricks();

    // Input
    const keys = {};
    document.addEventListener('keydown', e => { keys[e.key] = true; if(['ArrowLeft','ArrowRight'].includes(e.key)) e.preventDefault(); });
    document.addEventListener('keyup', e => { keys[e.key] = false; });

    canvas.addEventListener('mousemove', e => {
      const rect = canvas.getBoundingClientRect();
      const scale = W / rect.width;
      paddle.x = (e.clientX - rect.left) * scale - PAD_W / 2;
      paddle.x = Math.max(0, Math.min(W - PAD_W, paddle.x));
    });
    canvas.addEventListener('touchmove', e => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const scale = W / rect.width;
      paddle.x = (e.touches[0].clientX - rect.left) * scale - PAD_W / 2;
      paddle.x = Math.max(0, Math.min(W - PAD_W, paddle.x));
    }, { passive: false });

    function emitBrickParticles(bx, by, bw, bh, color) {
      for (let i = 0; i < 10; i++) {
        particles.push({
          x: bx + bw / 2 + (Math.random() - 0.5) * bw,
          y: by + bh / 2 + (Math.random() - 0.5) * bh,
          vx: (Math.random() - 0.5) * 6,
          vy: (Math.random() - 0.5) * 6,
          life: 28,
          color
        });
      }
    }

    function loop() {
      if (!gameRunning) return;
      requestAnimationFrame(loop);

      // Background
      ctx.fillStyle = '#020408';
      ctx.fillRect(0, 0, W, H);

      // Grid
      ctx.strokeStyle = 'rgba(168,85,247,0.04)';
      ctx.lineWidth = 1;
      for (let x = 0; x < W; x += 30) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
      for (let y = 0; y < H; y += 30) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

      // Paddle keyboard
      if (keys['ArrowLeft'] || keys['a']) paddle.x = Math.max(0, paddle.x - 7);
      if (keys['ArrowRight'] || keys['d']) paddle.x = Math.min(W - PAD_W, paddle.x + 7);

      // Ball movement
      ball.x += ball.vx;
      ball.y += ball.vy;

      // Wall bounce
      if (ball.x - BALL_R < 0) { ball.x = BALL_R; ball.vx = Math.abs(ball.vx); }
      if (ball.x + BALL_R > W) { ball.x = W - BALL_R; ball.vx = -Math.abs(ball.vx); }
      if (ball.y - BALL_R < 0) { ball.y = BALL_R; ball.vy = Math.abs(ball.vy); }

      // Paddle collision
      if (
        ball.y + BALL_R >= paddle.y &&
        ball.y + BALL_R <= paddle.y + PAD_H + 4 &&
        ball.x > paddle.x && ball.x < paddle.x + PAD_W &&
        ball.vy > 0
      ) {
        const hit = (ball.x - (paddle.x + PAD_W / 2)) / (PAD_W / 2);
        ball.vx = hit * 6;
        ball.vy = -Math.abs(ball.vy);
        const spd = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
        const maxSpd = 8;
        if (spd > maxSpd) { ball.vx = ball.vx / spd * maxSpd; ball.vy = ball.vy / spd * maxSpd; }
        for (let i = 0; i < 6; i++) particles.push({ x: ball.x, y: ball.y, vx: (Math.random()-0.5)*4, vy: -Math.random()*3, life: 20, color: '#a855f7' });
      }

      // Ball lost
      if (ball.y + BALL_R > H) {
        lives--;
        if (lives <= 0) {
          endBreakout(score, false);
          return;
        }
        ball.x = W / 2; ball.y = PAD_Y - BALL_R - 5;
        ball.vx = (Math.random() > 0.5 ? 1 : -1) * 3.5;
        ball.vy = -4;
      }

      // Brick collision
      bricks.forEach(b => {
        if (!b.alive) return;
        if (ball.x + BALL_R > b.x && ball.x - BALL_R < b.x + BRICK_W &&
            ball.y + BALL_R > b.y && ball.y - BALL_R < b.y + BRICK_H) {
          b.hp--;
          if (b.hp <= 0) {
            b.alive = false;
            score += b.points;
            updateModalScore(score);
            emitBrickParticles(b.x, b.y, BRICK_W, BRICK_H, b.glow);
          }
          // Reflect
          const overlapL = ball.x + BALL_R - b.x;
          const overlapR = b.x + BRICK_W - (ball.x - BALL_R);
          const overlapT = ball.y + BALL_R - b.y;
          const overlapB = b.y + BRICK_H - (ball.y - BALL_R);
          const minOv = Math.min(overlapL, overlapR, overlapT, overlapB);
          if (minOv === overlapT || minOv === overlapB) ball.vy = -ball.vy;
          else ball.vx = -ball.vx;
        }
      });

      // Check win
      if (bricks.every(b => !b.alive)) {
        level++;
        bricks = buildBricks();
        ball.vx *= 1.1; ball.vy *= 1.1;
      }

      // Draw bricks
      bricks.forEach(b => {
        if (!b.alive) return;
        ctx.save();
        ctx.fillStyle = b.hp >= 2 ? b.color : b.color + '99';
        ctx.shadowColor = b.glow;
        ctx.shadowBlur = b.hp >= 2 ? 10 : 5;
        ctx.fillRect(b.x, b.y, BRICK_W, BRICK_H);
        // Top shine
        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        ctx.shadowBlur = 0;
        ctx.fillRect(b.x + 2, b.y + 2, BRICK_W - 4, 4);
        ctx.restore();
      });

      // Draw paddle
      ctx.save();
      const padGrad = ctx.createLinearGradient(paddle.x, paddle.y, paddle.x + PAD_W, paddle.y);
      padGrad.addColorStop(0, '#4010a0');
      padGrad.addColorStop(0.5, '#a855f7');
      padGrad.addColorStop(1, '#4010a0');
      ctx.fillStyle = padGrad;
      ctx.shadowColor = '#a855f7';
      ctx.shadowBlur = 20;
      ctx.fillRect(paddle.x, paddle.y, PAD_W, PAD_H);
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.shadowBlur = 0;
      ctx.fillRect(paddle.x + 4, paddle.y + 2, PAD_W - 8, 3);
      ctx.restore();

      // Draw ball
      ctx.save();
      ctx.fillStyle = '#fff';
      ctx.shadowColor = '#a855f7';
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, BALL_R, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#d0a0ff';
      ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.arc(ball.x - 2, ball.y - 2, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Particles
      particles.forEach((p, i) => {
        p.x += p.vx; p.y += p.vy; p.vy += 0.15; p.life--;
        ctx.save();
        ctx.globalAlpha = p.life / 28;
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 6;
        ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
        if (p.life <= 0) particles.splice(i, 1);
      });

      // HUD
      ctx.font = `bold 12px 'Share Tech Mono'`;
      ctx.fillStyle = 'rgba(168,85,247,0.6)';
      ctx.fillText(`LVL ${level}`, 8, 18);
      ctx.fillText(`♥ ${lives}`, W / 2 - 20, 18);
      ctx.fillStyle = 'rgba(255,255,255,0.2)';
      ctx.fillText(`BRICKS: ${bricks.filter(b => b.alive).length}`, W - 100, 18);
    }

    requestAnimationFrame(loop);
    window._gameStop = () => { gameRunning = false; document.removeEventListener('keydown', e => {}); };
  }

  function endBreakout(score, won) {
    window._gameStop && window._gameStop();
    gameOver('breakout', score);
    document.getElementById('breakout-over-title').textContent = won ? '🎉 YOU WIN!' : 'GAME OVER';
    document.getElementById('breakout-final').textContent = `SCORE: ${score}`;
    document.getElementById('breakout-over').style.display = 'flex';
  }
}

function restartBreakout(container) { initBreakout(container); }
