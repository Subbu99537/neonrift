// ============================================================
// NEON SNAKE
// ============================================================
function initSnake(container) {
  const CELL = 20, COLS = 25, ROWS = 25;
  const W = COLS * CELL, H = ROWS * CELL;

  container.innerHTML = `
    <div style="position:relative;width:${W}px;max-width:100%;">
      <canvas id="snake-canvas" width="${W}" height="${H}" style="display:block;max-width:100%;border:1px solid rgba(0,207,255,0.2);"></canvas>
      <div class="game-start-screen" id="snake-start">
        <h2>🐍 NEON SNAKE</h2>
        <p>Use <strong style="color:#00cfff">Arrow Keys</strong> or <strong style="color:#00cfff">WASD</strong> to move.<br>
        Eat the glowing orbs. Don't hit yourself or the walls.<br>
        Speed increases as you grow.</p>
        <button class="start-btn" onclick="startSnakeGame()">▶ START GAME</button>
      </div>
      <div class="game-over-screen" id="snake-over" style="display:none;">
        <h2>GAME OVER</h2>
        <div class="final-score" id="snake-final-score">SCORE: 0</div>
        <div class="over-btns">
          <button class="start-btn" onclick="startSnakeGame()">▶ PLAY AGAIN</button>
        </div>
      </div>
    </div>`;

  window.startSnakeGame = startSnakeGame;
  window.restartSnake = function(c) { initSnake(c); };

  function startSnakeGame() {
    document.getElementById('snake-start').style.display = 'none';
    document.getElementById('snake-over').style.display = 'none';
    runSnake();
  }

  function runSnake() {
    const canvas = document.getElementById('snake-canvas');
    const ctx = canvas.getContext('2d');
    let snake = [{ x: 12, y: 12 }];
    let dir = { x: 1, y: 0 };
    let nextDir = { x: 1, y: 0 };
    let food = spawnFood();
    let score = 0;
    let gameRunning = true;
    let speed = 150;
    let lastTime = 0;
    let trail = [];

    function spawnFood() {
      let pos;
      do {
        pos = { x: Math.floor(Math.random() * COLS), y: Math.floor(Math.random() * ROWS) };
      } while (snake.some(s => s.x === pos.x && s.y === pos.y));
      return pos;
    }

    function handleKey(e) {
      const map = {
        ArrowUp: { x: 0, y: -1 }, ArrowDown: { x: 0, y: 1 },
        ArrowLeft: { x: -1, y: 0 }, ArrowRight: { x: 1, y: 0 },
        w: { x: 0, y: -1 }, s: { x: 0, y: 1 },
        a: { x: -1, y: 0 }, d: { x: 1, y: 0 }
      };
      const d = map[e.key];
      if (d && !(d.x === -dir.x && d.y === -dir.y)) {
        nextDir = d;
        if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) e.preventDefault();
      }
    }
    document.addEventListener('keydown', handleKey);

    // Touch controls
    let touchStart = null;
    canvas.addEventListener('touchstart', e => { touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY }; e.preventDefault(); }, { passive: false });
    canvas.addEventListener('touchend', e => {
      if (!touchStart) return;
      const dx = e.changedTouches[0].clientX - touchStart.x;
      const dy = e.changedTouches[0].clientY - touchStart.y;
      if (Math.abs(dx) > Math.abs(dy)) {
        if (dx > 20 && dir.x !== -1) nextDir = { x: 1, y: 0 };
        else if (dx < -20 && dir.x !== 1) nextDir = { x: -1, y: 0 };
      } else {
        if (dy > 20 && dir.y !== -1) nextDir = { x: 0, y: 1 };
        else if (dy < -20 && dir.y !== 1) nextDir = { x: 0, y: -1 };
      }
      touchStart = null;
      e.preventDefault();
    }, { passive: false });

    function draw(ts) {
      if (!gameRunning) return;
      requestAnimationFrame(draw);
      if (ts - lastTime < speed) return;
      lastTime = ts;

      dir = { ...nextDir };
      const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };

      if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS || snake.some(s => s.x === head.x && s.y === head.y)) {
        endSnake(score);
        return;
      }

      snake.unshift(head);
      trail.push({ x: head.x * CELL + CELL / 2, y: head.y * CELL + CELL / 2, alpha: 1 });

      if (head.x === food.x && head.y === food.y) {
        score += 10;
        updateModalScore(score);
        food = spawnFood();
        speed = Math.max(60, speed - 3);
      } else {
        snake.pop();
      }

      trail = trail.filter(t => { t.alpha -= 0.08; return t.alpha > 0; });

      render();
    }

    function render() {
      // Background
      ctx.fillStyle = '#020408';
      ctx.fillRect(0, 0, W, H);

      // Grid
      ctx.strokeStyle = 'rgba(0,207,255,0.04)';
      ctx.lineWidth = 1;
      for (let x = 0; x <= COLS; x++) {
        ctx.beginPath(); ctx.moveTo(x * CELL, 0); ctx.lineTo(x * CELL, H); ctx.stroke();
      }
      for (let y = 0; y <= ROWS; y++) {
        ctx.beginPath(); ctx.moveTo(0, y * CELL); ctx.lineTo(W, y * CELL); ctx.stroke();
      }

      // Trail
      trail.forEach(t => {
        ctx.save();
        ctx.globalAlpha = t.alpha * 0.3;
        ctx.fillStyle = '#00ff88';
        ctx.shadowColor = '#00ff88';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(t.x, t.y, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // Snake body
      snake.forEach((seg, i) => {
        const ratio = 1 - (i / snake.length) * 0.7;
        ctx.save();
        ctx.fillStyle = `rgba(0,255,136,${ratio})`;
        ctx.shadowColor = '#00ff88';
        ctx.shadowBlur = i === 0 ? 20 : 8;
        const pad = i === 0 ? 1 : 2;
        ctx.fillRect(seg.x * CELL + pad, seg.y * CELL + pad, CELL - pad * 2, CELL - pad * 2);
        if (i === 0) {
          // Eyes
          ctx.fillStyle = '#020408';
          ctx.shadowBlur = 0;
          const ex = dir.x === 1 ? 13 : dir.x === -1 ? 3 : 5;
          const ey = dir.y === 1 ? 13 : dir.y === -1 ? 3 : 5;
          ctx.fillRect(seg.x * CELL + ex, seg.y * CELL + ey, 3, 3);
          ctx.fillRect(seg.x * CELL + (CELL - ex - 3), seg.y * CELL + ey, 3, 3);
        }
        ctx.restore();
      });

      // Food pulsing
      const pulse = 0.7 + Math.sin(Date.now() / 200) * 0.3;
      ctx.save();
      ctx.fillStyle = '#ff0080';
      ctx.shadowColor = '#ff0080';
      ctx.shadowBlur = 20 * pulse;
      ctx.globalAlpha = pulse;
      ctx.beginPath();
      ctx.arc(food.x * CELL + CELL / 2, food.y * CELL + CELL / 2, CELL / 2 - 3, 0, Math.PI * 2);
      ctx.fill();
      // Inner
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#fff';
      ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.arc(food.x * CELL + CELL / 2, food.y * CELL + CELL / 2, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Score on canvas
      ctx.font = `bold 13px 'Share Tech Mono'`;
      ctx.fillStyle = 'rgba(0,207,255,0.5)';
      ctx.fillText(`LENGTH: ${snake.length}`, 8, 18);
    }

    requestAnimationFrame(draw);

    window._gameStop = () => { gameRunning = false; document.removeEventListener('keydown', handleKey); };
  }

  function endSnake(score) {
    window._gameStop && window._gameStop();
    gameOver('snake', score);
    const over = document.getElementById('snake-over');
    document.getElementById('snake-final-score').textContent = `SCORE: ${score}`;
    over.style.display = 'flex';
  }
}

function restartSnake(container) { initSnake(container); }
