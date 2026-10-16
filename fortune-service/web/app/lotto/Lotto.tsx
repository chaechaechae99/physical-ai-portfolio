"use client";

import { useEffect, useRef, useState } from "react";
import { PageTitle } from "@/components/ui";

type Set = { main: number[]; bonus: number };

const cls = (n: number) => (n <= 10 ? "b1" : n <= 20 ? "b2" : n <= 30 ? "b3" : n <= 40 ? "b4" : "b5");
const STEP = 0.18; // 공 하나 나오는 간격(초)

function drawSet(): Set {
  const pool = Array.from({ length: 45 }, (_, i) => i + 1);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return { main: pool.slice(0, 6).sort((a, b) => a - b), bonus: pool[6] };
}

type Dot = { n: number; left: number; top: number; dx: number; dy: number; delay: number };

export function Lotto() {
  const [count, setCount] = useState(3);
  const [sets, setSets] = useState<Set[]>([]);
  const [spinning, setSpinning] = useState(false);
  const [dots, setDots] = useState<Dot[]>([]);
  const [round, setRound] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const draw = (n = count) => {
    if (timer.current) clearTimeout(timer.current);
    setSets(Array.from({ length: n }, drawSet));
    setRound((r) => r + 1);
    setSpinning(true);
    timer.current = setTimeout(() => setSpinning(false), n * 7 * STEP * 1000 + 300);
  };

  // 장식용 공 위치와 첫 추첨은 클라이언트에서만 만든다
  useEffect(() => {
    setDots(Array.from({ length: 14 }, (_, i) => ({
      n: i * 3 + 2,
      left: 15 + Math.random() * 130,
      top: 15 + Math.random() * 130,
      dx: (Math.random() - 0.5) * 60,
      dy: (Math.random() - 0.5) * 60,
      delay: -Math.random(),
    })));
    draw(3);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <PageTitle title="로또 번호 뽑기" lead="운세가 아니라 순수한 랜덤 추첨이에요. 재미로만 즐겨주세요." />
      <div className="machine">
        <div className={`globe${spinning ? " spin" : ""}`} aria-hidden="true">
          {dots.map((d, i) => (
            <i key={i} className={cls(d.n)} style={{ left: d.left, top: d.top, animationDelay: `${d.delay}s`, "--dx": `${d.dx}px`, "--dy": `${d.dy}px` } as React.CSSProperties} />
          ))}
        </div>
        <div className="ctrl">
          <select id="lotto-count" aria-label="세트 수" value={count} onChange={(e) => setCount(Number(e.target.value))}>
            {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
          <span>세트</span>
          <button type="button" className="btn" disabled={spinning} onClick={() => draw()}>추첨 시작</button>
        </div>
        <div className="sets" key={round}>
          {sets.map((s, i) => (
            <div className="setrow" key={i}>
              <span className="k">{String.fromCharCode(65 + i)}</span>
              {s.main.map((n, j) => (
                <span key={n} className={`ball ${cls(n)}`} style={{ animationDelay: `${(i * 7 + j) * STEP}s` }}>{n}</span>
              ))}
              <span className="plus">+</span>
              <span className={`ball ${cls(s.bonus)}`} style={{ animationDelay: `${(i * 7 + 6) * STEP}s` }}>{s.bonus}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
