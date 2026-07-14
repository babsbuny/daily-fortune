"use client";

import { useState } from "react";

const FORTUNES = [
  {
    keyword: "Momentum",
    kr: "추진력",
    score: 96,
    message: "망설이던 일을 시작하기 가장 좋은 날. 첫걸음이 곧 흐름이 됩니다.",
  },
  {
    keyword: "Serendipity",
    kr: "우연한 행운",
    score: 91,
    message: "계획에 없던 만남과 발견이 오늘의 선물이 됩니다. 우연을 환영하세요.",
  },
  {
    keyword: "Clarity",
    kr: "선명함",
    score: 88,
    message: "복잡했던 문제의 답이 또렷해집니다. 오늘 내린 판단을 믿어도 좋아요.",
  },
  {
    keyword: "Resonance",
    kr: "공명",
    score: 84,
    message: "당신의 말이 누군가에게 깊게 닿는 날. 진심을 아끼지 마세요.",
  },
  {
    keyword: "Gravity",
    kr: "끌어당김",
    score: 93,
    message: "원하는 것을 구체적으로 그릴수록 가까워집니다. 오늘은 끌어당기는 날.",
  },
  {
    keyword: "Stillness",
    kr: "고요",
    score: 76,
    message: "속도를 늦출수록 더 많이 보이는 날. 잠시 멈추는 것도 전진입니다.",
  },
  {
    keyword: "Bloom",
    kr: "만개",
    score: 95,
    message: "오래 준비해 온 것이 드디어 빛을 봅니다. 결실의 순간을 즐기세요.",
  },
  {
    keyword: "Tide",
    kr: "흐름",
    score: 81,
    message: "억지로 거스르지 마세요. 흐름에 올라타면 생각보다 멀리 갑니다.",
  },
  {
    keyword: "Spark",
    kr: "불꽃",
    score: 89,
    message: "번뜩이는 아이디어가 스치는 날. 떠오른 생각은 바로 기록해 두세요.",
  },
  {
    keyword: "Horizon",
    kr: "지평선",
    score: 86,
    message: "시야가 넓어지는 하루. 익숙한 길 대신 낯선 길을 택해 보세요.",
  },
];

const LUCKY_ITEMS = [
  "실버 링",
  "블랙 노트",
  "필름 카메라",
  "우롱차",
  "린넨 셔츠",
  "만년필",
  "레코드 한 장",
  "유리컵",
  "향초",
  "흰 운동화",
  "빈티지 시계",
  "책 한 권",
];

function pickRandom(list) {
  return list[Math.floor(Math.random() * list.length)];
}

export default function Home() {
  const [flipped, setFlipped] = useState(false);
  const [fortune, setFortune] = useState(null);
  const [item, setItem] = useState(null);

  const drawFortune = () => {
    if (flipped) {
      setFlipped(false);
      setTimeout(() => {
        setFortune(pickRandom(FORTUNES));
        setItem(pickRandom(LUCKY_ITEMS));
        setFlipped(true);
      }, 450);
    } else {
      setFortune(pickRandom(FORTUNES));
      setItem(pickRandom(LUCKY_ITEMS));
      setFlipped(true);
    }
  };

  const today = new Date();
  const dateLabel = `${today.getFullYear()}. ${String(today.getMonth() + 1).padStart(2, "0")}. ${String(today.getDate()).padStart(2, "0")}`;

  return (
    <main className="page">
      <header className="header">
        <span className="eyebrow">{dateLabel}</span>
        <h1 className="title">Daily Fortune</h1>
        <p className="subtitle">카드가 오늘 하루의 흐름을 읽어드립니다</p>
      </header>

      <div className="scene">
        <div className={`card ${flipped ? "is-flipped" : ""}`}>
          <div className="card-face card-front">
            <div className="card-frame">
              <span className="front-star">✦</span>
              <span className="front-label">DAILY&nbsp;FORTUNE</span>
              <span className="front-sub">tap to reveal</span>
            </div>
          </div>

          <div className="card-face card-back">
            {fortune && (
              <div className="card-frame back-frame">
                <div className="score-row">
                  <span className="score-label">LUCK</span>
                  <span className="score-value">{fortune.score}</span>
                </div>
                <div className="keyword-block">
                  <span className="keyword">{fortune.keyword}</span>
                  <span className="keyword-kr">{fortune.kr}</span>
                </div>
                <p className="message">{fortune.message}</p>
                <div className="divider" />
                <div className="lucky-row">
                  <span className="lucky-label">LUCKY ITEM</span>
                  <span className="lucky-value">{item}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <button className="draw-button" onClick={drawFortune}>
        {flipped ? "Draw Again" : "Draw a Card"}
      </button>
    </main>
  );
}
