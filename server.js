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
    const user = `실제로 유명한 한국 동시 3편을 초등학교 4학년 학생들에게 소개해주세요.
반드시 실제 존재하는 시인이 쓴 동시를 정확하게 인용해야 합니다.
예시: 윤동주(별 헤는 밤, 반딧불), 박목월(나그네, 산도화), 김소월(진달래꽃), 정지용(향수, 유리창), 이원수(고향의 봄), 박두진, 조지훈 등의 작품.
아래 JSON 형식으로만 답하세요:
{
  "poems": [
    {
      "title": "제목",
      "poet": "시인 이름 (출생~사망연도)",
      "lines": ["시 첫 행", "두 번째 행", "세 번째 행", "네 번째 행", "다섯 번째 행"],
      "mood": "이 시의 분위기/느낌 (10자 이내)",
      "description": "아이들을 위한 한 줄 소개 (이 시가 왜 유명한지 포함)"
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
반드시 역사적으로 실제 기록된 유래(출처: 중국 고전, 역사서 등)에 근거한 사자성어를 선택하세요.
예: 사기(史記), 논어(論語), 한비자(韓非子), 전국책(戰國策) 등에 실제 수록된 이야기.
유래는 실제 역사적 인물이나 사건을 중심으로 구체적으로 설명해주세요.
아래 JSON 형식으로만 답하세요:
{
  "hanja": "사자성어 (한자 4글자)",
  "korean": "독음 (한글)",
  "meaning": "뜻 (초등생이 이해하기 쉽게, 1~2문장)",
  "origin": "출처 (예: 사기 중 어느 편, 어느 인물의 이야기)",
  "story": "실제 역사적 유래 이야기 (150자 이내, 구체적 인물·사건 포함, 쉽고 재미있게)",
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
//  목요일 – 명화 (이미지는 하드코딩, 설명만 AI)
// ─────────────────────────────────────────
const PAINTING_POOL = [
  { title_ko:'모나리자', title_en:'Mona Lisa', artist:'레오나르도 다 빈치', year:'1503~1519', style:'르네상스',
    image_url:'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/Mona_Lisa%2C_by_Leonardo_da_Vinci%2C_from_C2RMF_retouched.jpg/800px-Mona_Lisa%2C_by_Leonardo_da_Vinci%2C_from_C2RMF_retouched.jpg' },
  { title_ko:'별이 빛나는 밤', title_en:'The Starry Night', artist:'빈센트 반 고흐', year:'1889', style:'후기 인상주의',
    image_url:'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ea/Van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg/1280px-Van_Gogh_-_Starry_Night_-_Google_Art_Project.jpg' },
  { title_ko:'진주 귀걸이를 한 소녀', title_en:'Girl with a Pearl Earring', artist:'요하네스 베르메르', year:'1665', style:'바로크',
    image_url:'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0f/1665_Girl_with_a_Pearl_Earring.jpg/800px-1665_Girl_with_a_Pearl_Earring.jpg' },
  { title_ko:'절규', title_en:'The Scream', artist:'에드바르 뭉크', year:'1893', style:'표현주의',
    image_url:'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Edvard_Munch%2C_1893%2C_The_Scream%2C_oil%2C_tempera_and_pastel_on_cardboard%2C_91_x_73_cm%2C_National_Gallery_of_Norway.jpg/800px-Edvard_Munch%2C_1893%2C_The_Scream%2C_oil%2C_tempera_and_pastel_on_cardboard%2C_91_x_73_cm%2C_National_Gallery_of_Norway.jpg' },
  { title_ko:'키스', title_en:'The Kiss', artist:'구스타프 클림트', year:'1907~1908', style:'아르 누보',
    image_url:'https://upload.wikimedia.org/wikipedia/commons/thumb/4/40/The_Kiss_-_Gustav_Klimt_-_Google_Cultural_Institute.jpg/1024px-The_Kiss_-_Gustav_Klimt_-_Google_Cultural_Institute.jpg' },
  { title_ko:'이삭 줍는 사람들', title_en:'The Gleaners', artist:'장-프랑수아 밀레', year:'1857', style:'사실주의',
    image_url:'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1f/Jean-Fran%C3%A7ois_Millet_-_Gleaners_-_Google_Art_Project.jpg/1280px-Jean-Fran%C3%A7ois_Millet_-_Gleaners_-_Google_Art_Project.jpg' },
  { title_ko:'수련', title_en:'Water Lilies', artist:'클로드 모네', year:'1906', style:'인상주의',
    image_url:'https://upload.wikimedia.org/wikipedia/commons/thumb/a/aa/Claude_Monet_-_Water_Lilies_-_1906%2C_Ryerson.jpg/1280px-Claude_Monet_-_Water_Lilies_-_1906%2C_Ryerson.jpg' },
  { title_ko:'해바라기', title_en:'Sunflowers', artist:'빈센트 반 고흐', year:'1888', style:'후기 인상주의',
    image_url:'https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/Vincent_van_Gogh_-_Sunflowers_-_VGM_F458.jpg/1024px-Vincent_van_Gogh_-_Sunflowers_-_VGM_F458.jpg' },
  { title_ko:'씨 뿌리는 사람', title_en:'The Sower', artist:'장-프랑수아 밀레', year:'1850', style:'사실주의',
    image_url:'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/Jean-Fran%C3%A7ois_Millet_-_The_Sower_-_Google_Art_Project.jpg/1024px-Jean-Fran%C3%A7ois_Millet_-_The_Sower_-_Google_Art_Project.jpg' },
  { title_ko:'기억의 지속', title_en:'The Persistence of Memory', artist:'살바도르 달리', year:'1931', style:'초현실주의',
    image_url:'https://upload.wikimedia.org/wikipedia/en/d/dd/The_Persistence_of_Memory.jpg' },
  { title_ko:'밤의 카페 테라스', title_en:'Café Terrace at Night', artist:'빈센트 반 고흐', year:'1888', style:'후기 인상주의',
    image_url:'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b2/Van_Gogh_-_Terrasse_des_Caf%C3%A9s_an_der_Place_du_Forum_in_Arles_am_Abend1.jpeg/1024px-Van_Gogh_-_Terrasse_des_Caf%C3%A9s_an_der_Place_du_Forum_in_Arles_am_Abend1.jpeg' },
  { title_ko:'아테네 학당', title_en:'The School of Athens', artist:'라파엘로', year:'1509~1511', style:'르네상스',
    image_url:'https://upload.wikimedia.org/wikipedia/commons/thumb/4/49/%22The_School_of_Athens%22_by_Raffaello_Sanzio_da_Urbino.jpg/1280px-%22The_School_of_Athens%22_by_Raffaello_Sanzio_da_Urbino.jpg' },
  { title_ko:'세례 요한을 가리키는 성모 마리아', title_en:'La Belle Jardinière', artist:'라파엘로', year:'1507~1508', style:'르네상스',
    image_url:'https://upload.wikimedia.org/wikipedia/commons/thumb/6/60/Raffaello_-_La_belle_jardi%C3%A8re.jpg/800px-Raffaello_-_La_belle_jardi%C3%A8re.jpg' },
  { title_ko:'진주 귀걸이를 한 소녀 (베르메르 2)', title_en:'The Milkmaid', artist:'요하네스 베르메르', year:'1657~1658', style:'바로크',
    image_url:'https://upload.wikimedia.org/wikipedia/commons/thumb/2/20/Johannes_Vermeer_-_Het_melkmeisje_-_Google_Art_Project.jpg/1024px-Johannes_Vermeer_-_Het_melkmeisje_-_Google_Art_Project.jpg' },
];

app.get('/api/thursday', async (req, res) => {
  const date = req.query.date || todayKey();
  const cached = cacheGet('thursday', date);
  if (cached) return res.json(cached);

  // 날짜 기반으로 명화 선택 (날짜 숫자 합산으로 고정 선택)
  const dateNum = date.replace(/-/g, '').split('').reduce((s, c) => s + parseInt(c), 0);
  const painting = PAINTING_POOL[dateNum % PAINTING_POOL.length];

  try {
    const system = `당신은 어린이 미술 선생님입니다. 반드시 JSON 형식으로만 응답하세요.`;
    const user = `다음 명화를 초등학교 4학년 눈높이로 소개해주세요.
