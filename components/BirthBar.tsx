"use client";

import { useProfile } from "@/components/ProfileProvider";
import { HOUR_TXT } from "@/lib/saju/simple";
import { todayStr } from "@/lib/util";

const HOUR_OPTS: [number, string][] = [
  ...HOUR_TXT.map((t, i): [number, string] => {
    const [b, range] = t.split(" ");
    return [i, `${b}시 ${range.slice(0, 5)}`];
  }),
  [-1, "시간 모름"],
];

/** 헤더의 생년월일 입력칸. 값이 바뀌면 사이트 전체 운세가 바로 다시 계산된다. */
export function BirthBar() {
  const { profile, saju, update, ready, saved } = useProfile();

  return (
    <div className="birthbar" aria-label="내 생년월일">
      <div className="seg" role="group" aria-label="성별">
        {(["M", "F"] as const).map((g) => (
          <button key={g} type="button" aria-pressed={profile.gender === g} onClick={() => update({ gender: g })}>
            {g === "M" ? "남" : "여"}
          </button>
        ))}
      </div>
      <input
        id="birth-date"
        type="date"
        aria-label="양력 생년월일"
        value={profile.date}
        min="1930-01-01"
        max={ready ? todayStr() : undefined}
        onChange={(e) => e.target.value && update({ date: e.target.value })}
      />
      <select id="birth-hour" aria-label="태어난 시간" value={profile.hour} onChange={(e) => update({ hour: Number(e.target.value) })}>
        {HOUR_OPTS.map(([v, t]) => (
          <option key={v} value={v}>{t}</option>
        ))}
      </select>
      <span className="birthres" title={saved ? undefined : "이 브라우저에선 저장이 막혀서 이번 방문 동안만 기억해요"}>
        {saju.label}
      </span>
    </div>
  );
}
