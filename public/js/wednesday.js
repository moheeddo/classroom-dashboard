/* ═══════════════════════════════════════════════
   수요일 – 사자성어
═══════════════════════════════════════════════ */

function renderWednesday(data) {
  const content = document.getElementById('content');

  if (!data || !data.hanja) {
    content.innerHTML = '<div class="error-screen"><h2>사자성어를 불러오지 못했어요 😢</h2></div>';
    return;
  }

  content.innerHTML = `
    <div class="slide-wrapper wednesday-wrap">

      <!-- 왼쪽: 한자 + 독음 + 뜻 -->
      <div class="idiom-hero glass" style="padding: 5vh 4vw; border-radius: var(--radius-xl);">
        <div class="idiom-hanja" id="wednesdayHanja" style="opacity:0">${data.hanja}</div>
        <div class="idiom-korean" id="wednesdayKorean" style="opacity:0">${data.korean}</div>
        <div class="idiom-meaning-big" id="wednesdayMeaning" style="opacity:0">${data.meaning}</div>
      </div>

      <!-- 오른쪽: 이야기 + 예문 + 팁 -->
      <div class="idiom-detail glass">
        ${data.origin ? `<div class="idiom-origin" id="wOrigin" style="opacity:0">📚 출처: ${data.origin}</div>` : ''}
        <div class="idiom-section-title" style="opacity:0" id="wStory">📖 유래 이야기</div>
        <div class="idiom-story" id="wednesdayStory" style="opacity:0">${data.story}</div>

        <div class="idiom-section-title" style="opacity:0; margin-top:1vh" id="wEx">💬 예시</div>
        <div class="idiom-example" id="wednesdayExample" style="opacity:0">${data.example}</div>

        <div class="idiom-section-title" style="opacity:0; margin-top:1vh" id="wTip">💡 외우기 팁</div>
        <div class="idiom-tip" id="wednesdayTip" style="opacity:0">${data.memory_tip}</div>
      </div>

    </div>`;

  // 순서대로 페이드인
  const seq = [
    ['wednesdayHanja',   200],
    ['wednesdayKorean',  700],
    ['wednesdayMeaning', 1200],
    ['wOrigin',          1800],
    ['wStory',           2200],
    ['wednesdayStory',   2500],
    ['wEx',              4000],
    ['wednesdayExample', 4300],
    ['wTip',             5400],
    ['wednesdayTip',     5700],
  ];

  seq.forEach(([id, delay]) => {
    setTimeout(() => {
      const el = document.getElementById(id);
      if (!el) return;
      el.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
      el.style.transform   = 'translateY(1.5vh)';
      // force reflow
      el.getBoundingClientRect();
      el.style.opacity   = '1';
      el.style.transform = 'translateY(0)';
    }, delay);
  });

  // 30분 주기 반복 – 10분 뒤 재렌더
  setTimeout(() => renderWednesday(data), 10 * 60 * 1000);
}
