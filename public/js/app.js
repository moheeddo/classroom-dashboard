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
function getSeasonLabel(s) {
  return { spring:'🌸 봄', summer:'☀️ 여름', autumn:'🍂 가을', winter:'❄️ 겨울' }[s];
}

// ── 요일 정보 ───────────────────────────────────────────
const DAY_INFO = [
  { label:'일요일', theme:'☀️ 주말',       api:'weekend'   },
  { label:'월요일', theme:'💌 선생님 편지', api:'monday'    },
  { label:'화요일', theme:'📖 오늘의 동시', api:'tuesday'   },
  { label:'수요일', theme:'📚 사자성어',   api:'wednesday' },
  { label:'목요일', theme:'🎨 명화 이야기',api:'thursday'  },
  { label:'금요일', theme:'🔭 오늘의 발견',api:'friday'    },
  { label:'토요일', theme:'☀️ 주말',       api:'weekend'   },
];

// ── 상태 ────────────────────────────────────────────────
const state = {
  season: 'spring',
  todayDayIndex: 1,      // 실제 오늘 요일 (0=일~6=토)
  viewDayIndex: 1,       // 현재 보고 있는 요일
  slideIndex: 0,
  slideTimer: null,
  progressTimer: null,
  progressStart: 0,
  slideDuration: 0,
};

// ── DOM ──────────────────────────────────────────────────
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
  viewLabel:  $('view-label'),
  sidebarDate:$('sidebar-date'),
  sidebarSeason:$('sidebar-season'),
};

// ── 시계 ────────────────────────────────────────────────
function updateClock() {
  const now = new Date();
  const pad = n => String(n).padStart(2,'0');
  el.clock.textContent = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
}

// ── 날짜/계절 갱신 ──────────────────────────────────────
function updateDateDisplay() {
  const now    = new Date();
  const month  = now.getMonth() + 1;
  const day    = now.getDate();
  const weekKo = ['일','월','화','수','목','금','토'];

  state.season        = getSeason(month);
  state.todayDayIndex = now.getDay();
  if (state.viewDayIndex === undefined) state.viewDayIndex = state.todayDayIndex;

  document.body.className = `season-${state.season}`;

  el.date.textContent     = `${now.getFullYear()}년 ${month}월 ${day}일`;
  el.weekday.textContent  = `${weekKo[now.getDay()]}요일`;
  el.seasonBadge.textContent  = getSeasonLabel(state.season);
  el.dayBadge.textContent     = DAY_INFO[state.todayDayIndex].theme;

  // 사이드바
  el.sidebarDate.innerHTML = `${now.getFullYear()}년<br>${month}월 ${day}일 (${weekKo[now.getDay()]})`;
  el.sidebarSeason.textContent = getSeasonLabel(state.season);

  // 파티클 계절 갱신
  if (window.particleSystem) window.particleSystem.setSeason(state.season);

  // 사이드바 오늘 표시 갱신
  highlightTodayNav();
}

// ── 이번 주 특정 요일의 날짜 계산 ───────────────────────
function getWeekDateStr(targetDayIdx) {
  const now  = new Date();
  const diff = targetDayIdx - now.getDay();
  const d    = new Date(now);
  d.setDate(now.getDate() + diff);
  return d.toISOString().split('T')[0]; // YYYY-MM-DD
}

