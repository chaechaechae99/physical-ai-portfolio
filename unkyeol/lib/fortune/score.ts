import { GAN_EL, JI_EL, mod, relOf, type Element, type Pillar, type Saju } from "@/lib/saju/simple";
import { ADJ_S, ADJ_W, REL } from "@/lib/fortune/content";
import { clamp } from "@/lib/util";

/** 상대 오행 하나가 나에게 주는 점수 (30~98) */
export const scoreOf = (s: Saju, el: Element, r: () => number) => {
  const k = relOf(s.me, el);
  return clamp(REL[k].b + (s.strong ? ADJ_S : ADJ_W)[k] + Math.round((r() - 0.5) * 16), 30, 98);
};

/** 간지 기둥 하나(천간+지지)의 평균 점수 */
export const pScore = (s: Saju, x: Pillar, r: () => number) =>
  Math.round((scoreOf(s, GAN_EL[x.g], r) + scoreOf(s, JI_EL[x.j], r)) / 2);

// 지지 관계: 같음 / 육합 / 삼합 / 충 / 없음
const SAMHAP = [[8, 0, 4], [2, 6, 10], [11, 3, 7], [5, 9, 1]];
const YUKHAP: Record<number, number> = { 0: 1, 1: 0, 2: 11, 11: 2, 3: 10, 10: 3, 4: 9, 9: 4, 5: 8, 8: 5, 6: 7, 7: 6 };
export type BrRel = "same" | "yukhap" | "samhap" | "chung" | "none";
export const brRel = (a: number, b: number): BrRel =>
  a === b ? "same"
    : YUKHAP[a] === b ? "yukhap"
      : SAMHAP.some((g) => g.includes(a) && g.includes(b)) ? "samhap"
        : mod(a - b, 12) === 6 ? "chung"
          : "none";
export const BR_PT: Record<BrRel, number> = { same: 4, yukhap: 14, samhap: 10, chung: -12, none: 0 };
