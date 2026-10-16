// 정식 만세력 엔진: manseryeok (KASI 음력, 분 단위 절기, 십신, 대운) 래퍼.
// 결과는 간이 엔진(simple.ts)과 같은 Saju 모양으로 돌려준다.
// import하면 registerEngine()으로 등록돼서 simple.ts의 saju()/daeun()이 이 엔진을 쓴다.
import {
  EARTHLY_BRANCHES,
  HEAVENLY_STEMS,
  calculateFourPillars,
  lunarToSolar,
  type Pillar as LibPillar,
} from "manseryeok";
import {
  EL,
  GAN_EL,
  JI_EL,
  SEASON_OF,
  TTI,
  gj,
  idxOf,
  registerEngine,
  signOf,
  type Daeun,
  type Element,
  type Pillar,
  type Profile,
  type Saju,
} from "./simple";

const toPillar = (p: LibPillar): Pillar =>
  gj(idxOf(HEAVENLY_STEMS.indexOf(p.heavenlyStem), EARTHLY_BRANCHES.indexOf(p.earthlyBranch)));

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * 12지시 → 계산에 쓸 시각.
 * 정답셋(신한라이프)과 맞추려고 각 시의 정시(子 00:00, 丑 02:00 … 亥 22:00)를 쓴다.
 * 夜子(23:31~24:00)는 23:45 + 'jasi'(다음 날 일주·시주) 규칙.
 * 시간 모름은 정오로 년·월·일주만 계산하고 시주는 비운다.
 */
function clockOf(hour: number): { hour: number; minute: number; dayBoundary: "midnight" | "jasi" } {
  if (hour === 12) return { hour: 23, minute: 45, dayBoundary: "jasi" };
  if (hour < 0) return { hour: 12, minute: 0, dayBoundary: "midnight" };
  return { hour: hour * 2, minute: 0, dayBoundary: "midnight" };
}

/** 입력 날짜(양력/음력) → 양력 YYYY-MM-DD. 없는 날짜면 RangeError */
export function toSolar(p: Profile): string {
  const [y, m, d] = p.date.split("-").map(Number);
  if (!p.cal || p.cal === "S") return p.date;
  const s = lunarToSolar(y, m, d, p.cal === "Z");
  return `${s.year}-${pad(s.month)}-${pad(s.day)}`;
}

export function engineSaju(p: Profile): Saju {
  const [y, m, d] = p.date.split("-").map(Number);
  const cal = p.cal ?? "S";
  const t = clockOf(p.hour);
  const r = calculateFourPillars({
    year: y,
    month: m,
    day: d,
    hour: t.hour,
    minute: t.minute,
    dayBoundary: t.dayBoundary,
    isLunar: cal !== "S",
    isLeapMonth: cal === "Z",
    gender: p.gender === "M" ? "male" : "female",
  });

  const solar = toSolar(p);
  const [sy, sm, sd] = solar.split("-").map(Number);
  const Y = toPillar(r.year);
  const M = toPillar(r.month);
  const D = toPillar(r.day);
  const H = p.hour < 0 ? null : toPillar(r.hour);
  const pillars = [H, D, M, Y];

  const cnt: Record<Element, number> = { 木: 0, 火: 0, 土: 0, 金: 0, 水: 0 };
  for (const x of pillars) {
    if (!x) continue;
    cnt[GAN_EL[x.g]]++;
    cnt[JI_EL[x.j]]++;
  }
  const me = GAN_EL[D.g];
  const parent = EL[(EL.indexOf(me) + 4) % 5];
  const total = pillars.filter(Boolean).length * 2;
  const support = cnt[me] + cnt[parent];
  const sorted = EL.slice().sort((a, b) => cnt[b] - cnt[a]);

  const lp = r.luckPillars;
  const daeunInfo: Daeun | undefined = lp && {
    start: lp.startAge,
    fwd: lp.forward,
    list: lp.pillars.slice(0, 10).map((x) => ({ age: x.age, ...toPillar(x.pillar) })),
  };

  const tg = r.tenGods;
  return {
    p,
    y: sy,
    m: sm,
    d: sd,
    Y,
    M,
    D,
    H,
    pillars,
    cnt,
    total,
    me,
    strong: support * 2 >= total,
    most: sorted[0],
    least: sorted[4],
    tti: TTI[Y.j][0],
    ttiIdx: Y.j,
    sign: signOf(sm, sd),
    season: SEASON_OF[M.j],
    key: `${cal}|${p.date}|${p.hour}|${p.gender}`,
    label: `${D.s}일주 · ${TTI[Y.j][0]}띠`,
    cal,
    solar,
    engine: "manseryeok",
    tenGods: { year: tg.year, month: tg.month, day: tg.day, hour: H ? tg.hour : null },
    daeunInfo,
  };
}

registerEngine(engineSaju);
