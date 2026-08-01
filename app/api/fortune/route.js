// OpenRouter(OpenAI 호환 API)로 오늘의 운세를 생성하는 서버 라우트
// API 키는 서버 환경변수(OPENROUTER_API_KEY)에서만 읽는다 — 브라우저에 노출되지 않음

const SYSTEM_PROMPT = `너는 '오늘의 운세' 카드를 만들어 주는 다정한 점성술사다.
- 재미와 긍정적인 하루의 시작을 위한 엔터테인먼트 콘텐츠를 만든다. 의료·금전·법률 조언은 하지 않는다.
- 생년월일이 주어지면 서양 점성술을 근거로 삼아라: 별자리를 계산하고, 그 별자리의 오늘 흐름을 메시지에 한 구절 자연스럽게 녹여라. (예: "사자자리의 태양이 당신 편에 서는 날…")
- 생년월일이 없으면 보편적이지만 구체적인 하루 운세를 만들고 zodiac은 null로 하라.
- 매번 키워드·아이템·메시지를 다양하고 참신하게 바꿔라. 흔한 표현의 반복을 피하라.

반드시 아래 형식의 JSON 객체 하나만 출력하라. 설명, 마크다운, 코드펜스 없이 순수 JSON만:
{
  "keyword": "영문 한 단어 키워드 (예: Momentum)",
  "kr": "키워드의 한글 표현 2~6자",
  "score": 55~99 사이의 정수 (행운 지수, 다양하게),
  "message": "한국어 존댓말 1~2문장, 40~80자",
  "item_name": "행운의 아이템 이름, 한국어 2~8자",
  "item_emoji": "이모지 1개",
  "hue": 0~360 사이의 정수 (오늘의 색상),
  "zodiac": "별자리 이름 (예: 사자자리) 또는 null"
}`;

const THEME_HINTS = [
  "일과 도전", "관계와 만남", "휴식과 회복", "창작과 영감", "배움과 성장",
  "우연과 발견", "정리와 비움", "용기와 시작", "감사와 여유", "집중과 몰입",
];

function extractJson(text) {
  // 모델이 코드펜스나 여분 텍스트를 붙여도 JSON 본문만 골라 파싱
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("no JSON in response");
  return JSON.parse(match[0]);
}

export async function POST(request) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "missing_api_key" }, { status: 503 });
  }

  let birthDate = null;
  try {
    const body = await request.json();
    if (typeof body.birthDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.birthDate)) {
      birthDate = body.birthDate;
    }
  } catch {}

  const today = new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  }).format(new Date());

  const hint = THEME_HINTS[Math.floor(Math.random() * THEME_HINTS.length)];

  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://daily-fortune-rho.vercel.app",
        "X-Title": "Daily Fortune",
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL || "anthropic/claude-haiku-4.5",
        temperature: 1.0,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: [
              `오늘은 ${today}.`,
              birthDate ? `사용자의 생년월일: ${birthDate} (양력).` : "생년월일 정보 없음.",
              `오늘의 테마 힌트: ${hint}.`,
              "오늘의 운세 카드 1장을 생성해줘.",
            ].join("\n"),
          },
        ],
      }),
    });

    if (!res.ok) {
      const detail = await res.text();
      console.error("openrouter error:", res.status, detail.slice(0, 300));
      return Response.json({ error: "generation_failed" }, { status: 502 });
    }

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content;
    if (!text) throw new Error("empty completion");

    return Response.json(extractJson(text));
  } catch (err) {
    console.error("fortune api error:", err?.message ?? err);
    return Response.json({ error: "generation_failed" }, { status: 502 });
  }
}
