/* ═══════════════════════════════════════════════
   금요일 – 역사 속 오늘
═══════════════════════════════════════════════ */

const FACT_SLIDE_MS = 4 * 60 * 1000; // 4분씩 (5개 × 4분 = 20분, 반복)

function renderFriday(data) {
  const facts = data.facts || [];
  if (!facts.length) {
    document.getElementById('content').innerHTML =
      '<div class="error-screen"><h2>역사 속 오늘을 불러오지 못했어요 😢</h2></div>';
    return;
  }

  autoSlide(facts.length, FACT_SLIDE_MS, (idx) => showFact(data, facts[idx], idx, facts.length));
}

function showFact(data, fact, idx, total) {
  const content = document.getElementById('content');

  content.innerHTML = `
    <div class="slide-wrapper friday-wrap">

      <!-- 헤더 -->
      <div class="friday-header">
        <div class="friday-category">
          ${data.categoryEmoji || '🏛️'} ${data.category || '역사 속 오늘'}
        </div>
        <div class="friday-date-label">${data.dateLabel || ''}</div>
        <div class="friday-subtitle">오늘, 역사 속에서 무슨 일이 있었을까요?</div>
      </div>

      <!-- 사실 카드 -->
      <div class="fact-card glass">
        <div class="fact-number">${idx + 1}</div>

        <div class="fact-emoji-big">${fact.emoji || '🌟'}</div>

        <div class="fact-content">
          ${fact.year ? `<div class="fact-year">${fact.year}</div>` : ''}
          <div class="fact-title">${fact.title}</div>
          <div class="fact-body">${fact.content}</div>
          <div class="fact-wow">⚡ ${fact.wow || '정말 놀랍죠?'}</div>
        </div>
      </div>

    </div>`;
}