그림: ${painting.title_ko} (${painting.title_en})
작가: ${painting.artist}, ${painting.year}, ${painting.style}
아래 JSON 형식으로만 답하세요:
{
  "description": "그림 설명 (아이들이 쉽게 이해할 수 있게, 180자 이내, 색채·구도·분위기 포함)",
  "hidden_story": "이 그림에 숨겨진 재미있는 이야기나 비밀 (100자 이내)",
  "question": "아이들의 상상력을 자극하는 질문 (이 그림을 보면서 무엇을 느끼는지)"
}`;

    const raw = await callPerplexity(user, system, 1500);
    const aiData = safeJson(raw) || {};
    const data = { ...painting, ...aiData };
    cacheSet('thursday', data, date);
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ─────────────────────────────────────────
//  금요일 – 역사 속 오늘
// ─────────────────────────────────────────
app.get('/api/friday', async (req, res) => {
  const date = req.query.date || todayKey();
  const cached = cacheGet('friday', date);
  if (cached) return res.json(cached);

  const [, month, day] = date.split('-').map(Number);

  try {
    const system = `당신은 역사 선생님입니다. 반드시 JSON 형식으로만 응답하세요.`;
    const user = `${month}월 ${day}일, 세계 역사와 한국 역사에서 실제로 일어난 흥미로운 사건 5가지를 초등학교 4학년 눈높이로 알려주세요.
각 사건은 반드시 정확한 연도와 구체적인 숫자(인원, 거리, 기간, 규모 등)를 포함해야 합니다.
아래 JSON 형식으로만 답하세요:
{
  "category": "역사 속 오늘",
  "categoryEmoji": "🏛️",
  "dateLabel": "${month}월 ${day}일",
  "facts": [
    {
      "year": "연도 (예: 1969년)",
      "title": "사건을 한 문장으로 표현 (구체적 숫자 포함)",
      "content": "사건 내용 (100자 이내, 정확한 수치·인물·배경 포함, 초등생 눈높이)",
      "emoji": "사건과 관련된 이모지",
      "wow": "이 사건이 특별한 이유 한 줄 (숫자나 기록 포함)"
    }
  ]
}`;

    const raw = await callPerplexity(user, system, 2500);
    const data = safeJson(raw) || { category: '역사 속 오늘', categoryEmoji: '🏛️', dateLabel: `${month}월 ${day}일`, facts: [] };
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
