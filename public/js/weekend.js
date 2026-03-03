/* ═══════════════════════════════════════════════
   주말 (토/일) – 편안한 메시지
═══════════════════════════════════════════════ */

const WEEKEND_EMOJIS = ['🌈', '🎈', '⭐', '🎉', '🌺', '🦋'];

function renderWeekend(data) {
  const content = document.getElementById('content');
  const now     = new Date();
  const isSat   = now.getDay() === 6;
  const activities = data.activities || [];

  let emojiIdx = 0;
  const cycleEmoji = () => WEEKEND_EMOJIS[emojiIdx++ % WEEKEND_EMOJIS.length];

  content.innerHTML = `
    <div class="slide-wrapper weekend-wrap">
      <div class="weekend-card glass">

        <div class="weekend-emoji">${isSat ? '🎉' : '☀️'}</div>

        <div class="weekend-message">${data.message || '신나는 주말 보내세요!'}</div>

        ${data.quote
          ? `<div class="weekend-quote">${data.quote}</div>`
          : ''}

        <div class="weekend-activities">
          ${activities.map(act => `
            <div class="activity-tag">${cycleEmoji()} ${act}</div>`).join('')}
        </div>

        ${data.monday_preview
          ? `<div class="weekend-preview">
               🗓️ 월요일 미리보기: ${data.monday_preview}
             </div>`
          : ''}

      </div>
    </div>`;

  // 10분마다 재렌더
  setTimeout(() => renderWeekend(data), 10 * 60 * 1000);
}
