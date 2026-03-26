// ============================================================
// FUSION 2048 — Neon tile merging game
// ============================================================
function init2048(container) {
  container.innerHTML = `
    <div id="game2048-wrap" style="width:340px;max-width:100%;">
      <div id="game2048-board" style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;background:#060d1a;padding:12px;border:1px solid rgba(168,85,247,0.3);border-radius:4px;"></div>
      <div style="margin-top:12px;font-family:'Share Tech Mono',monospace;font-size:0.75rem;color:var(--text-dim);text-align:center;">
        Arrow keys / WASD to move · Swipe on mobile
      </div>
      <div class="game-start-screen" id="start2048">
        <h2>🧩 FUSION 2048</h2>
        <p>Use <strong style="color:#a855f7">Arrow Keys</strong> or <strong style="color:#a855f7">WASD</strong> to merge tiles.<br>
        Reach <strong style="color:#ffe500">2048</strong> to win.<br>
        But can you go further?</p>
        <button class="start-btn" style="border-color:#a855f7;color:#a855f7;" onclick="start2048Game()">▶ START</button>
      </div>
      <div class="game-over-screen" id="over2048" style="display:none;">
        <h2 id="over2048-title">GAME OVER</h2>
        <div class="final-score" id="over2048-score">SCORE: 0</div>
        <div class="over-btns">
          <button class="start-btn" style="border-color:#a855f7;color:#a855f7;" onclick="start2048Game()">▶ NEW GAME</button>
        </div>
      </div>
    </div>`;

  window.start2048Game = start2048Game;
  window.restart2048 = function(c) { init2048(c); };

  const COLORS = {
    0:    { bg: '#0a0f1a', fg: 'transparent', border: 'rgba(168,85,247,0.1)' },
    2:    { bg: '#1a0a2e', fg: '#c4a0f0', border: '#7c3aed' },
    4:    { bg: '#1e0a3a', fg: '#d0aff5', border: '#8b45f5' },
    8:    { bg: '#2a0a4a', fg: '#e0bfff', border: '#a855f7' },
    16:   { bg: '#3a0060', fg: '#f0d0ff', border: '#c070ff' },
    32:   { bg: '#00254a', fg: '#a0e8ff', border: '#00cfff' },
    64:   { bg: '#003060', fg: '#c0eeff', border: '#30dfff' },
    128:  { bg: '#004020', fg: '#a0ffcc', border: '#00ff88' },
    256:  { bg: '#004828', fg: '#b0ffe0', border: '#00ff99' },
    512:  { bg: '#4a1000', fg: '#ffb080', border: '#ff6010' },
    1024: { bg: '#5a1400', fg: '#ffcc80', border: '#ff8c00' },
    2048: { bg: '#600010', fg: '#ffee80', border: '#ffe500' },
    4096: { bg: '#300060', fg: '#ff80ff', border: '#ff00ff' },
  };

  function start2048Game() {
    document.getElementById('start2048').style.display = 'none';
    document.getElementById('over2048').style.display = 'none';
    run2048();
  }

  function run2048() {
    let grid = Array.from({ length: 4 }, () => Array(4).fill(0));
    let score = 0;
    let won = false;

    function addRandom() {
      const empty = [];
      grid.forEach((row, r) => row.forEach((v, c) => { if (!v) empty.push([r, c]); }));
      if (!empty.length) return;
      const [r, c] = empty[Math.floor(Math.random() * empty.length)];
      grid[r][c] = Math.random() < 0.85 ? 2 : 4;
    }

    addRandom(); addRandom();

    function render() {
      const board = document.getElementById('game2048-board');
      if (!board) return;
      board.innerHTML = '';
      grid.forEach(row => {
        row.forEach(val => {
          const tile = document.createElement('div');
          const col = COLORS[Math.min(val, 4096)] || COLORS[4096];
          tile.style.cssText = `
            aspect-ratio:1;
            display:flex;align-items:center;justify-content:center;
            border-radius:3px;
            background:${col.bg};
            border:1px solid ${col.border};
            color:${col.fg};
            font-family:'Orbitron',monospace;
            font-size:${val >= 1000 ? '0.75rem' : val >= 100 ? '0.9rem' : '1.1rem'};
            font-weight:900;
            letter-spacing:0.05em;
            transition:all 0.1s;
            min-height:60px;
            box-shadow: ${val ? `0 0 12px ${col.border}40, inset 0 0 20px ${col.border}10` : 'none'};
          `;
          if (val >= 2048) {
            tile.style.animation = 'none';
            tile.style.boxShadow = `0 0 30px ${col.border}, 0 0 60px ${col.border}80`;
          }
          tile.textContent = val || '';
          board.appendChild(tile);
        });
      });
    }

    function slide(row) {
      let r = row.filter(v => v);
      let merged = [];
      let gained = 0;
      let out = [];
      for (let i = 0; i < r.length; i++) {
        if (i + 1 < r.length && r[i] === r[i + 1] && !merged.includes(i)) {
          const val = r[i] * 2;
          out.push(val);
          gained += val;
          merged.push(i + 1);
          i++;
        } else out.push(r[i]);
      }
      while (out.length < 4) out.push(0);
      return { row: out, gained };
    }

    function move(dir) {
      let moved = false;
      let totalGain = 0;

      const trySlide = (getRow, setRow) => {
        for (let i = 0; i < 4; i++) {
          const old = getRow(i);
          const { row: newRow, gained } = slide(old);
          totalGain += gained;
          if (newRow.join() !== old.join()) { moved = true; setRow(i, newRow); }
        }
      };

      if (dir === 'left') {
        trySlide(i => [...grid[i]], (i, r) => { grid[i] = r; });
      } else if (dir === 'right') {
        trySlide(i => [...grid[i]].reverse(), (i, r) => { grid[i] = r.reverse(); });
      } else if (dir === 'up') {
        trySlide(
          i => grid.map(row => row[i]),
          (i, r) => r.forEach((v, j) => { grid[j][i] = v; })
        );
      } else if (dir === 'down') {
        trySlide(
          i => grid.map(row => row[i]).reverse(),
          (i, r) => r.reverse().forEach((v, j) => { grid[j][i] = v; })
        );
      }

      if (moved) {
        score += totalGain;
        updateModalScore(score);
        addRandom();
        render();
        if (!won && grid.flat().includes(2048)) {
          won = true;
          setTimeout(() => {
            document.getElementById('over2048-title').textContent = '🎉 YOU WIN!';
            document.getElementById('over2048-title').style.color = '#ffe500';
            document.getElementById('over2048-score').textContent = `SCORE: ${score}`;
            document.getElementById('over2048').style.display = 'flex';
            gameOver('2048', score);
          }, 300);
        }
        if (isGameOver()) {
          setTimeout(() => {
            document.getElementById('over2048-title').textContent = 'GAME OVER';
            document.getElementById('over2048-title').style.color = '#ff0080';
            document.getElementById('over2048-score').textContent = `SCORE: ${score}`;
            document.getElementById('over2048').style.display = 'flex';
            gameOver('2048', score);
          }, 300);
        }
      }
    }

    function isGameOver() {
      if (grid.flat().includes(0)) return false;
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
          if (c + 1 < 4 && grid[r][c] === grid[r][c+1]) return false;
          if (r + 1 < 4 && grid[r][c] === grid[r+1][c]) return false;
        }
      }
      return true;
    }

    function handleKey(e) {
      const map = { ArrowLeft:'left', ArrowRight:'right', ArrowUp:'up', ArrowDown:'down', a:'left', d:'right', w:'up', s:'down' };
      const dir = map[e.key];
      if (dir) { e.preventDefault(); move(dir); }
    }
    document.addEventListener('keydown', handleKey);

    // Touch swipe
    let ts = null;
    const wrap = document.getElementById('game2048-wrap');
    wrap.addEventListener('touchstart', e => { ts = { x: e.touches[0].clientX, y: e.touches[0].clientY }; }, { passive: true });
    wrap.addEventListener('touchend', e => {
      if (!ts) return;
      const dx = e.changedTouches[0].clientX - ts.x;
      const dy = e.changedTouches[0].clientY - ts.y;
      if (Math.abs(dx) > Math.abs(dy)) move(dx > 20 ? 'right' : 'left');
      else move(dy > 20 ? 'down' : 'up');
      ts = null;
    }, { passive: true });

    render();
    window._gameStop = () => { document.removeEventListener('keydown', handleKey); };
  }
}

function restart2048(container) { init2048(container); }
