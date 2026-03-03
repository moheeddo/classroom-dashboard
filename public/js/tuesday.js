/* ═══════════════════════════════════════════════
   화요일 – 동시 (행별 타이핑 효과 + 동적 폰트)
═══════════════════════════════════════════════ */

const POEM_SLIDE_MS = 5 * 60 * 1000; // 5분씩

function renderTuesday(data) {
  const poems = data.poems || [];
  if (!poems.length) {
    document.getElementById('content').innerHTML =
      '<div class="error-screen"><h2>동시를 불러오지 못했어요 😢</h2></div>';
    return;
  }

  // 무한반복 autoSlide
  autoSlide(poems.length, POEM_SLIDE_MS, (idx) => showPoem(poems[idx], idx, poems.length));
}

function showPoem(poem, idx, total) {
  const content = document.getElementById('content');
  const lines   = poem.lines || [];

  content.innerHTML = `
    <div class="slide-wrapper tuesday-wrap">
      <div class="poem-card glass">

        <div class="poem-title">${poem.title || ''}</div>
        <div class="poem-poet">✍️ ${poem.poet || ''}</div>

        <div class="poem-lines" id="poem-lines"></div>

        <div class="poem-mood" id="poem-mood" style="opacity:0">✨ ${poem.mood || ''}</div>
        <div class="poem-description" id="poem-desc" style="opacity:0">${poem.description || ''}</div>

      </div>
    </div>`;

  // 레이아웃 확정 후 동적 폰트 크기 계산 → 타이핑 시작
  requestAnimationFrame(() => {
    fitPoemFont(lines.length);

    typePoemLines(lines, 0, () => {
      const mood = document.getElementById('poem-mood');
      const desc = document.getElementById('poem-desc');
      if (mood) { mood.style.transition = 'opacity 0.8s ease'; mood.style.opacity = '1'; }
      if (desc) { setTimeout(() => { desc.style.transition = 'opacity 0.8s ease'; desc.style.opacity = '1'; }, 400); }
    });
  });
}

// ── 줄 수에 맞춰 폰트 크기를 동적으로 계산 ──────────────
function fitPoemFont(lineCount) {
  const container = document.getElementById('poem-lines');
  if (!container || !lineCount) return;

  const cs     = getComputedStyle(container);
  const availH = container.clientHeight
               - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
  const gap    = parseFloat(cs.rowGap || cs.gap) || 0;
  const totalGap = Math.max(0, lineCount - 1) * gap;
  const lineH  = 1.55;

  // 사용 가능 높이에 딱 맞는 폰트 크기
  let size = (availH - totalGap) / (lineCount * lineH);

  // CSS --f-md 실제 계산값을 최대 크기로 사용
  const tmp = document.createElement('span');
  tmp.style.cssText = 'font-size:var(--f-md);position:absolute;visibility:hidden;';
  document.body.appendChild(tmp);
  const maxSize = parseFloat(getComputedStyle(tmp).fontSize);
  tmp.remove();

  const minSize = Math.max(maxSize * 0.3, 14);
  size = Math.max(minSize, Math.min(size, maxSize));

  container.style.setProperty('--dynamic-poem-size', size + 'px');

  // 폰트가 많이 줄었으면 gap도 비례 축소
  const ratio = size / maxSize;
  if (ratio < 0.85) {
    container.style.gap = Math.max(0.3, 0.8 * ratio) + 'vh';
  }
}

// ── 행 하나씩 타이핑 ────────────────────────────────────
function typePoemLines(lines, lineIdx, onDone) {
  const container = document.getElementById('poem-lines');
  if (!container || lineIdx >= lines.length) {
    onDone && onDone();
    return;
  }

  const line = lines[lineIdx];
  const div  = document.createElement('div');
  div.className = 'poem-line typed';
  container.appendChild(div);

  let charIdx = 0;
  const interval = setInterval(() => {
    if (!document.getElementById('poem-lines')) { clearInterval(interval); return; }
    if (charIdx < line.length) {
      div.textContent += line[charIdx++];
    } else {
      clearInterval(interval);
      setTimeout(() => typePoemLines(lines, lineIdx + 1, onDone), 500);
    }
  }, 80);
}
