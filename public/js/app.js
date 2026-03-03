/* ═══════════════════════════════════════════════════════
   교실 대시보드 – 메인 앱 (app.js)
═══════════════════════════════════════════════════════ */

// ── 계절 감지 ───────────────────────────────────────────
function getSeason(month) {
  if (month >= 3 && month <= 5)  return 'spring';
  if (month >= 6 && month <= 8)  return 'summer';
  if (month >= 9 && month <= 11) return 'autumn';
  return 'winter';
}

function getSeasonLabel(season) {
  return { spring: '🌸 봄', summer: '☀️ 여름', autumn: '🍂 가을', winter: '❄️ 겨울' }[season];
}

// ── 요일 정보 ───────────────────────────────────────────
const DAY_INFO = [
  { label: '일요일', theme: '☀️ 주말',     bg: 'weekend',   api: 'weekend' },
  { label: '월요일', theme: '💌 선생님 편지', bg: 'monday',  api: 'monday'  },
  { label: '화요일', theme: '📖 오늘의 동시', bg: 'tuesday', api: 'tuesday' },
  { label: '수요일', theme: '📚 사자성어',   bg: 'wednesday',api: 'wednesday'},
  { label: '목요일', theme: '🎨 명화 이야기', bg: 'thursday',api: 'thursday'},
  { label: '금요일', theme: '🔭 오늘의 발견', bg: 'friday',  api: 'friday'  },
  { label: '토요일', theme: '☀️ 주말',     bg: 'weekend',   api: 'weekend' },
];

// ── 상태 ────────────────────────────────────────────────
const state = {
  season: 'spring',
  dayIndex: 1,
  slideIndex: 0,
  totalSlides: 1,
  slideTimer: null,
  progressTimer: null,
  progressStart: 0,
  slideDuration: 0,
};

// ── DOM 캐시 ────────────────────────────────────────────
const $  = id => document.getElementById(id);
const el = {
  clock:      $('clock'),
  date:       $('date-display'),
  weekday:    $('weekday-display'),
  seasonBadge:$('season-badge'),
  dayBadge:   $('day-theme-badge'),
  content:    $('content'),
  indicator:  $('slide-indicator'),
  progress:   $('progress-bar'),
  counter:    $('slide-counter'),
};

// ── 시계 ────────────────────────────────────────────────
function updateClock() {
  const now  = new Date();
  const h    = String(now.getHours()).padStart(2, '0');
  const m    = String(now.getMinutes()).padStart(2, '0');
  const s    = String(now.getSeconds()).padStart(2, '0');
  el.clock.textContent = `${h}:${m}:${s}`;
}

function updateDateDisplay() {
  const now   = new Date();
  const month = now.getMonth() + 1;
  const day   = now.getDate();
  const weeks = ['일', '월', '화', '수', '목', '금', '토'];
  const dayKo = weeks[now.getDay()];
  el.date.textContent    = `${now.getFullYear()}년 ${month}월 ${day}일`;
  el.weekday.textContent = `${dayKo}요일`;

  state.season   = getSeason(month);
  state.dayIndex = now.getDay();

  document.body.className = `season-${state.season}`;
  el.seasonBadge.textContent = getSeasonLabel(state.season);
  el.dayBadge.textContent    = DAY_INFO[state.dayIndex].theme;
  $('school-name').textContent = '우리 초등학교 4학년';
}

// ── 프로그레스 바 ────────────────────────────────────────
function startProgress(durationMs) {
  clearInterval(state.progressTimer);
  state.progressStart  = Date.now();
  state.slideDuration  = durationMs;
  el.progress.style.width = '0%';

  state.progressTimer = setInterval(() => {
    const elapsed = Date.now() - state.progressStart;
    const pct     = Math.min((elapsed / durationMs) * 100, 100);
    el.progress.style.width = pct + '%';
    if (pct >= 100) clearInterval(state.progressTimer);
  }, 100);
}

