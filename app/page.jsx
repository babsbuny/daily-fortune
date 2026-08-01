"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabase";

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
const BIRTH_KEY = "fortune-birth";

// 운세에 어울리는 별 이미지 생성 — 실패해도 카드에는 영향 없음
async function fetchStarImage(zodiac, keyword, hue, item) {
  try {
    const res = await fetch("/api/star-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ zodiac, keyword, hue, item }),
    });
    if (!res.ok) return null;
    const d = await res.json();
    return typeof d.image === "string" && d.image.startsWith("data:image") ? d.image : null;
  } catch {
    return null;
  }
}

// 파팡~!! 폭죽 입자 생성 — 뽑을 때마다 랜덤으로 사방에 터진다
const BURST_COLORS = ["#ffe9a8", "#ffd93d", "#c46bff", "#7cd8ff", "#ff9fd6", "#ffffff"];

function makeBurst() {
  const parts = [];
  for (let i = 0; i < 44; i++) {
    const angle = Math.random() * Math.PI * 2;
    const dist = 70 + Math.random() * 150;
    parts.push({
      tx: Math.round(Math.cos(angle) * dist),
      ty: Math.round(Math.sin(angle) * dist * 0.85),
      size: 3 + Math.random() * 4,
      delay: Math.random() * 0.5,
      color: BURST_COLORS[Math.floor(Math.random() * BURST_COLORS.length)],
      star: Math.random() < 0.22,
    });
  }
  return parts;
}

