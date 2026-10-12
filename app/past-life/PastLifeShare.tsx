"use client";

import { useProfile } from "@/components/ProfileProvider";
import { ShareCard } from "@/components/share/ShareCard";
import { ERA, EL_INFO, PAST_ID, PAST_TRACE, PAST_TRAIT } from "@/lib/fortune/content";
import { GAN } from "@/lib/saju/simple";
import { euro, seedOf } from "@/lib/util";

/** 전생 결과 카드 (화면의 PastLife 결과와 같은 계산) */
export function PastLifeShare() {
  const { saju: s, ready } = useProfile();
  if (!ready || !s) return null;
  const r = seedOf(s.key + "past");
  const id = PAST_ID[s.D.g][s.D.j % 2], era = ERA[s.Y.j], rare = 1 + Math.floor(r() * 29);
  return (
    <ShareCard
      name="전생"
      spec={{
        eyebrow: `${s.label} · 나의 전생`,
        title: `${era}, ${id}`,
        subtitle: `${GAN[s.D.g]}${s.me}의 기운을 타고난 당신은 ${era}에 ${id}${euro(id)} 살았어요.`,
        chips: EL_INFO[s.me].tags,
        rows: [
          { label: "전생의 성격", text: PAST_TRAIT[s.me] },
          { label: "현생에 남은 흔적", text: `${PAST_TRACE[s.me]}은 전생에서 이어진 거예요.` },
        ],
        highlight: `같은 전생이 나온 사람 · 상위 ${rare}%`,
      }}
    />
  );
}
