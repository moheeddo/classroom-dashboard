const express = require('express');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

const config = require('./config.json');
const app = express();
const PORT = process.env.PORT || 3000;

// Vercel 서버리스: /tmp 사용 / 로컬: ./cache 사용
const CACHE_DIR = process.env.VERCEL
  ? '/tmp/classroom-cache'
  : path.join(__dirname, 'cache');

if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// ─────────────────────────────────────────
//  Perplexity API 호출
// ─────────────────────────────────────────
async function callPerplexity(userPrompt, systemPrompt, maxTokens = 2000) {
  const response = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.PERPLEXITY_API_KEY || config.perplexityApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'sonar',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: maxTokens,
      temperature: 0.85,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Perplexity API ${response.status}: ${errText}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

// ─────────────────────────────────────────
//  캐시 유틸
// ─────────────────────────────────────────
function todayKey() {
  return new Date().toISOString().split('T')[0];
}
// date 파라미터 지원 – 없으면 오늘 날짜
function cacheGet(name, date) {
  const key = date || todayKey();
  const f = path.join(CACHE_DIR, `${key}_${name}.json`);
  return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : null;
}
function cacheSet(name, data, date) {
  const key = date || todayKey();
  const f = path.join(CACHE_DIR, `${key}_${name}.json`);
  fs.writeFileSync(f, JSON.stringify(data, null, 2), 'utf8');
}

function safeJson(raw) {
  try {
    const m = raw.match(/```json\s*([\s\S]*?)```/) || raw.match(/(\{[\s\S]*\})/);
    return m ? JSON.parse(m[1]) : JSON.parse(raw);
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────
//  월요일 – 선생님 편지
// ─────────────────────────────────────────
app.get('/api/monday', async (req, res) => {
  const date = req.query.date || todayKey();
  const cached = cacheGet('monday', date);
  if (cached) return res.json(cached);

  const { teacher } = config;
  const now = new Date();
  const dateStr = `${now.getMonth() + 1}월 ${now.getDate()}일`;
  const months = now.getMonth() + 1;
  const seasonMap = months <= 2 || months === 12 ? '겨울' : months <= 5 ? '봄' : months <= 8 ? '여름' : '가을';

  try {
    const system = `당신은 ${teacher.name} 선생님입니다.
성격: ${teacher.persona}
특이사항: ${teacher.notes}
당신은 매주 월요일 아침, 초등학교 4학년 학생들에게 따뜻한 편지를 씁니다.
편지는 반드시 JSON 형식으로만 응답하세요.`;

    const user = `오늘은 ${dateStr}(${seasonMap})입니다. 학생들에게 아침 편지를 써주세요.
아래 JSON 형식으로만 답하세요:
{
  "greeting": "인사말 (1~2문장, 계절감 포함)",
  "body": "편지 본문 (3~4문장, 이번 주 응원, 칭찬, 따뜻한 이야기)",
  "closing": "마무리 인사 (1문장 + 칭찬의 박수 언급)",
  "ps": "P.S. 짧은 한마디 (선생님 딸 이야기나 귀여운 비밀 공유 가능, 선택)"
}`;

    const raw = await callPerplexity(user, system);
    const parsed = safeJson(raw);
    const data = parsed || { greeting: '', body: raw, closing: '' };
    data.teacherName = teacher.name;
    data.date = dateStr;
    cacheSet('monday', data, date);
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─────────────────────────────────────────
//  화요일 – 동시
// ─────────────────────────────────────────
app.get('/api/tuesday', async (req, res) => {
  const date = req.query.date || todayKey();
  const cached = cacheGet('tuesday', date);
  if (cached) return res.json(cached);

  try {
    const system = `당신은 초등학교 국어 선생님입니다. 반드시 JSON 형식으로만 응답하세요.`;
    const user = `초등학교 4학년이 좋아할 한국 동시 3편을 소개해주세요.
실제 존재하는 동시를 사용하거나, 없을 경우 비슷한 느낌의 창작 동시를 써주세요.
아래 JSON 형식으로만 답하세요:
{
  "poems": [
    {
      "title": "제목",
      "poet": "시인 이름",
      "lines": ["시 첫 행", "두 번째 행", "..."],
      "mood": "이 시의 분위기/느낌 (10자 이내)",
      "description": "아이들을 위한 한 줄 소개"
    }
  ]
}`;

    const raw = await callPerplexity(user, system);
    const data = safeJson(raw) || { poems: [] };
    cacheSet('tuesday', data, date);
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─────────────────────────────────────────
//  수요일 – 사자성어
// ─────────────────────────────────────────
app.get('/api/wednesday', async (req, res) => {
  const date = req.query.date || todayKey();
  const cached = cacheGet('wednesday', date);
  if (cached) return res.json(cached);

  try {
    const system = `당신은 초등학교 선생님입니다. 반드시 JSON 형식으로만 응답하세요.`;
    const user = `오늘의 사자성어를 초등학교 4학년 눈높이에 맞게 소개해주세요.
아래 JSON 형식으로만 답하세요:
{
  "hanja": "사자성어 (한자)",
  "korean": "독음 (한글)",
  "meaning": "뜻 (초등생이 이해하기 쉽게)",
  "story": "유래나 관련 이야기 (120자 이내, 쉽고 재미있게)",
  "example": "우리 생활 속 예시 문장",
  "memory_tip": "외우기 쉬운 연상법이나 팁 (재미있게)"
}`;

    const raw = await callPerplexity(user, system);
    const data = safeJson(raw) || {};
    cacheSet('wednesday', data, date);
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─────────────────────────────────────────
//  목요일 – 명화
// ─────────────────────────────────────────
app.get('/api/thursday', async (req, res) => {
  const date = req.query.date || todayKey();
  const cached = cacheGet('thursday', date);
  if (cached) return res.json(cached);

  try {
    const system = `당신은 어린이 미술 선생님입니다. 반드시 JSON 형식으로만 응답하세요.`;
    const user = `세계적으로 유명한 명화 1점을 초등학교 4학년 눈높이로 소개해주세요.
매번 다른 작품을 골라주세요 (인상파, 르네상스, 바로크, 현대미술 등 다양하게).
위키미디어 코먼스에서 공개 도메인으로 실제 접근 가능한 이미지 URL을 제공해주세요.
아래 JSON 형식으로만 답하세요:
{
  "title_ko": "그림 제목 (한국어)",
  "title_en": "그림 제목 (원어)",
  "artist": "작가 이름",
  "year": "제작 연도 또는 시기",
  "style": "미술 양식/시대",
  "description": "그림 설명 (아이들이 쉽게 이해할 수 있게, 180자 이내)",
  "hidden_story": "이 그림에 숨겨진 재미있는 이야기 (100자 이내)",
  "question": "아이들에게 던지는 상상력 자극 질문",
  "image_url": "위키미디어 코먼스 공개 도메인 이미지 직접 URL (https://upload.wikimedia.org/... 형식)"
}`;

    const raw = await callPerplexity(user, system, 2500);
    const data = safeJson(raw) || {};
    cacheSet('thursday', data, date);
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─────────────────────────────────────────
//  금요일 – 오늘의 신기한 발견
// ─────────────────────────────────────────
const FRIDAY_CATEGORIES = [
  { name: '우주와 과학', emoji: '🔭' },
  { name: '동물의 세계', emoji: '🦁' },
  { name: '역사 속 오늘', emoji: '🏛️' },
  { name: '세계 여러 나라', emoji: '🌏' },
  { name: '자연의 신비', emoji: '🌿' },
  { name: '수학의 마법', emoji: '✨' },
];

app.get('/api/friday', async (req, res) => {
  const date = req.query.date || todayKey();
  const cached = cacheGet('friday', date);
  if (cached) return res.json(cached);

  const weekNum = Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000));
  const cat = FRIDAY_CATEGORIES[weekNum % FRIDAY_CATEGORIES.length];

  try {
    const system = `당신은 호기심 넘치는 어린이 과학 선생님입니다. 반드시 JSON 형식으로만 응답하세요.`;
    const user = `"${cat.name}" 주제로 초등학교 4학년이 "와!" 하고 놀랄 신기한 사실 5가지를 알려주세요.
아래 JSON 형식으로만 답하세요:
{
  "category": "${cat.name}",
  "categoryEmoji": "${cat.emoji}",
  "facts": [
    {
      "title": "호기심을 자극하는 짧은 제목",
      "content": "신기한 사실 내용 (90자 이내, 초등생 눈높이)",
      "emoji": "관련 이모지",
      "wow": "한 줄 감탄 포인트"
    }
  ]
}`;

    const raw = await callPerplexity(user, system);
    const data = safeJson(raw) || { category: cat.name, categoryEmoji: cat.emoji, facts: [] };
    cacheSet('friday', data, date);
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─────────────────────────────────────────
//  주말 – 편안한 메시지
// ─────────────────────────────────────────
app.get('/api/weekend', async (req, res) => {
  const date = req.query.date || todayKey();
  const cached = cacheGet('weekend', date);
  if (cached) return res.json(cached);

  try {
    const system = `당신은 따뜻한 초등학교 선생님입니다. 반드시 JSON 형식으로만 응답하세요.`;
    const user = `초등학교 4학년 학생들을 위한 주말 응원 메시지를 만들어주세요.
아래 JSON 형식으로만 답하세요:
{
  "message": "주말 응원 메시지 (따뜻하게, 80자 이내)",
  "quote": "아이들을 위한 짧은 명언 (작가 이름 포함)",
  "activities": ["추천 주말 활동 1", "추천 주말 활동 2", "추천 주말 활동 3"],
  "monday_preview": "다음 주 월요일이 기대될 한마디"
}`;

    const raw = await callPerplexity(user, system, 1000);
    const data = safeJson(raw) || {};
    cacheSet('weekend', data, date);
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─────────────────────────────────────────
//  설정 공개 (API 키 제외)
// ─────────────────────────────────────────
app.get('/api/config', (req, res) => {
  const { teacher, classroom } = config;
  res.json({ teacher, classroom });
});

// ─────────────────────────────────────────
//  서버 시작 (로컬) / Vercel export
// ─────────────────────────────────────────
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`\n🏫  교실 대시보드 서버 실행 중`);
    console.log(`   → http://localhost:${PORT}\n`);
    console.log(`   크롬에서 F11 (전체화면)으로 띄우세요!\n`);
  });
}

module.exports = app;
