// 간이 만세력: 양력 생년월일 → 사주팔자, 오행, 띠, 별자리, 대운.
// 절기는 고정 날짜로 근사한다(경계일 당일은 틀릴 수 있음). 정식 엔진은 M4에서 교체.
// 이 파일은 다른 모듈을 import하지 않는다(scripts/test-saju.ts가 node로 직접 실행).

export const GAN = "甲乙丙丁戊己庚辛壬癸";
export const JI = "子丑寅卯辰巳午未申酉戌亥";
export const GAN_KO = "갑을병정무기경신임계";
export const JI_KO = "자축인묘진사오미신유술해";
export const GANJI: string[] = Array.from({ length: 60 }, (_, i) => GAN[i % 10] + JI[i % 12]);

export type Element = "木" | "火" | "土" | "金" | "水";
export const EL: Element[] = ["木", "火", "土", "金", "水"];
export const EL_KO: Record<Element, string> = { 木: "목", 火: "화", 土: "토", 金: "금", 水: "수" };
export const GAN_EL: Element[] = ["木", "木", "火", "火", "土", "土", "金", "金", "水", "水"];
export const JI_EL: Element[] = ["水", "土", "木", "木", "土", "火", "火", "土", "金", "金", "土", "水"];

/** 시간 인덱스: 0=子(朝子) … 11=亥, 12=夜子, -1=모름 */
export const HOUR_TXT = [
  "子 00:00~01:30", "丑 01:31~03:30", "寅 03:31~05:30", "卯 05:31~07:30",
  "辰 07:31~09:30", "巳 09:31~11:30", "午 11:31~13:30", "未 13:31~15:30",
  "申 15:31~17:30", "酉 17:31~19:30", "戌 19:31~21:30", "亥 21:31~23:30",
  "夜子 23:31~24:00",
];
const SEASON = ["겨울", "겨울", "봄", "봄", "봄", "여름", "여름", "여름", "가을", "가을", "가을", "겨울"];

export const TTI: [string, string][] = [
  ["쥐", "子"], ["소", "丑"], ["호랑이", "寅"], ["토끼", "卯"], ["용", "辰"], ["뱀", "巳"],
  ["말", "午"], ["양", "未"], ["원숭이", "申"], ["닭", "酉"], ["개", "戌"], ["돼지", "亥"],
];

export type Zodiac = { id: string; name: string; start: number; end: number; sym: string };
export const ZODIAC: Zodiac[] = [
  { id: "aries", name: "양자리", start: 321, end: 419, sym: "♈" },
  { id: "taurus", name: "황소자리", start: 420, end: 520, sym: "♉" },
  { id: "gemini", name: "쌍둥이자리", start: 521, end: 621, sym: "♊" },
  { id: "cancer", name: "게자리", start: 622, end: 722, sym: "♋" },
  { id: "leo", name: "사자자리", start: 723, end: 822, sym: "♌" },
  { id: "virgo", name: "처녀자리", start: 823, end: 922, sym: "♍" },
  { id: "libra", name: "천칭자리", start: 923, end: 1022, sym: "♎" },
  { id: "scorpio", name: "전갈자리", start: 1023, end: 1122, sym: "♏" },
  { id: "sagittarius", name: "사수자리", start: 1123, end: 1224, sym: "♐" },
  { id: "capricorn", name: "염소자리", start: 1225, end: 119, sym: "♑" },
  { id: "aquarius", name: "물병자리", start: 120, end: 218, sym: "♒" },
  { id: "pisces", name: "물고기자리", start: 219, end: 320, sym: "♓" },
];

export const mod = (a: number, n: number) => ((a % n) + n) % n;

export type Pillar = { i: number; g: number; j: number; s: string };
export const gj = (i: number): Pillar => ({ i, g: i % 10, j: i % 12, s: GANJI[i] });
export const idxOf = (g: number, j: number) => {
  for (let i = 0; i < 60; i++) if (i % 10 === g && i % 12 === j) return i;
  return 0;
};

const dayNum = (y: number, m: number, d: number) => Math.round(Date.UTC(y, m - 1, d) / 864e5);
const REF_DAY = dayNum(2026, 10, 12); // 己未 = 55

// 절기 시작일 근사 (MMDD → 월지)
export const TERMS: [number, number][] = [
  [106, 1], [204, 2], [306, 3], [405, 4], [506, 5], [606, 6],
  [707, 7], [808, 8], [908, 9], [1008, 10], [1107, 11], [1207, 0],
];

const solarYear = (y: number, m: number, d: number) => (m < 2 || (m === 2 && d < 4) ? y - 1 : y);
export const yearP = (y: number, m: number, d: number) => gj(mod(solarYear(y, m, d) - 1984, 60));
const monthBranch = (m: number, d: number) => {
  const md = m * 100 + d;
  let b = 0;
  for (const [s, br] of TERMS) if (md >= s) b = br;
  return b;
};
/** 五虎遁 */
export const monthP = (y: number, m: number, d: number) => {
  const yg = yearP(y, m, d).g;
  const b = monthBranch(m, d);
  const g = mod((yg % 5) * 2 + 2 + mod(b - 2, 12), 10);
  return gj(idxOf(g, b));
};
export const dayP = (y: number, m: number, d: number) => gj(mod(55 + dayNum(y, m, d) - REF_DAY, 60));
/** 五鼠遁 */
export const hourP = (dg: number, h: number) => (h < 0 ? null : gj(idxOf(mod((dg % 5) * 2 + h, 10), h)));
export const dateP = (d: Date) => dayP(d.getFullYear(), d.getMonth() + 1, d.getDate());

