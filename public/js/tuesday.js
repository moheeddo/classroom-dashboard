/* ═══════════════════════════════════════════════
   화요일 – 동시 (손글씨 효과 + 자동 페이지 분할)
   75인치 교실 TV 가독성 최적화
═══════════════════════════════════════════════ */

const POEM_SLIDE_MS = 5 * 60 * 1000;

function renderTuesday(data) {
  const poems = data.poems || [];
  if (!poems.length) {
    document.getElementById('content').innerHTML =
      '<div class="error-screen"><h2>동시를 불러오지 못했어요 😢</h2></div>';
    return;
  }
  autoSlide(poems.length, POEM_SLIDE_MS, (idx) => showPoem(poems[idx], idx, poems.length));
}

/* ── CSS --f-md 실제 픽셀값 ──────────────────────────── */
function _getMaxFontSize() {
  const t = document.createElement('span');
  t.style.cssText = 'font-size:var(--f-md);position:absolute;visibility:hidden;';
  document.body.appendChild(t);
  const v = parseFloat(getComputedStyle(t).fontSize);
  t.remove();
  return v;
}

/* ── 컨테이너 측정 (fallback 포함) ───────────────────── */
function _measureContainer(el) {
  const cs   = getComputedStyle(el);
  const padV = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
  let h = el.clientHeight - padV;
  // 레이아웃 미완성 시 뷰포트 기반 추정
  if (h < 100) h = window.innerHeight * 0.5;
  const gap = parseFloat(cs.rowGap || cs.gap) || 0;
  return { availH: h, gap };
}

/* ── 시 표시 (진입점) ────────────────────────────────── */
function showPoem(poem, idx, total) {
  const content = document.getElementById('content');
  const lines   = poem.lines || [];

  // 모든 행을 DOM에 렌더 (숨긴 상태)
  const linesHtml = lines.map(l =>
    `<div class="poem-line hw-hidden">${l}</div>`
  ).join('');

  content.innerHTML = `
    <div class="slide-wrapper tuesday-wrap">
      <div class="poem-card glass">
        <div class="poem-title">${poem.title || ''}</div>
        <div class="poem-poet">✍️ ${poem.poet || ''}</div>
        <div class="poem-lines" id="poem-lines">${linesHtml}</div>
        <div class="poem-mood" id="poem-mood" style="opacity:0">✨ ${poem.mood || ''}</div>
        <div class="poem-description" id="poem-desc" style="opacity:0">${poem.description || ''}</div>
      </div>
    </div>`;

  // 이중 rAF → 레이아웃 확정 후 실행
  requestAnimationFrame(() => requestAnimationFrame(() => {
    const container = document.getElementById('poem-lines');
    if (!container || !lines.length) return;

    const maxSize = _getMaxFontSize();
    const minSize = maxSize * 0.7;
    const { availH, gap } = _measureContainer(container);
    const lineH = 1.55;

    // 전체 행이 한 화면에 들어가는지 계산
    const totalGap = Math.max(0, lines.length - 1) * gap;
    const fitSize  = (availH - totalGap) / (lines.length * lineH);

    if (fitSize >= minSize) {
      // ── 한 페이지: 전부 표시 ──
      const fontSize = Math.min(fitSize, maxSize);
      container.style.setProperty('--dynamic-poem-size', fontSize + 'px');
      const lineEls = container.querySelectorAll('.poem-line');
      revealLines(lineEls, 0, _showFooter);
    } else {
      // ── 여러 페이지로 분할 ──
      const lpp = Math.max(2, Math.floor((availH + gap) / (minSize * lineH + gap)));
      const pgGap  = Math.max(0, lpp - 1) * gap;
      const pgSize = Math.max(minSize, Math.min((availH - pgGap) / (lpp * lineH), maxSize));
      container.style.setProperty('--dynamic-poem-size', pgSize + 'px');

      const pages = [];
      for (let i = 0; i < lines.length; i += lpp) pages.push(lines.slice(i, i + lpp));

      container.innerHTML = '';
      revealPages(container, pages, 0, _showFooter);
    }
  }));
}

/* ── 손글씨 효과: 행 하나씩 왼→오 등장 ──────────────── */
function revealLines(lineEls, idx, onDone) {
  if (idx >= lineEls.length) { onDone && onDone(); return; }

  const el = lineEls[idx];
  el.classList.remove('hw-hidden');
  el.classList.add('hw-reveal');

  // 다음 행까지 딜레이
  setTimeout(() => revealLines(lineEls, idx + 1, onDone), 800);
}

/* ── 페이지별 손글씨 (fade-out → 다음 페이지) ────────── */
function revealPages(container, pages, pageIdx, onDone) {
  if (!container || pageIdx >= pages.length) { onDone && onDone(); return; }

  const isLast    = pageIdx === pages.length - 1;
  const pageLines = pages[pageIdx];

  if (pageIdx > 0) {
    container.style.transition = 'opacity 0.5s ease';
    container.style.opacity = '0';
    setTimeout(() => {
      container.innerHTML = '';
      container.style.opacity = '1';
      renderAndReveal();
    }, 550);
  } else {
    renderAndReveal();
  }

  function renderAndReveal() {
    pageLines.forEach(line => {
      const div = document.createElement('div');
      div.className = 'poem-line hw-hidden';
      div.textContent = line;
      container.appendChild(div);
    });

    const els = container.querySelectorAll('.poem-line.hw-hidden');
    revealLines(els, 0, () => {
      if (isLast) { onDone && onDone(); }
      else { setTimeout(() => revealPages(container, pages, pageIdx + 1, onDone), 2500); }
    });
  }
}

/* ── mood / description 페이드인 ─────────────────────── */
function _showFooter() {
  const mood = document.getElementById('poem-mood');
  const desc = document.getElementById('poem-desc');
  if (mood) { mood.style.transition = 'opacity 0.8s ease'; mood.style.opacity = '1'; }
  if (desc) { setTimeout(() => { desc.style.transition = 'opacity 0.8s ease'; desc.style.opacity = '1'; }, 400); }
}