// ── 슬라이드 인디케이터 ──────────────────────────────────
function renderIndicator(total, current) {
  if (total <= 1) { el.indicator.style.display = 'none'; return; }
  el.indicator.style.display = 'flex';
  el.indicator.innerHTML = '';
  for (let i = 0; i < total; i++) {
    const dot = document.createElement('div');
    dot.className = `dot${i === current ? ' active' : ''}`;
    dot.addEventListener('click', () => goToSlide(i));
    el.indicator.appendChild(dot);
  }
  el.counter.textContent = `${current + 1} / ${total}`;
}

function goToSlide(idx) {
  state.slideIndex = idx;
  window._currentRenderer && window._currentRenderer(idx);
}

// ── 자동 슬라이드 ────────────────────────────────────────
function autoSlide(total, durationMs, renderFn) {
  clearTimeout(state.slideTimer);
  state.totalSlides = total;
  window._currentRenderer = renderFn;

  renderFn(state.slideIndex);
  renderIndicator(total, state.slideIndex);
  startProgress(durationMs);

  state.slideTimer = setTimeout(function tick() {
    state.slideIndex = (state.slideIndex + 1) % total;
    renderFn(state.slideIndex);
    renderIndicator(total, state.slideIndex);
    startProgress(durationMs);
    state.slideTimer = setTimeout(tick, durationMs);
  }, durationMs);
}

// ── 에러 화면 ────────────────────────────────────────────
function showError(msg) {
  el.content.innerHTML = `
    <div class="error-screen">
      <h2>⚠️ 콘텐츠를 불러오지 못했어요</h2>
      <p>${msg}</p>
      <p style="margin-top:2vh; font-size:var(--f-xs);">잠시 후 자동으로 다시 시도합니다...</p>
    </div>`;
  setTimeout(initContent, 30000);
}

// ── 로딩 ────────────────────────────────────────────────
function showLoading() {
  el.content.innerHTML = `
    <div class="loading-screen">
      <div class="loading-orb"></div>
      <p class="loading-text">오늘의 콘텐츠를 준비하고 있어요...</p>
    </div>`;
}

// ── API 호출 ────────────────────────────────────────────
async function fetchContent(endpoint) {
  const res = await fetch(`/api/${endpoint}`);
  if (!res.ok) throw new Error(`API 오류 (${res.status})`);
  return res.json();
}

// ── 콘텐츠 초기화 ────────────────────────────────────────
async function initContent() {
  showLoading();
  clearTimeout(state.slideTimer);
  clearInterval(state.progressTimer);
  state.slideIndex = 0;

  const info = DAY_INFO[state.dayIndex];

  try {
    const data = await fetchContent(info.api);

    switch (info.api) {
      case 'monday':    renderMonday(data);    break;
      case 'tuesday':   renderTuesday(data);   break;
      case 'wednesday': renderWednesday(data); break;
      case 'thursday':  renderThursday(data);  break;
      case 'friday':    renderFriday(data);    break;
      case 'weekend':   renderWeekend(data);   break;
      default:          showError('알 수 없는 요일입니다.');
    }
  } catch (err) {
    console.error(err);
    showError(err.message);
  }
}

// ── 초기화 ──────────────────────────────────────────────
function init() {
  updateClock();
  updateDateDisplay();
  setInterval(updateClock, 1000);

  // 날짜는 자정마다 갱신
  const msToMidnight = (() => {
    const n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), n.getDate() + 1) - n;
  })();
  setTimeout(() => {
    updateDateDisplay();
    initContent();
    setInterval(() => { updateDateDisplay(); initContent(); }, 86400000);
  }, msToMidnight);

  // 파티클 시작
  window.particleSystem.setSeason(state.season || 'spring');
  window.particleSystem.start();

  // 콘텐츠 로드
  initContent();
}

// DOM 준비되면 실행
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