/** 나(일간 오행) 기준 상대 오행의 관계: 0 비겁 1 식상 2 재성 3 관성 4 인성 */
export const relOf = (me: Element, o: Element) => mod(EL.indexOf(o) - EL.indexOf(me), 5);
const parentEl = (e: Element) => EL[mod(EL.indexOf(e) - 1, 5)];

export const signOf = (m: number, d: number) => {
  const md = m * 100 + d;
  return ZODIAC.findIndex(({ start, end }) => (start <= end ? md >= start && md <= end : md >= start || md <= end));
};
export const ttiOfYear = (y: number) => mod(y - 2020, 12);

export type Gender = "M" | "F";
export type Profile = { gender: Gender; date: string; hour: number };

export type Saju = {
  p: Profile;
  y: number; m: number; d: number;
  Y: Pillar; M: Pillar; D: Pillar; H: Pillar | null;
  /** 표시 순서: 시 일 월 년 */
  pillars: (Pillar | null)[];
  cnt: Record<Element, number>;
  total: number;
  me: Element;
  strong: boolean;
  most: Element;
  least: Element;
  tti: string;
  ttiIdx: number;
  sign: number;
  season: string;
  key: string;
  label: string;
};

export const isValidProfile = (p: unknown): p is Profile => {
  if (!p || typeof p !== "object") return false;
  const o = p as Record<string, unknown>;
  return (
    typeof o.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(o.date) &&
    (o.gender === "M" || o.gender === "F") &&
    Number.isInteger(o.hour) && (o.hour as number) >= -1 && (o.hour as number) <= 12
  );
};

export function saju(p: Profile): Saju {
  const [y, m, d] = p.date.split("-").map(Number);
  const Y = yearP(y, m, d);
  const M = monthP(y, m, d);
  const yaja = p.hour === 12;
  let D: Pillar;
  if (yaja) {
    // 夜子: 다음 날 일주, 시주는 子시
    const nx = new Date(Date.UTC(y, m - 1, d + 1));
    D = dayP(nx.getUTCFullYear(), nx.getUTCMonth() + 1, nx.getUTCDate());
  } else {
    D = dayP(y, m, d);
  }
  const H = hourP(D.g, yaja ? 0 : p.hour);
  const pillars = [H, D, M, Y];
  const cnt: Record<Element, number> = { 木: 0, 火: 0, 土: 0, 金: 0, 水: 0 };
  for (const x of pillars) {
    if (!x) continue;
    cnt[GAN_EL[x.g]]++;
    cnt[JI_EL[x.j]]++;
  }
  const me = GAN_EL[D.g];
  const total = pillars.filter(Boolean).length * 2;
  const support = cnt[me] + cnt[parentEl(me)];
  const sorted = EL.slice().sort((a, b) => cnt[b] - cnt[a]);
  return {
    p, y, m, d, Y, M, D, H, pillars, cnt, total, me,
    strong: support * 2 >= total,
    most: sorted[0],
    least: sorted[4],
    tti: TTI[Y.j][0],
    ttiIdx: Y.j,
    sign: signOf(m, d),
    season: SEASON[M.j],
    key: `${p.date}|${p.hour}|${p.gender}`,
    label: `${D.s}일주 · ${TTI[Y.j][0]}띠`,
  };
}

export type Daeun = { start: number; fwd: boolean; list: (Pillar & { age: number })[] };

/** 대운: 양남음녀 순행, 음남양녀 역행. 시작 나이 = 가까운 절기까지 날수 / 3 */
export function daeun(s: Saju): Daeun {
  const fwd = (s.Y.g % 2 === 0) === (s.p.gender === "M");
  const bd = Date.UTC(s.y, s.m - 1, s.d);
  let best: number | null = null;
  for (let yy = s.y - 1; yy <= s.y + 1; yy++) {
    for (const [md] of TERMS) {
      const diff = (Date.UTC(yy, Math.floor(md / 100) - 1, md % 100) - bd) / 864e5;
      if (fwd ? diff > 0 : diff <= 0) {
        const a = Math.abs(diff);
        if (best === null || a < best) best = a;
      }
    }
  }
  const start = Math.max(1, Math.round((best ?? 3) / 3));
  return {
    start,
    fwd,
    list: Array.from({ length: 10 }, (_, k) => ({ age: start + k * 10, ...gj(mod(s.M.i + (fwd ? k + 1 : -(k + 1)), 60)) })),
  };
}

export const hourName = (h: number) => (h < 0 ? "시간 모름" : h === 12 ? "夜子시" : JI[h] + "시");
