"use client";

import { useProfile } from "@/components/ProfileProvider";
import { ShareCard } from "@/components/share/ShareCard";
import { EL_INFO, SP_LOOK, SP_TITLE } from "@/lib/fortune/content";
import { brRel } from "@/lib/fortune/score";
import { EL, mod } from "@/lib/saju/simple";

/** 미래 배우자 결과 카드 (화면의 Spouse 결과와 같은 계산) */
export function SpouseShare() {
  const { saju: s, ready } = useProfile();
  if (!ready || !s) return null;
  const spEl = EL[mod(EL.indexOf(s.me) + (s.p.gender === "M" ? 2 : 3), 5)];
  const yr = new Date().getFullYear();
  let meet: number | null = null;
  for (let y = yr + 1; y <= yr + 10 && !meet; y++) {
    const rel = brRel(s.D.j, mod(y - 2020, 12));
    if (rel === "yukhap" || rel === "samhap") meet = y;
  }
  return (
    <ShareCard
      name="배우자"
      spec={{
        eyebrow: `${s.label} · 미래 배우자`,
        title: SP_TITLE[spEl],
        chips: EL_INFO[spEl].tags,
        rows: [
          { label: "분위기 · 인상", text: SP_LOOK[spEl] },
          { label: "일하는 분야", text: `${EL_INFO[spEl].jobs.slice(0, 3).join(", ")} 쪽일 가능성이 커요.` },
        ],
        highlight: meet ? `${meet}년 무렵, 인연이 무르익어요` : "언제든 만날 수 있는 인연이에요",
      }}
    />
  );
}
