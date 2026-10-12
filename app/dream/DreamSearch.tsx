"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { PageTitle } from "@/components/ui";
import { DREAM_CATS, LUCK_LABEL, searchDreams } from "@/lib/dream";

export function DreamSearch() {
  const params = useSearchParams();
  const initial = params.get("q") ?? "";
  const [input, setInput] = useState(initial);
  const [q, setQ] = useState(initial);
  const [cat, setCat] = useState("전체");
  const [aiNote, setAiNote] = useState(false);
  const results = searchDreams(q, cat);

  return (
    <>
      <PageTitle title="꿈해몽" lead="키워드로 찾거나 카테고리로 둘러보세요. 사전에 없는 꿈은 AI가 풀어드릴 예정이에요." />
      <form
        className="searchrow"
        onSubmit={(e) => {
          e.preventDefault();
          setQ(input);
        }}
      >
        <input id="dream-q" value={input} onChange={(e) => setInput(e.target.value)} placeholder="예) 돼지, 이빨, 하늘" aria-label="꿈 검색" />
        <button className="btn">검색</button>
      </form>
      <div className="chips mt">
        {DREAM_CATS.map((c) => (
          <button key={c} type="button" className="chip" aria-pressed={c === cat} onClick={() => setCat(c)}>{c}</button>
        ))}
      </div>

      <div className="dlist">
        {results.length === 0 && <p className="muted">맞는 꿈이 없어요. 다른 단어로 찾아보세요.</p>}
        {results.map((d) => (
          <article key={d.id} className="ditem">
            <h4>
              {d.title}
              <span className={`luck ${d.luck}`}>{LUCK_LABEL[d.luck]}</span>
              <span className="tag">{d.category}</span>
            </h4>
            <p>{d.text}</p>
            <div>
              <Link className="btn ghost sm" href={`/dream/diary?prefill=${encodeURIComponent(d.title)}`}>일기에 저장</Link>
            </div>
          </article>
        ))}
        {q.trim() && (
          <article className="ditem ai">
            <h4>찾는 꿈이 없나요?</h4>
            <p>꿈 내용을 문장으로 적으면 AI가 해몽해 드려요. (예: &quot;어젯밤 바다에서 금붕어를 잡았어요&quot;)</p>
            <div>
              <button className="btn ghost" type="button" onClick={() => setAiNote(true)}>AI에게 해몽 받기</button>
            </div>
            {aiNote && <p className="status">AI 해몽은 다음 개발 단계(M3)에서 열려요.</p>}
          </article>
        )}
      </div>
    </>
  );
}
