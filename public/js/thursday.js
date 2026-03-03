/* ═══════════════════════════════════════════════
   목요일 – 명화 이야기
═══════════════════════════════════════════════ */

function renderThursday(data) {
  const content = document.getElementById('content');

  if (!data || !data.title_ko) {
    content.innerHTML = '<div class="error-screen"><h2>명화를 불러오지 못했어요 😢</h2></div>';
    return;
  }

  const imgSrc = data.image_url || '';

  content.innerHTML = `
    <div class="slide-wrapper thursday-wrap">

      <!-- 그림 프레임 -->
      <div class="artwork-frame glass">
        ${imgSrc
          ? `<img class="artwork-img"
                  src="${imgSrc}"
                  alt="${data.title_ko}"
                  onerror="this.parentElement.innerHTML='<div class=\\"artwork-no-img\\"><span>🖼️</span><span style=\\"font-size:var(--f-md);\\">${data.title_ko}</span></div>'">`
          : `<div class="artwork-no-img">
               <span>🖼️</span>
               <span style="font-size:var(--f-md);">${data.title_ko}</span>
             </div>`
        }
      </div>

      <!-- 정보 패널 -->
      <div class="artwork-info glass">

        <div class="artwork-title">${data.title_ko}</div>

        <div class="artwork-meta">
          <span>🎨 ${data.artist}</span>
          <span>📅 ${data.year}</span>
          <span>🏛️ ${data.style || ''}</span>
        </div>

        <div class="artwork-description">${data.description}</div>

        <div class="artwork-hidden">
          <div class="hidden-label">🔍 숨겨진 이야기</div>
          <div class="hidden-content">${data.hidden_story}</div>
        </div>

        <div class="artwork-question">
          <div class="q-label">💭 생각해 봐요</div>
          <div class="q-content">${data.question}</div>
        </div>

      </div>

    </div>`;

  // 10분 후 재렌더 (30분 동안 3회)
  setTimeout(() => renderThursday(data), 10 * 60 * 1000);
}
