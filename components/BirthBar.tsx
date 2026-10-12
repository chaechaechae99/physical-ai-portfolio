"use client";

import { useState } from "react";
import { useProfile } from "@/components/ProfileProvider";
import { HOUR_TXT, type Calendar, type Profile } from "@/lib/saju/simple";
import { todayStr } from "@/lib/util";

const HOUR_OPTS: [number, string][] = [
  ...HOUR_TXT.map((t, i): [number, string] => {
    const [b, range] = t.split(" ");
    return [i, `${b}시 ${range.slice(0, 5)}`];
  }),
  [-1, "시간 모름"],
];

const CAL_OPTS: [Calendar, string][] = [
  ["S", "양력"],
  ["L", "음력"],
  ["Z", "음력 윤달"],
];

const pad = (n: number) => String(n).padStart(2, "0");
const range = (a: number, b: number) => Array.from({ length: b - a + 1 }, (_, i) => a + i);

/** 헤더의 생년월일 입력칸. 값이 바뀌면 사이트 전체 운세가 바로 다시 계산된다. */
export function BirthBar() {
  const { profile, saju, update, ready, saved } = useProfile();
  const [err, setErr] = useState("");
  const cal = profile.cal ?? "S";
  const [y, m, d] = profile.date.split("-").map(Number);
  const thisYear = ready ? new Date().getFullYear() : 2026;

  const apply = (patch: Partial<Profile>) => {
    const ok = update(patch);
    const next = { ...profile, ...patch };
    setErr(
      ok
        ? ""
        : next.cal === "Z"
          ? `${next.date.slice(0, 4)}년에는 윤${Number(next.date.slice(5, 7))}월이 없어요`
          : "없는 날짜예요",
    );
  };
  const setYmd = (yy: number, mm: number, dd: number) => apply({ date: `${yy}-${pad(mm)}-${pad(dd)}` });

  return (
    <div className="birthbar" aria-label="내 생년월일">
      <div className="seg" role="group" aria-label="성별">
        {(["M", "F"] as const).map((g) => (
          <button key={g} type="button" aria-pressed={profile.gender === g} onClick={() => apply({ gender: g })}>
            {g === "M" ? "남" : "여"}
          </button>
        ))}
      </div>
      <select id="birth-cal" aria-label="양력 음력" value={cal} onChange={(e) => apply({ cal: e.target.value as Calendar })}>
        {CAL_OPTS.map(([v, t]) => (
          <option key={v} value={v}>{t}</option>
        ))}
      </select>
      {cal === "S" ? (
        <input
          id="birth-date"
          type="date"
          aria-label="양력 생년월일"
          value={profile.date}
          min="1930-01-01"
          max={ready ? todayStr() : undefined}
          onChange={(e) => e.target.value && apply({ date: e.target.value })}
        />
      ) : (
        <span className="lunar-date" role="group" aria-label="음력 생년월일">
          <select id="lunar-y" aria-label="음력 연도" value={y} onChange={(e) => setYmd(Number(e.target.value), m, d)}>
            {range(1930, thisYear).reverse().map((v) => (
              <option key={v} value={v}>{v}년</option>
            ))}
          </select>
          <select id="lunar-m" aria-label="음력 월" value={m} onChange={(e) => setYmd(y, Number(e.target.value), d)}>
            {range(1, 12).map((v) => (
              <option key={v} value={v}>{cal === "Z" ? "윤" : ""}{v}월</option>
            ))}
          </select>
          <select id="lunar-d" aria-label="음력 일" value={d} onChange={(e) => setYmd(y, m, Number(e.target.value))}>
            {range(1, 30).map((v) => (
              <option key={v} value={v}>{v}일</option>
            ))}
          </select>
        </span>
      )}
      <select id="birth-hour" aria-label="태어난 시간" value={profile.hour} onChange={(e) => apply({ hour: Number(e.target.value) })}>
        {HOUR_OPTS.map(([v, t]) => (
          <option key={v} value={v}>{t}</option>
        ))}
      </select>
      <span className="birthres" title={saved ? undefined : "이 브라우저에선 저장이 막혀서 이번 방문 동안만 기억해요"}>
        {saju.label}
        {cal !== "S" && saju.solar && <small className="birthsub">양력 {saju.solar.replaceAll("-", ".")}</small>}
      </span>
      {err && (
        <span className="birtherr" role="alert">
          {err}
        </span>
      )}
    </div>
  );
}
