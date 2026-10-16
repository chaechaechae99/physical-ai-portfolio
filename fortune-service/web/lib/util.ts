// 날짜 시드 난수, 한국어 조사, 날짜 포맷

/** 문자열 시드 → 0~1 난수 생성기 (같은 시드 = 같은 결과) */
export function seedOf(s: string): () => number {
  let h = 2166136261;
  for (const c of s) h = Math.imul(h ^ (c.codePointAt(0) ?? 0), 16777619);
  return () => {
    h += 0x6d2b79f5;
    let x = h;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}
export const pickR = <T,>(r: () => number, a: readonly T[]): T => a[Math.floor(r() * a.length)];
export const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

export const ymd = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
export const todayStr = () => ymd(new Date());
export const daysAgo = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return ymd(d);
};

// 받침 유무로 조사 고르기 (한글이 아니면 받침 없음으로 처리)
const batchim = (w: string) => {
  const c = w.charCodeAt(w.length - 1) - 0xac00;
  return c >= 0 && c < 11172 ? c % 28 : 0;
};
export const eun = (w: string) => (batchim(w) ? "은" : "는");
export const iga = (w: string) => (batchim(w) ? "이" : "가");
export const eulReul = (w: string) => (batchim(w) ? "을" : "를");
export const yeyo = (w: string) => (batchim(w) ? "이에요" : "예요");
export const euro = (w: string) => {
  const b = batchim(w);
  return b && b !== 8 ? "으로" : "로";
};

export const maxBy = <T,>(a: T[], f: (x: T) => number) => a.reduce((x, y) => (f(y) > f(x) ? y : x));
export const minBy = <T,>(a: T[], f: (x: T) => number) => a.reduce((x, y) => (f(y) < f(x) ? y : x));

/** localStorage 안전 래퍼 (사생활 보호 모드 등에서 실패해도 동작) */
export const store = {
  get<T>(k: string): T | null {
    try {
      return JSON.parse(localStorage.getItem(k) || "null") as T | null;
    } catch {
      return null;
    }
  },
  set(k: string, v: unknown): boolean {
    try {
      localStorage.setItem(k, JSON.stringify(v));
      return true;
    } catch {
      return false;
    }
  },
};
