"use client";

import Link from "next/link";
import { LUCK_LABEL } from "@/lib/dream";
import type { Interpretation } from "@/lib/dream/interpret";

/** 키워드 기반 해몽 결과 카드 (꿈해몽 페이지 · 꿈 일기 공용) */
export function DreamReading({ r, compact = false }: { r: Interpretation; compact?: boolean }) {
  return (
    <div className={compact ? "match-box" : "panel mt"} style={{ display: "grid", gap: 14 }}>
      <div className="score">
        <div className="ring" style={{ "--p": r.score } as React.CSSProperties}><b>{r.score}</b></div>
        <div>
          <p className="ring-title" style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            종합 길흉 <span className={`luck ${r.luck}`}>{r.luckLabel}</span>
          </p>
          <p className="muted">키워드 기반 해몽 · 재미로 봐주세요</p>
        </div>
      </div>

      {(r.symbols.length > 0 || r.actions.length > 0 || r.emotion) && (
        <div className="chips" aria-label="핵심 상징">
          {r.symbols.map((s) => <span key={s.label} className="chip">#{s.label}</span>)}
          {r.actions.map((a) => <span key={a} className="chip">#{a}</span>)}
          {r.emotion && <span className="chip">#{r.emotion}</span>}
        </div>
      )}

      <div>
        <h4 style={{ margin: "0 0 6px", fontSize: 15 }}>종합 해몽</h4>
        <p style={{ margin: 0, color: "var(--ink)", lineHeight: 1.75 }}>{r.sentences.join(" ")}</p>
      </div>

      <p style={{ margin: 0 }}><b>오늘의 한 줄 조언</b> · {r.advice}</p>

      {r.similar.length > 0 && (
        <div>
          <h4 style={{ margin: "0 0 6px", fontSize: 15 }}>비슷한 꿈</h4>
          <div style={{ display: "grid", gap: 6 }}>
            {r.similar.map((d) => (
              <Link key={d.id} href={`/dream?q=${encodeURIComponent(d.title.replace(/\s*꿈$/, ""))}`} style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", textDecoration: "none" }}>
                <span style={{ color: "var(--ink)" }}>{d.title}</span>
                <span className={`luck ${d.luck}`}>{LUCK_LABEL[d.luck]}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
