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
  let kr = "";
  let message = "";
  let item = "";
  let hue = 260;
  try {
    const body = await request.json();
    if (typeof body.zodiac === "string" && body.zodiac.length <= 10) zodiac = body.zodiac;
    if (typeof body.keyword === "string" && body.keyword.length <= 30) keyword = body.keyword;
    if (typeof body.kr === "string" && body.kr.length <= 20) kr = body.kr;
    if (typeof body.message === "string" && body.message.length <= 200) message = body.message;
    if (typeof body.item === "string" && body.item.length <= 20) item = body.item;
    if (Number.isFinite(Number(body.hue))) hue = ((Number(body.hue) % 360) + 360) % 360;
  } catch {}

  // 운세 '내용'을 상징하는 구체적인 사물이 주인공 — 추상화 금지, 별자리 없음
  const prompt = [
    `Create one bold symbolic illustration that captures this Korean daily fortune:`,
    message ? `"${message}"` : `theme "${keyword || "hope"}${kr ? ` (${kr})` : ""}".`,
    `Pick ONE concrete, instantly recognizable real-world object or scene that symbolizes the fortune's message or the guidance it gives the reader for today${keyword ? ` — the theme is "${keyword}"${kr ? ` (${kr})` : ""}` : ""}`,
    `(for example: if the fortune says to start something, an opening door or a sunrise path; if it says to rest, a hammock under a tree; if it says to connect with people, two clinking teacups — something you can name at a glance that matches THIS fortune's advice).`,
    `Make it the hero of the composition, big and centered.`,
    item ? `Also include the lucky item "${item}" (Korean word) as a clearly visible object in the scene.` : "",
    `ABSOLUTELY NOT abstract art: no abstract swirls, no vague shapes, no constellations, no star maps, no zodiac imagery.`,
    `STYLE: retro-funky 1970s psychedelic poster art — groovy wavy lines, bold thick outlines,`,
    `flat vivid colors keyed around hue ${hue} degrees with orange/cream/teal retro accents,`,
    `halftone dots and subtle grain like a vintage screen print, sunburst rays, funky and playful energy.`,
    "Wide horizontal composition. No text, no letters, no watermark.",
  ]
    .filter(Boolean)
    .join(" ");

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
