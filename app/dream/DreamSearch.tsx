"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { PageTitle } from "@/components/ui";
import { DREAMS, DREAM_CATS, LUCK_LABEL, searchDreams } from "@/lib/dream";
import { type Interpretation, interpretDream } from "@/lib/dream/interpret";
import { DreamReading } from "./DreamReading";

export function DreamSearch() {
  const params = useSearchParams();
  const initial = params.get("q") ?? "";
  const [input, setInput] = useState(initial);
  const [q, setQ] = useState(initial);
  const [cat, setCat] = useState("전체");
  const [story, setStory] = useState("");
  const [reading, setReading] = useState<Interpretation | null>(null);
  const storyRef = useRef<HTMLTextAreaElement>(null);
  const results = searchDreams(q, cat);

  // "비슷한 꿈" 링크처럼 같은 페이지에서 ?q= 가 바뀌어도 검색어를 따라가도록
  useEffect(() => {
    setInput(initial);
    setQ(initial);
  }, [initial]);

  const toStory = () => {
    setStory((s) => s || `${q.trim()} 꿈을 꿨어요. `);
    storyRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    storyRef.current?.focus();
  };

  return (
    <>
      <PageTitle title="꿈해몽" lead={`꿈 ${DREAMS.length}개를 키워드나 카테고리로 찾아보세요. 사전에 없는 꿈은 꿈 이야기를 적으면 풀어드려요.`} />
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
        {results.length === 0 && (
          <article className="ditem ai">
            <h4>사전에서 맞는 꿈을 찾지 못했어요</h4>
            <p>꿈 내용을 문장으로 적으면 상징과 장면을 읽어서 풀어드려요.</p>
            <div><button className="btn ghost sm" type="button" onClick={toStory}>꿈 이야기로 해몽받기</button></div>
          </article>
        )}
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
      </div>

      <section className="panel mt" aria-labelledby="story-h" style={{ marginTop: 28 }}>
        <h2 id="story-h" className="panel-h">내 꿈 이야기로 해몽받기</h2>
        <form
          className="form"
          style={{ gridTemplateColumns: "1fr" }}
          onSubmit={(e) => {
            e.preventDefault();
            const t = story.trim();
            setReading(t ? interpretDream(t) : null);
          }}
        >
          <label>어떤 꿈이었나요?
            <textarea
              id="dream-story"
              ref={storyRef}
              value={story}
              onChange={(e) => setStory(e.target.value)}
              placeholder="예) 바다에서 커다란 물고기를 잡았는데 하나도 무섭지 않고 신났어요"
            />
          </label>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button className="btn">해몽하기</button>
            {reading && story.trim() && (
              <Link className="btn ghost" href={`/dream/diary?prefill=${encodeURIComponent(story.trim())}&raw=1`}>일기에 저장</Link>
            )}
          </div>
        </form>
        {reading && <DreamReading r={reading} compact />}
      </section>
    </>
  );
}
