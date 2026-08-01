"use client";

import { useEffect, useState } from "react";

const FORTUNES = [
  {
    keyword: "Momentum",
    kr: "추진력",
    score: 96,
    hue: 14,
    message: "망설이던 일을 시작하기 가장 좋은 날. 첫걸음이 곧 흐름이 됩니다.",
  },
  {
    keyword: "Serendipity",
    kr: "우연한 행운",
    score: 91,
    hue: 268,
    message: "계획에 없던 만남과 발견이 오늘의 선물이 됩니다. 우연을 환영하세요.",
  },
  {
    keyword: "Clarity",
    kr: "선명함",
    score: 88,
    hue: 205,
    message: "복잡했던 문제의 답이 또렷해집니다. 오늘 내린 판단을 믿어도 좋아요.",
  },
  {
    keyword: "Resonance",
    kr: "공명",
    score: 84,
    hue: 330,
    message: "당신의 말이 누군가에게 깊게 닿는 날. 진심을 아끼지 마세요.",
  },
  {
    keyword: "Gravity",
    kr: "끌어당김",
    score: 93,
    hue: 45,
    message: "원하는 것을 구체적으로 그릴수록 가까워집니다. 오늘은 끌어당기는 날.",
  },
  {
    keyword: "Stillness",
    kr: "고요",
    score: 76,
    hue: 160,
    message: "속도를 늦출수록 더 많이 보이는 날. 잠시 멈추는 것도 전진입니다.",
  },
  {
    keyword: "Bloom",
    kr: "만개",
    score: 95,
    hue: 305,
    message: "오래 준비해 온 것이 드디어 빛을 봅니다. 결실의 순간을 즐기세요.",
  },
  {
    keyword: "Tide",
    kr: "흐름",
    score: 81,
    hue: 190,
    message: "억지로 거스르지 마세요. 흐름에 올라타면 생각보다 멀리 갑니다.",
  },
  {
    keyword: "Spark",
    kr: "불꽃",
    score: 89,
    hue: 28,
    message: "번뜩이는 아이디어가 스치는 날. 떠오른 생각은 바로 기록해 두세요.",
  },
  {
    keyword: "Horizon",
    kr: "지평선",
    score: 86,
    hue: 232,
    message: "시야가 넓어지는 하루. 익숙한 길 대신 낯선 길을 택해 보세요.",
  },
];

const LUCKY_ITEMS = [
  { name: "실버 링", emoji: "💍" },
  { name: "블랙 노트", emoji: "📓" },
  { name: "필름 카메라", emoji: "📷" },
  { name: "우롱차", emoji: "🍵" },
  { name: "린넨 셔츠", emoji: "👔" },
  { name: "만년필", emoji: "🖋️" },
  { name: "레코드 한 장", emoji: "💿" },
  { name: "유리컵", emoji: "🥃" },
  { name: "향초", emoji: "🕯️" },
  { name: "흰 운동화", emoji: "👟" },
  { name: "빈티지 시계", emoji: "⌚" },
  { name: "책 한 권", emoji: "📖" },
];

function pickRandom(list) {
  return list[Math.floor(Math.random() * list.length)];
}

const STORAGE_KEY = "fortune-history";

// Supabase 연결 정보 (없으면 localStorage만 사용)
const SUPA_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPA_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supaEnabled = Boolean(SUPA_URL && SUPA_KEY);
const supaHeaders = {
  apikey: SUPA_KEY,
  "Content-Type": "application/json",
};

async function fetchHistoryFromSupabase() {
  const res = await fetch(
    `${SUPA_URL}/rest/v1/fortune_history?select=created_at,keyword,kr,score,item&order=created_at.desc&limit=50`,
    { headers: supaHeaders }
  );
  if (!res.ok) throw new Error(`supabase select failed: ${res.status}`);
  const rows = await res.json();
  return rows.map((r) => ({
    at: r.created_at,
    keyword: r.keyword,
    kr: r.kr,
    score: r.score,
    item: r.item,
  }));
}

function insertHistoryToSupabase(entry) {
  return fetch(`${SUPA_URL}/rest/v1/fortune_history`, {
    method: "POST",
    headers: supaHeaders,
    body: JSON.stringify({
      keyword: entry.keyword,
      kr: entry.kr,
      score: entry.score,
      item: entry.item,
    }),
  });
}

