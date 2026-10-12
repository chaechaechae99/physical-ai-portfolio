"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { PageTitle } from "@/components/ui";
import {
  POSITIONS, TOPICS, TREND_LABEL, keywordsOf, readSpread, shuffleDeck, topicLine,
  type Drawn, type Topic,
} from "@/lib/tarot";

const img = (id: number) => `/tarot/${String(id).padStart(2, "0")}.jpg`;

export function Tarot() {
  const [deck, setDeck] = useState<Drawn[]>([]);
  const [picked, setPicked] = useState<number[]>([]); // deck index
  const [flipped, setFlipped] = useState<boolean[]>([false, false, false]);
  const [topic, setTopic] = useState<Topic>("all");
  const [question, setQuestion] = useState("");

  // 섞기는 클라이언트에서만 (서버 렌더와 결과가 달라지지 않게)
  useEffect(() => setDeck(shuffleDeck()), []);

  const reset = () => {
    setDeck(shuffleDeck());
    setPicked([]);
    setFlipped([false, false, false]);
  };

  const pick = (i: number) => {
    if (picked.length >= 3 || picked.includes(i)) return;
    const n = picked.length;
    setPicked([...picked, i]);
    setTimeout(() => setFlipped((f) => f.map((v, k) => (k === n ? true : v))), 40);
  };

  const spread = picked.map((i) => deck[i]);
  const done = spread.length === 3;
  const reading = done ? readSpread(spread, topic, question) : null;

  return (
    <>
      <PageTitle title="오늘의 타로" lead="주제를 고르고, 마음속 질문을 떠올린 뒤 끌리는 카드 3장을 골라보세요." />

      <div className="chips">
        {TOPICS.map((t) => (
          <button key={t.id} type="button" className="chip" aria-pressed={t.id === topic} onClick={() => setTopic(t.id)}>{t.label}</button>
        ))}
      </div>
      <input
        id="tarot-q"
        className="qinput mt"
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder="질문이 있다면 적어 주세요 (선택) 예) 이번 주에 고백해도 될까?"
        aria-label="타로 질문"
        maxLength={80}
      />

      <div className="spread mt">
        {POSITIONS.map((label, k) => {
          const d = spread[k];
          return (
            <div className="slot" key={label}>
              <div className="lbl">{label}</div>
              <div className="flip-wrap">
                <div className={`flip${flipped[k] ? " on" : ""}`}>
                  <div className="face front" />
                  <div className="face back">
                    {d && (
                      <>
                        <Image loading="eager" src={img(d.card.id)} alt={`${d.card.name} 카드${d.reversed ? " (역방향)" : ""}`} fill sizes="(max-width: 520px) 33vw, 300px" className={d.reversed ? "rev" : undefined} />
                        <div className="cap">
                          <b>{d.card.num} · {d.card.name}</b>
                          {d.reversed ? "역방향 · " : ""}{keywordsOf(d).slice(0, 2).join(" · ")}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {!done && (
        <div className="fan" aria-label="카드 더미">
          {deck.map((_, i) => (
            <button key={i} type="button" className="back-card" disabled={picked.includes(i)} onClick={() => pick(i)} aria-label={`카드 ${i + 1} 고르기`} />
          ))}
        </div>
      )}

      {reading && (
        <div className="reading">
          <div className="panel">
            <div className="sec-h" style={{ marginBottom: 10 }}>
              <h2 style={{ fontSize: 22 }}>종합 해설</h2>
              <span className={`trend ${reading.trend}`}>
                {reading.trend === "up" ? "↗" : reading.trend === "down" ? "↘" : "→"} 흐름 {TREND_LABEL[reading.trend]}
              </span>
            </div>
            {reading.answer && (
              <div className="qa" style={{ marginBottom: 14 }}>
                <small>질문 · {question.trim()}</small>
                <p style={{ margin: "4px 0 0", fontWeight: 600 }}>{reading.answer}</p>
              </div>
            )}
            <div className="summary">
              {reading.summary.map((s) => <p key={s}>{s}</p>)}
            </div>
          </div>

          <div className="panel items">
            {spread.map((d, k) => (
              <div key={k}>
                <h4>{POSITIONS[k]} · {d.card.name}{d.reversed ? " (역방향)" : ""}</h4>
                <p>{d.reversed ? d.card.reversed : d.card.upright}</p>
              </div>
            ))}
          </div>

          <div className="panel items">
            <div><h4>연애</h4><p>{topicLine(spread[1], "love")}</p></div>
            <div><h4>일 · 학업</h4><p>{topicLine(spread[1], "work")}</p></div>
            <div><h4>금전</h4><p>{topicLine(spread[1], "money")}</p></div>
          </div>

          <div className="panel">
            <h3 className="panel-h">오늘의 조언</h3>
            <p style={{ margin: "0 0 12px" }}>{reading.advice}</p>
            <div className="kw3">{reading.keywords.map((k) => <span key={k}>#{k}</span>)}</div>
          </div>

          <div className="ctrl"><button type="button" className="btn ghost" onClick={reset}>다시 섞기</button></div>
        </div>
      )}

      <p className="note">메이저 아르카나 22장 · 역방향 포함. 카드 이미지: Rider-Waite 타로(1909, 퍼블릭 도메인). 재미로만 봐주세요.</p>
    </>
  );
}
