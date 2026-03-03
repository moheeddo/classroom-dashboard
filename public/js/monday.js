/* ═══════════════════════════════════════════════
   월요일 – 정희원 선생님의 편지
═══════════════════════════════════════════════ */

// Perplexity 인용번호 [1][2] 등 제거
function cleanCitations(text) {
  return (text || '').replace(/\[\d+\]/g, '').replace(/\s{2,}/g, ' ').trim();
}

function renderMonday(data) {
  const content = document.getElementById('content');

  // 인용번호 제거
  const fullBody = cleanCitations(data.body);
  data = {
    ...data,
    greeting: cleanCitations(data.greeting),
    body:     fullBody,
    closing:  cleanCitations(data.closing),
    ps:       cleanCitations(data.ps),
  };

  content.innerHTML = `
    <div class="slide-wrapper monday-wrap">

      <!-- 편지 카드 -->
      <div class="letter-card glass">
        <div class="letter-from">
          <div class="teacher-avatar">👩‍🏫</div>
          <div class="teacher-info">
            <div class="name">${data.teacherName || '정희원'} 선생님</div>
            <div class="subtitle">담임선생님의 아침 편지</div>
          </div>
        </div>

        <div class="letter-date">📅 ${data.date || ''}</div>

        <div class="letter-greeting" id="mon-greeting"></div>
        <div class="letter-body"    id="mon-body"></div>
        <div class="letter-closing" id="mon-closing" style="opacity:0"></div>
        ${data.ps ? `<div class="letter-ps" id="mon-ps" style="opacity:0">✉️ P.S. ${data.ps}</div>` : ''}

        <div class="clap-badge">👏 짝짝짝! 칭찬의 박수~</div>
      </div>

      <!-- 장식 영역 -->
      <div class="letter-deco">
        <div class="deco-emoji">💌</div>
        <div class="deco-msg glass" style="padding:2vh 1.5vw; border-radius:1.2vw;">
          선생님이<br>여러분을<br>응원해요!
        </div>
        <div style="font-size:clamp(2rem,4vw,6rem); animation: floatY 3.5s ease-in-out infinite 0.5s;">🌟</div>
        <div style="font-size:clamp(1.5rem,3vw,4.5rem); animation: floatY 3.5s ease-in-out infinite 1s;">🌈</div>
      </div>

    </div>`;

  // 타이핑 애니메이션
  typeText('mon-greeting', data.greeting || '', 40, () => {
    typeText('mon-body', data.body || '', 28, () => {
      const closingEl = document.getElementById('mon-closing');
      const psEl      = document.getElementById('mon-ps');
      if (closingEl) {
        closingEl.style.opacity = '1';
        closingEl.style.transition = 'opacity 0.8s ease';
        closingEl.textContent = data.closing || '';
      }
      if (psEl) {
        setTimeout(() => {
          psEl.style.opacity = '1';
          psEl.style.transition = 'opacity 0.8s ease';
        }, 600);
      }
    });
  });

  // 전체 30분 동안 반복 (타이핑 완료 후 3분 대기 → 재시작)
  scheduleLetterRepeat(data);
}

function typeText(elId, text, speed, onDone) {
  const el = document.getElementById(elId);
  if (!el) return;
  el.textContent = '';
  let i = 0;
  const interval = setInterval(() => {
    if (i < text.length) {
      el.textContent += text[i++];
      // 자동 스크롤
      el.scrollTop = el.scrollHeight;
    } else {
      clearInterval(interval);
      onDone && setTimeout(onDone, 400);
    }
  }, speed);
}

let _letterRepeatTimer = null;
function scheduleLetterRepeat(data) {
  clearTimeout(_letterRepeatTimer);
  // 3분 후 편지 다시 재생
  _letterRepeatTimer = setTimeout(() => renderMonday(data), 3 * 60 * 1000);
}
