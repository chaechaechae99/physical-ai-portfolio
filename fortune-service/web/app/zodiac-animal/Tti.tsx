"use client";

import { useState } from "react";
import { Loading, PageTitle, Ring } from "@/components/ui";
import { useProfile } from "@/components/ProfileProvider";
import { DIRS, LUCKY_COLOR, TTI_ALL, TTI_YEAR } from "@/lib/fortune/content";
import { TTI, ttiOfYear } from "@/lib/saju/simple";
import { pickR, seedOf, todayStr } from "@/lib/util";

const recentYears = (i: number) => {
  const y = new Date().getFullYear();
  const a: number[] = [];
  for (let k = 1950; k <= y; k++) if (ttiOfYear(k) === i) a.push(k);
  return a.slice(-5);
};

export function Tti() {
  const { saju, ready } = useProfile();
  const [chosen, setChosen] = useState<number | null>(null);
  const cur = chosen ?? saju.ttiIdx;

  return (
    <>
      <PageTitle title="띠별 운세" lead="내 띠를 고르면 오늘의 운세와 출생년도별 한마디를 볼 수 있어요." />
      <div className="finder">
        <label htmlFor="tti-year">태어난 해로 찾기</label>
        <input
          id="tti-year"
          type="number"
          min={1930}
          max={2100}
          placeholder="예) 1996"
          style={{ width: 120 }}
          onChange={(e) => {
            const y = Number(e.target.value);
            if (y >= 1900 && y <= 2100) setChosen(ttiOfYear(y));
          }}
        />
      </div>
      {!ready ? <Loading /> : (
        <>
          <div className="zgrid">
            {TTI.map(([n, h], i) => (
              <button key={n} type="button" className="zbtn" aria-current={i === cur} onClick={() => setChosen(i)}>
                <span className="sym">{h}</span>
                <b>{n}띠{i === saju.ttiIdx ? " · 나" : ""}</b>
                <small>{recentYears(i).slice(-3).map((y) => String(y).slice(2)).join("·")}년생</small>
              </button>
            ))}
          </div>
          <Reading idx={cur} />
        </>
      )}
    </>
  );
}

function Reading({ idx }: { idx: number }) {
  const [n, h] = TTI[idx];
  const today = todayStr();
  const r = seedOf(`tti${idx}${today}`);
  const sc = 55 + Math.floor(r() * 41);
  const all = pickR(r, TTI_ALL);
  return (
    <>
      <Ring n={sc} title={`${h} ${n}띠 · 오늘의 운세`} desc={all} />
      <div className="panel mt">
        <h3 className="panel-h">출생년도별 한마디</h3>
        <div className="years">
          {recentYears(idx).map((y) => (
            <div key={y}><b>{String(y).slice(2)}년생</b><span>{pickR(seedOf(`tti${y}${today}`), TTI_YEAR)}</span></div>
          ))}
        </div>
      </div>
      <div className="lucky three mt">
        <div><small>행운의 방향</small><b>{pickR(r, DIRS)}</b></div>
        <div><small>행운의 색</small><b>{pickR(r, LUCKY_COLOR)}</b></div>
        <div><small>행운의 숫자</small><b>{1 + Math.floor(r() * 9)}</b></div>
      </div>
      <p className="note">띠는 입춘(또는 설날)을 기준으로 바뀌어서 1~2월생은 앞 띠일 수 있어요. 재미로만 봐주세요.</p>
    </>
  );
}
