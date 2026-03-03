/* ═══════════════════════════════════════════════
   화요일 – 동시
═══════════════════════════════════════════════ */

const POEM_SLIDE_MS = 5 * 60 * 1000; // 5분씩

function renderTuesday(data) {
  const poems = data.poems || [];
  if (!poems.length) {
    document.getElementById('content').innerHTML =
      '<div class="error-screen"><h2>동시를 불러오지 못했어요 😢</h2></div>';
    return;
  }

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

        <div class="poem-lines" id="poem-lines">
          ${lines.map((line, i) => `
            <div class="poem-line"
                 style="animation-delay:${i * 0.18}s">
              ${line}
            </div>`).join('')}
        </div>

        <div class="poem-mood">✨ ${poem.mood || ''}</div>
        <div class="poem-description">${poem.description || ''}</div>

      </div>
    </div>`;
}