// ── 프로그레스 바 ────────────────────────────────────────
function startProgress(ms) {
  clearInterval(state.progressTimer);
  state.progressStart = Date.now();
  state.slideDuration = ms;
  el.progress.style.width = '0%';
  state.progressTimer = setInterval(() => {
    const pct = Math.min(((Date.now()-state.progressStart)/ms)*100, 100);
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
  el.counter.textContent = `${current+1} / ${total}`;
}

function goToSlide(idx) {
  state.slideIndex = idx;
  window._currentRenderer && window._currentRenderer(idx);
}

// ── 자동 슬라이드 ────────────────────────────────────────
function autoSlide(total, ms, renderFn) {
  clearTimeout(state.slideTimer);
  state.totalSlides = total;
  window._currentRenderer = renderFn;
  renderFn(state.slideIndex);
  renderIndicator(total, state.slideIndex);
  startProgress(ms);

  state.slideTimer = setTimeout(function tick() {
    state.slideIndex = (state.slideIndex + 1) % total;
    renderFn(state.slideIndex);
    renderIndicator(total, state.slideIndex);
    startProgress(ms);
    state.slideTimer = setTimeout(tick, ms);
  }, ms);
}

// ── 로딩 / 에러 ──────────────────────────────────────────
function showLoading(msg) {
  el.content.innerHTML = `
    <div class="loading-screen">
      <div class="loading-orb"></div>
      <p class="loading-text">${msg || '오늘의 콘텐츠를 준비하고 있어요...'}</p>
    </div>`;
}
function showError(msg) {
  el.content.innerHTML = `
    <div class="error-screen">
      <h2>⚠️ 불러오지 못했어요</h2>
      <p>${msg}</p>
    </div>`;
  setTimeout(() => loadDayContent(state.todayDayIndex), 30000);
}

// ── API 호출 (date 파라미터 포함) ───────────────────────
async function fetchContent(endpoint, dateStr) {
  const url = dateStr ? `/api/${endpoint}?date=${dateStr}` : `/api/${endpoint}`;
  const res  = await fetch(url);
  if (!res.ok) throw new Error(`API 오류 (${res.status})`);
  return res.json();
}

// ── 뷰 라벨 업데이트 ────────────────────────────────────
function updateViewLabel(dayIdx) {
  if (dayIdx === state.todayDayIndex) {
    el.viewLabel.style.display = 'none';
  } else {
    const weekKo = ['일','월','화','수','목','금','토'];
    const dateStr = getWeekDateStr(dayIdx);
    el.viewLabel.style.display = 'block';
    el.viewLabel.textContent   = `📅 ${weekKo[dayIdx]}요일 (${dateStr}) 콘텐츠 보는 중 · 클릭하면 오늘로 돌아가요`;
    el.viewLabel.style.cursor  = 'pointer';
    el.viewLabel.onclick       = () => loadDayContent(state.todayDayIndex);
  }
}

// ── 요일 콘텐츠 로드 ────────────────────────────────────
async function loadDayContent(dayIdx, dateStr) {
  state.viewDayIndex = dayIdx;
  state.slideIndex   = 0;
  clearTimeout(state.slideTimer);
  clearInterval(state.progressTimer);

  const info     = DAY_INFO[dayIdx];
  const targetDate = dateStr || getWeekDateStr(dayIdx);

  // 사이드바 활성 표시
  setNavActive(dayIdx);
  updateViewLabel(dayIdx);
  el.dayBadge.textContent = info.theme;

  // API가 weekend인 경우 날짜 계산이 의미 없으므로 오늘 기준
  const apiDate = (dayIdx === 0 || dayIdx === 6)
    ? getWeekDateStr(state.todayDayIndex)
    : targetDate;

  showLoading(dayIdx !== state.todayDayIndex
    ? '다른 요일 자료를 불러오는 중...'
    : undefined);

  try {
    const data = await fetchContent(info.api, apiDate);
    switch (info.api) {
      case 'monday':    renderMonday(data);    break;
      case 'tuesday':   renderTuesday(data);   break;
      case 'wednesday': renderWednesday(data); break;
      case 'thursday':  renderThursday(data);  break;
      case 'friday':    renderFriday(data);    break;
      case 'weekend':   renderWeekend(data);   break;
    }
  } catch (err) {
    console.error(err);
    showError(err.message);
  }
}

// ── 사이드바 요일 네비 ───────────────────────────────────
function highlightTodayNav() {
  document.querySelectorAll('.nav-day').forEach(btn => {
    const d = parseInt(btn.dataset.day);
    btn.classList.toggle('today', d === state.todayDayIndex);
    btn.classList.toggle('active', d === state.viewDayIndex);
  });
}

function setNavActive(dayIdx) {
  document.querySelectorAll('.nav-day').forEach(btn => {
    const d = parseInt(btn.dataset.day);
    btn.classList.toggle('active', d === dayIdx);
    btn.classList.toggle('today',  d === state.todayDayIndex);
  });
}

function initSidebarNav() {
  document.querySelectorAll('.nav-day').forEach(btn => {
    btn.addEventListener('click', () => {
      const dayIdx = parseInt(btn.dataset.day);
      // 이미 같은 요일 → 스킵
      if (dayIdx === state.viewDayIndex) return;
      // 로딩 스피너 표시
      btn.classList.add('loading-nav');
      loadDayContent(dayIdx).finally(() => btn.classList.remove('loading-nav'));
    });
  });
}

// ── 초기화 ──────────────────────────────────────────────
function init() {
  updateClock();
  updateDateDisplay();
  setInterval(updateClock, 1000);

  // 자정 갱신
  const msToMidnight = (() => {
    const n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), n.getDate()+1) - n;
  })();
  setTimeout(() => {
    updateDateDisplay();
    loadDayContent(state.todayDayIndex);
    setInterval(() => { updateDateDisplay(); loadDayContent(state.todayDayIndex); }, 86400000);
  }, msToMidnight);

  // 파티클
  window.particleSystem.setSeason(state.season);
  window.particleSystem.start();

  // 사이드바 네비 클릭 이벤트
  initSidebarNav();

  // 오늘 콘텐츠 로드
  loadDayContent(state.todayDayIndex);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
