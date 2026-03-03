/* ═══════════════════════════════════════════════
   화요일 – 동시 (행별 타이핑 + 자동 페이지 분할)
   75인치 교실 TV 가독성 최적화
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

/* ── --f-md 실제 픽셀값 구하기 ───────────────────────── */
function _getMaxFontSize() {
  const tmp = document.createElement('span');
  tmp.style.cssText = 'font-size:var(--f-md);position:absolute;visibility:hidden;';
  document.body.appendChild(tmp);
  const v = parseFloat(getComputedStyle(tmp).fontSize);
  tmp.remove();
  return v;
}

/* ── 컨테이너 사용 가능 높이 & gap 측정 ─────────────── */
function _measureContainer(container) {
  const cs = getComputedStyle(container);
  const availH = container.clientHeight
               - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
  const gap = parseFloat(cs.rowGap || cs.gap) || 0;
  return { availH, gap };
}

/* ── 레이아웃 계산: 폰트 크기 & 페이지당 줄 수 ──────── */
function calcPoemLayout(container, lineCount) {
  const { availH, gap } = _measureContainer(container);
  const maxSize = _getMaxFontSize();
  const minSize = maxSize * 0.7;   // 최소 70% — 교실 가독성 보장
  const lineH   = 1.55;

  // 전체가 한 화면에 들어가는지 시도
  const totalGap = Math.max(0, lineCount - 1) * gap;
  const fitSize  = (availH - totalGap) / (lineCount * lineH);

  if (fitSize >= minSize) {
    // 한 페이지에 전부 표시 가능
    return {
      fontSize: Math.min(fitSize, maxSize),
      linesPerPage: lineCount,
    };
  }

  // 줄이 너무 많음 → 페이지 분할
  // minSize 기준으로 한 페이지에 몇 줄 들어가는지 계산
  const lpp = Math.max(1, Math.floor((availH + gap) / (minSize * lineH + gap)));

  // 해당 줄 수에 맞춰 폰트 재계산 (minSize보다 클 수 있음)
  const pageGap  = Math.max(0, lpp - 1) * gap;
  const pageSize = Math.max(minSize, Math.min((availH - pageGap) / (lpp * lineH), maxSize));

  return { fontSize: pageSize, linesPerPage: lpp };
}

/* ── 시 표시 (진입점) ────────────────────────────────── */
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

  requestAnimationFrame(() => {
    const container = document.getElementById('poem-lines');
    if (!container || !lines.length) return;

    const { fontSize, linesPerPage } = calcPoemLayout(container, lines.length);
    container.style.setProperty('--dynamic-poem-size', fontSize + 'px');

    if (linesPerPage >= lines.length) {
      // ── 한 페이지: 그냥 타이핑 ──
      typePoemLines(lines, 0, showPoemFooter);
    } else {
      // ── 여러 페이지: 분할 타이핑 ──
      const pages = [];
      for (let i = 0; i < lines.length; i += linesPerPage) {
        pages.push(lines.slice(i, i + linesPerPage));
      }
      typePoemPages(container, pages, 0, showPoemFooter);
    }
  });
}

/* ── 페이지별 타이핑 (fade-out → clear → 다음 페이지) ─ */
function typePoemPages(container, pages, pageIdx, onDone) {
  if (!container || pageIdx >= pages.length) { onDone && onDone(); return; }

  const isLast  = pageIdx === pages.length - 1;
  const pageLines = pages[pageIdx];

  // 첫 페이지가 아니면 이전 내용 페이드 아웃 후 교체
  if (pageIdx > 0) {
    container.style.transition = 'opacity 0.5s ease';
    container.style.opacity = '0';
    setTimeout(() => {
      container.innerHTML = '';
      container.style.opacity = '1';
      typeAndContinue();
    }, 550);
  } else {
    typeAndContinue();
  }

  function typeAndContinue() {
    typePoemLines(pageLines, 0, () => {
      if (isLast) {
        onDone && onDone();
      } else {
        // 잠시 읽을 시간을 준 뒤 다음 페이지로
        setTimeout(() => typePoemPages(container, pages, pageIdx + 1, onDone), 2500);
      }
    });
  }
}

/* ── mood / description 페이드인 ─────────────────────── */
function showPoemFooter() {
  const mood = document.getElementById('poem-mood');
  const desc = document.getElementById('poem-desc');
  if (mood) { mood.style.transition = 'opacity 0.8s ease'; mood.style.opacity = '1'; }
  if (desc) { setTimeout(() => { desc.style.transition = 'opacity 0.8s ease'; desc.style.opacity = '1'; }, 400); }
}

/* ── 행 하나씩 타이핑 ────────────────────────────────── */
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