// AI(/api/fortune) 호출 — 실패하면 null을 돌려주고 로컬 목록으로 폴백
async function fetchAiFortune(birthDate) {
  try {
    const res = await fetch("/api/fortune", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ birthDate: birthDate || null }),
    });
    if (!res.ok) return null;
    const d = await res.json();
    if (!d.keyword || !d.message) return null;
    return {
      fortune: {
        ai: true,
        keyword: d.keyword,
        kr: d.kr,
        score: Math.min(99, Math.max(1, Number(d.score) || 80)),
        hue: ((Number(d.hue) % 360) + 360) % 360,
        message: d.message,
        zodiac: d.zodiac || null,
      },
      item: { name: d.item_name || "네잎클로버", emoji: d.item_emoji || "🍀" },
    };
  } catch {
    return null;
  }
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
  const [birth, setBirth] = useState("");
  const [drawing, setDrawing] = useState(false);
  const [celebrate, setCelebrate] = useState(false);
  const [burst, setBurst] = useState([]);
  const drawIdRef = useRef(0);

  // 저장된 생년월일 불러오기
  useEffect(() => {
    try {
      setBirth(localStorage.getItem(BIRTH_KEY) || "");
    } catch {}
  }, []);

  const onBirthChange = (value) => {
    setBirth(value);
    try {
      localStorage.setItem(BIRTH_KEY, value);
    } catch {}
  };

  // 로그인 상태
  const [user, setUser] = useState(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authMsg, setAuthMsg] = useState("");
  const [authBusy, setAuthBusy] = useState(false);

  // 세션 감지: 로그인/로그아웃 시 user 상태 자동 갱신
  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  // 기록 불러오기: 로그인 시 내 기록만, 비로그인 시 익명 기록만
  useEffect(() => {
    const loadLocal = () => {
      try {
        setHistory(JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"));
      } catch {
        setHistory([]);
      }
    };
    if (!supabase) {
      loadLocal();
      return;
    }
    let query = supabase
      .from("fortune_history")
      .select("created_at,keyword,kr,score,item")
      .order("created_at", { ascending: false })
      .limit(50);
    query = user ? query.eq("user_id", user.id) : query.is("user_id", null);
    query.then(({ data, error }) => {
      if (error) loadLocal();
      else setHistory(data.map((r) => ({ at: r.created_at, ...r })));
    });
  }, [user]);

  const draw = async () => {
    // 1순위: AI 생성(점성술 기반), 실패 시 로컬 목록으로 폴백
    const drawId = ++drawIdRef.current;
    const ai = await fetchAiFortune(birth);
    const f = ai ? ai.fortune : pickRandom(FORTUNES);
    const it = ai ? ai.item : pickRandom(LUCKY_ITEMS);
    setFortune(f);
    setItem(it);
    if (ai) {
      // 별 이미지는 비동기로 생성해서 도착하면 카드 액자에 서서히 담긴다
      fetchStarImage(f.zodiac, f.keyword, f.hue, it.name).then((image) => {
        if (image && drawIdRef.current === drawId) {
          setFortune((prev) => (prev ? { ...prev, image } : prev));
        }
      });
    }
    const entry = {
      at: new Date().toISOString(),
      keyword: f.keyword,
      kr: f.kr,
      score: f.score,
      item: `${it.emoji} ${it.name}`,
    };
    if (supabase) {
      // user_id는 DB 기본값 auth.uid()로 자동 지정됨
      supabase
        .from("fortune_history")
        .insert({ keyword: entry.keyword, kr: entry.kr, score: entry.score, item: entry.item })
        .then(() => {});
    }
    setHistory((prev) => {
      const next = [entry, ...prev];
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const reveal = () => {
    // 짜잔! — 카드가 한 바퀴 더 돌며 폭죽이 파팡 터진다
    setFlipped(true);
    setBurst(makeBurst());
    setCelebrate(true);
    setTimeout(() => setCelebrate(false), 1800);
  };

  const drawFortune = async () => {
    if (drawing) return;
    setDrawing(true);
    if (flipped) {
      setFlipped(false);
      await new Promise((r) => setTimeout(r, 450));
      await draw();
      reveal();
    } else {
      await draw();
      reveal();
    }
    setDrawing(false);
  };

  const signIn = async () => {
    setAuthBusy(true);
    setAuthMsg("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setAuthBusy(false);
    if (error) setAuthMsg("로그인 실패: 이메일 또는 비밀번호를 확인하세요");
    else {
      setAuthOpen(false);
      setEmail("");
      setPassword("");
    }
  };

  const signUp = async () => {
    setAuthBusy(true);
    setAuthMsg("");
    const { data, error } = await supabase.auth.signUp({ email, password });
    setAuthBusy(false);
    if (error) setAuthMsg(`가입 실패: ${error.message}`);
    else if (data.session) {
      setAuthOpen(false);
      setEmail("");
      setPassword("");
    } else {
      setAuthMsg("가입 완료! 메일함에서 확인 링크를 눌러주세요");
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const today = new Date();
  const dateLabel = `${today.getFullYear()}. ${String(today.getMonth() + 1).padStart(2, "0")}. ${String(today.getDate()).padStart(2, "0")}`;

  return (
    <main className="page">
      {supabase && (
        <div className="auth-corner">
          {user ? (
            <>
              <span className="auth-email">✨ {user.email}</span>
              <button className="auth-link" onClick={signOut}>
                로그아웃
              </button>
            </>
          ) : (
            <button className="auth-link" onClick={() => setAuthOpen((v) => !v)}>
              로그인
            </button>
          )}
        </div>
      )}

      <header className="header">
        <span className="date-chip">TODAY · {dateLabel}</span>
        <h1 className="title">
          Daily <em>Fortune</em>
        </h1>
        <p className="subtitle">카드가 오늘 하루의 흐름을 읽어드립니다</p>
      </header>

      {supabase && authOpen && !user && (
        <form
          className="auth-form"
          onSubmit={(e) => {
            e.preventDefault();
            signIn();
          }}
        >
          <input
            className="auth-input"
            type="email"
            placeholder="이메일"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            className="auth-input"
            type="password"
            placeholder="비밀번호 (6자 이상)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
            required
          />
          <div className="auth-buttons">
            <button className="auth-submit" type="submit" disabled={authBusy}>
              로그인
            </button>
            <button className="auth-submit ghost" type="button" onClick={signUp} disabled={authBusy}>
              회원가입
            </button>
          </div>
          {authMsg && <p className="auth-msg">{authMsg}</p>}
        </form>
      )}

      <div className={`scene ${celebrate ? "celebrate" : ""}`}>
        {celebrate &&
          burst.map((p, i) => (
            <span
              key={i}
              className={`pop ${p.star ? "pop-star" : "pop-dot"}`}
              style={{
                "--tx": `${p.tx}px`,
                "--ty": `${p.ty}px`,
                width: p.star ? undefined : `${p.size}px`,
                height: p.star ? undefined : `${p.size}px`,
                fontSize: p.star ? `${p.size + 5}px` : undefined,
                color: p.color,
                animationDelay: `${p.delay}s`,
              }}
            >
              {p.star ? "✦" : ""}
            </span>
          ))}
        <div
          className={`card ${flipped ? "is-flipped" : ""} ${celebrate ? "tada" : ""}`}
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

                {fortune.ai && (
                  <div className="art-frame">
                    {fortune.image ? (
                      <img src={fortune.image} alt="오늘의 운세 그림" className="art-img" />
                    ) : (
                      <div className="art-loading">✦</div>
                    )}
                  </div>
                )}

                <div className="keyword-block">
                  <span className="keyword">{fortune.keyword}</span>
                  <span className="keyword-kr">{fortune.kr}</span>
                  {fortune.zodiac && <span className="zodiac-chip">✨ {fortune.zodiac}의 오늘</span>}
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

      <div className="birth-row">
        <label className="birth-label" htmlFor="birth-input">
          생년월일 (선택 · 별자리 운세)
        </label>
        <input
          id="birth-input"
          className="birth-input"
          type="date"
          value={birth}
          onChange={(e) => onBirthChange(e.target.value)}
        />
      </div>

      <button className="draw-button" onClick={drawFortune} disabled={drawing}>
        {drawing ? "별자리를 읽는 중…" : flipped ? "다시 뽑기" : "운세 뽑기"}
      </button>

      <section className="history">
        <h2 className="history-title">{user ? `${user.email}의 운세 기록` : "내 운세 기록"}</h2>
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
