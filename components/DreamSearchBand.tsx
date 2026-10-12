"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const QUICK = ["돼지", "이빨", "뱀", "똥", "불", "하늘을 나는"];

export function DreamSearchBand() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const go = (k: string) => router.push(`/dream?q=${encodeURIComponent(k)}`);

  return (
    <form
      className="dream-band"
      onSubmit={(e) => {
        e.preventDefault();
        go(q);
      }}
    >
      <h2>어떤 꿈을 꾸셨나요?</h2>
      <div className="searchrow">
        <input id="home-dream-q" value={q} onChange={(e) => setQ(e.target.value)} placeholder="예) 돼지 꿈, 이빨 빠지는 꿈" aria-label="꿈 검색" />
        <button className="btn">해몽하기</button>
      </div>
      <div className="chips">
        {QUICK.map((k) => (
          <button key={k} type="button" className="chip" onClick={() => go(k)}>#{k} 꿈</button>
        ))}
      </div>
    </form>
  );
}
