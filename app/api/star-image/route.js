// OpenRouter 이미지 생성 모델로 운세에 어울리는 별/별자리 아트를 생성
// 카드 텍스트와 분리된 엔드포인트 — 이미지는 늦게 도착해도 카드에 서서히 입혀진다

export const maxDuration = 60;

export async function POST(request) {
  const apiKey = (process.env.OPENROUTER_API_KEY || "").replace(/\s+/g, "");
  if (!apiKey) {
    return Response.json({ error: "missing_api_key" }, { status: 503 });
  }

  let zodiac = null;
  let keyword = "";
  let hue = 260;
  try {
    const body = await request.json();
    if (typeof body.zodiac === "string" && body.zodiac.length <= 10) zodiac = body.zodiac;
    if (typeof body.keyword === "string" && body.keyword.length <= 30) keyword = body.keyword;
    if (Number.isFinite(Number(body.hue))) hue = ((Number(body.hue) % 360) + 360) % 360;
  } catch {}

  const subject = zodiac
    ? `the "${zodiac}" (Korean name of a western zodiac sign) constellation`
    : "a beautiful constellation of shimmering stars";

  const prompt = [
    `Elegant minimal illustration of ${subject} glowing in a deep midnight-blue night sky.`,
    `Delicate golden star points connected by thin constellation lines, tiny sparkling stars scattered around,`,
    `a subtle nebula tinted with a hue around ${hue} degrees, luxurious dark tarot-card aesthetic,`,
    keyword ? `evoking the mood of "${keyword}".` : "",
    "Vertical composition, dreamy, high contrast against darkness. No text, no letters, no watermark.",
  ].join(" ");

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
        model: process.env.OPENROUTER_IMAGE_MODEL || "google/gemini-2.5-flash-image",
        modalities: ["image", "text"],
        messages: [{ role: "user", content: prompt }],
      }),
      signal: AbortSignal.timeout(45000),
    });

    if (!res.ok) {
      const detail = await res.text();
      console.error("star-image error:", res.status, detail.slice(0, 300));
      return Response.json({ error: "image_failed" }, { status: 502 });
    }

    const data = await res.json();
    const image = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    if (!image) {
      console.error("star-image: no image in response");
      return Response.json({ error: "image_failed" }, { status: 502 });
    }

    return Response.json({ image });
  } catch (err) {
    console.error("star-image api error:", err?.message ?? err);
    return Response.json({ error: "image_failed" }, { status: 502 });
  }
}