function formatTime(iso) {
  const d = new Date(iso);
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

export default function Home() {
  const [flipped, setFlipped] = useState(false);
  const [fortune, setFortune] = useState(null);
  const [item, setItem] = useState(null);
  const [history, setHistory] = useState([]);

  // 기록 불러오기: Supabase가 연결돼 있으면 서버에서, 아니면 localStorage에서
  // (localStorage는 브라우저에만 있으므로 마운트 후에 불러온다 — SSR 하이드레이션 오류 방지)
  useEffect(() => {
    const loadLocal = () => {
      try {
        setHistory(JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"));
      } catch {
        setHistory([]);
      }
    };
    if (supaEnabled) {
      fetchHistoryFromSupabase().then(setHistory).catch(loadLocal);
    } else {
      loadLocal();
    }
  }, []);

  const draw = () => {
    const f = pickRandom(FORTUNES);
    const it = pickRandom(LUCKY_ITEMS);
    setFortune(f);
    setItem(it);
    const entry = {
      at: new Date().toISOString(),
      keyword: f.keyword,
      kr: f.kr,
      score: f.score,
      item: `${it.emoji} ${it.name}`,
    };
    if (supaEnabled) {
      insertHistoryToSupabase(entry).catch(() => {});
    }
    setHistory((prev) => {
      const next = [entry, ...prev];
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const drawFortune = () => {
    if (flipped) {
      setFlipped(false);
      setTimeout(() => {
        draw();
        setFlipped(true);
      }, 450);
    } else {
      draw();
      setFlipped(true);
    }
  };

  const today = new Date();
  const dateLabel = `${today.getFullYear()}. ${String(today.getMonth() + 1).padStart(2, "0")}. ${String(today.getDate()).padStart(2, "0")}`;

  return (
    <main className="page">
      <header className="header">
        <span className="date-chip">TODAY · {dateLabel}</span>
        <h1 className="title">
          Daily <em>Fortune</em>
        </h1>
        <p className="subtitle">카드가 오늘 하루의 흐름을 읽어드립니다</p>
      </header>

      <div className="scene">
        <div
          className={`card ${flipped ? "is-flipped" : ""}`}
          style={fortune ? { "--h": fortune.hue, "--score": fortune.score } : undefined}
        >
          <div className="card-face card-front">
            <div className="holo" />
            <div className="front-ring">
              <span className="front-star">✦</span>
            </div>
            <span className="front-label">DAILY FORTUNE</span>
            <span className="front-sub">tap to reveal</span>
          </div>

          <div className="card-face card-back">
            <div className="holo" />
            {fortune && (
              <>
                <div className="luck-ring">
                  <div className="luck-ring-inner">
                    <strong>{fortune.score}</strong>
                    <span>LUCK</span>
                  </div>
                </div>

                <div className="keyword-block">
                  <span className="keyword">{fortune.keyword}</span>
                  <span className="keyword-kr">{fortune.kr}</span>
                </div>

                <p className="message">{fortune.message}</p>

                <div className="lucky-chip">
                  <span className="lucky-emoji">{item.emoji}</span>
                  <span className="lucky-texts">
                    <span className="lucky-label">LUCKY ITEM</span>
                    <span className="lucky-name">{item.name}</span>
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <button className="draw-button" onClick={drawFortune}>
        {flipped ? "다시 뽑기" : "운세 뽑기"}
      </button>

      <section className="history">
        <h2 className="history-title">내 운세 기록</h2>
        {history.length === 0 ? (
          <p className="history-empty">아직 뽑은 운세가 없습니다. 첫 카드를 뽑아보세요!</p>
        ) : (
          <div className="history-table-wrap">
            <table className="history-table">
              <thead>
                <tr>
                  <th>뽑은 시각</th>
                  <th>운세</th>
                  <th>지수</th>
                  <th>행운의 아이템</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h, i) => (
                  <tr key={h.at + i}>
                    <td className="h-time">{formatTime(h.at)}</td>
                    <td className="h-keyword">
                      {h.keyword} <span className="h-kr">{h.kr}</span>
                    </td>
                    <td className="h-score">{h.score}</td>
                    <td className="h-item">{h.item}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
