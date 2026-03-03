/* ═══════════════════════════════════════════════
   화요일 – 동시 (행별 타이핑 효과)
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

  // 행별 타이핑 효과
  typePoemLines(lines, 0, () => {
    const mood = document.getElementById('poem-mood');
    const desc = document.getElementById('poem-desc');
    if (mood) { mood.style.transition = 'opacity 0.8s ease'; mood.style.opacity = '1'; }
    if (desc) { setTimeout(() => { desc.style.transition = 'opacity 0.8s ease'; desc.style.opacity = '1'; }, 400); }
  });
}

// 행 하나씩 타이핑
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
