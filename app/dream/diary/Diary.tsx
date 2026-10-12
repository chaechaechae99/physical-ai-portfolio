"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Loading, PageTitle } from "@/components/ui";
import { LUCK_LABEL, dreamKey, matchDreams } from "@/lib/dream";
import { daysAgo, store, todayStr } from "@/lib/util";

type Entry = { id: string; date: string; text: string; mood: string; tag: "" | "good" | "bad"; ex?: boolean };

const KEY = "unkyeol-diary-v1";
const MOODS = ["😊", "😐", "😢", "😱"];

const isEntry = (e: unknown): e is Entry => {
  if (!e || typeof e !== "object") return false;
  const o = e as Record<string, unknown>;
  return typeof o.id === "string" && typeof o.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(o.date) && typeof o.text === "string";
};

const examples = (): Entry[] => [
  { id: "ex1", date: daysAgo(1), text: "커다란 돼지가 우리 집 현관으로 걸어 들어왔어요. 이상하게 하나도 무섭지 않고 귀여웠어요.", mood: "😊", tag: "good", ex: true },
  { id: "ex2", date: daysAgo(3), text: "시험장에 갔는데 펜이 없어서 한참 헤맸어요. 그러다 갑자기 이빨이 하나 빠졌어요.", mood: "😱", tag: "bad", ex: true },
];

export function Diary() {
  const params = useSearchParams();
  const prefill = params.get("prefill");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [ready, setReady] = useState(false);
  const [date, setDate] = useState("");
  const [text, setText] = useState(prefill ? `${prefill}을 꿨어요. ` : "");
  const [mood, setMood] = useState(MOODS[0]);
  const [tag, setTag] = useState<Entry["tag"]>("");
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [status, setStatus] = useState<{ msg: string; err?: boolean } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const v = store.get<unknown>(KEY);
    setEntries(Array.isArray(v) ? v.filter(isEntry) : []);
    setDate(todayStr());
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready && prefill && textRef.current) {
      const t = textRef.current;
      t.focus();
      t.setSelectionRange(t.value.length, t.value.length);
    }
  }, [ready, prefill]);

  const save = (next: Entry[], msg: string) => {
    setEntries(next);
    const ok = store.set(KEY, next);
    setStatus(ok ? { msg } : { msg: "이 브라우저에서는 저장이 막혀 있어서 이번 방문 동안만 보관돼요.", err: true });
  };

  const list = useMemo(() => (entries.length ? entries : ready ? examples() : []), [entries, ready]);
  const sorted = [...list].sort((a, b) => b.date.localeCompare(a.date));

  const stats = useMemo(() => {
    const ym = todayStr().slice(0, 7);
    const month = list.filter((e) => e.date.slice(0, 7) === ym).length;
    const cnt: Record<string, number> = {};
    list.forEach((e) => matchDreams(e.text).forEach((d) => {
      const k = dreamKey(d).key;
      cnt[k] = (cnt[k] ?? 0) + 1;
    }));
    const top = Object.entries(cnt).sort((a, b) => b[1] - a[1])[0];
    const tagged = list.filter((e) => e.tag);
    const good = tagged.filter((e) => e.tag === "good").length;
    return { month, top: top ? `#${top[0]}` : "—", ratio: tagged.length ? `${Math.round((good / tagged.length) * 100)}%` : "—" };
  }, [list]);

  const exportJson = () => {
    if (!entries.length) {
      setStatus({ msg: "내보낼 기록이 없어요. 먼저 꿈을 적어 주세요.", err: true });
      return;
    }
    const blob = new Blob([JSON.stringify({ app: "unkyeol", kind: "dream-diary", version: 1, exportedAt: new Date().toISOString(), entries }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `꿈일기_${todayStr()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setStatus({ msg: `${entries.length}개 기록을 파일로 내보냈어요.` });
  };

  const importJson = async (file: File) => {
    try {
      const raw: unknown = JSON.parse(await file.text());
      const arr = Array.isArray(raw) ? raw : (raw as { entries?: unknown })?.entries;
      if (!Array.isArray(arr)) throw new Error("format");
      const valid = arr.filter(isEntry).map((e) => ({
        id: e.id, date: e.date, text: e.text,
        mood: MOODS.includes(e.mood) ? e.mood : "",
        tag: e.tag === "good" || e.tag === "bad" ? e.tag : "",
      } as Entry));
      const have = new Set(entries.map((e) => e.id));
      const add = valid.filter((e) => !have.has(e.id));
      if (!add.length) {
        setStatus({ msg: valid.length ? "이미 모두 들어 있는 기록이에요. 새로 추가된 건 없어요." : "파일에서 꿈 기록을 찾지 못했어요.", err: !valid.length });
        return;
      }
      save([...add, ...entries], `${add.length}개 기록을 가져왔어요.${valid.length > add.length ? ` (중복 ${valid.length - add.length}개는 건너뜀)` : ""}`);
    } catch {
      setStatus({ msg: "읽을 수 없는 파일이에요. 운결에서 내보낸 JSON 파일을 골라 주세요.", err: true });
    }
  };

  if (!ready) return (<><PageTitle title="꿈 일기장" /><Loading /></>);

  return (
    <>
      <PageTitle title="꿈 일기장" lead="아침에 잊어버리기 전에 적어두세요. 쌓인 기록으로 나의 꿈 패턴을 볼 수 있어요." />

      <div className="stats">
        <div><small>이번 달 기록</small><b>{stats.month}개</b></div>
        <div><small>자주 나온 키워드</small><b>{stats.top}</b></div>
        <div><small>길몽 비율</small><b>{stats.ratio}</b></div>
      </div>

      <form
        className="panel form mt"
        onSubmit={(e) => {
          e.preventDefault();
          const t = text.trim();
          if (!t) {
            setStatus({ msg: "꿈 내용을 한 줄이라도 적어 주세요.", err: true });
            textRef.current?.focus();
            return;
          }
          save([{ id: `d${Date.now()}`, date: date || todayStr(), text: t, mood, tag }, ...entries], "일기에 저장했어요.");
          setText("");
          setTag("");
        }}
      >
        <label>꿈 꾼 날<input id="diary-date" type="date" value={date} max={todayStr()} onChange={(e) => setDate(e.target.value)} /></label>
        <label>내 느낌으로는
          <select id="diary-tag" value={tag} onChange={(e) => setTag(e.target.value as Entry["tag"])}>
            <option value="">선택 안 함</option>
            <option value="good">길몽 같아요</option>
            <option value="bad">흉몽 같아요</option>
          </select>
        </label>
        <label className="full">어떤 꿈이었나요?
          <textarea id="diary-text" ref={textRef} value={text} onChange={(e) => setText(e.target.value)} placeholder="예) 바다에서 커다란 물고기를 잡았어요" />
        </label>
        <div className="full">
          <div className="muted" style={{ fontSize: 13, marginBottom: 6 }}>깨어났을 때 기분</div>
          <div className="moods">
            {MOODS.map((m) => (
              <button key={m} type="button" className="chip" aria-pressed={m === mood} aria-label={`기분 ${m}`} onClick={() => setMood(m)}>{m}</button>
            ))}
          </div>
        </div>
        <div className="full"><button className="btn block">일기에 저장</button></div>
      </form>

      {status && <p className={`status mt${status.err ? " err" : ""}`} role="status">{status.msg}</p>}

      <div className="sec-h" style={{ marginTop: 28 }}>
        <h2 style={{ fontSize: 22 }}>나의 꿈 기록</h2>
        <p className="muted" style={{ margin: 0 }}>{entries.length ? `총 ${entries.length}개` : "아래는 예시 기록이에요. 첫 꿈을 적으면 사라져요."}</p>
      </div>

      <div className="dlist" style={{ marginTop: 0 }}>
        {sorted.map((e) => {
          const m = open[e.id] ? matchDreams(e.text) : [];
          return (
            <article key={e.id} className="ditem">
              <div className="meta">
                <span>{e.date.replace(/-/g, ".")}</span>
                <span style={{ fontSize: 16 }}>{e.mood}</span>
                {e.tag && <span className={`luck ${e.tag}`}>{e.tag === "good" ? "길몽" : "흉몽"}</span>}
                {e.ex && <span className="tag">예시</span>}
              </div>
              <p style={{ color: "var(--ink)" }}>{e.text}</p>
              <div className="acts">
                <button className="btn ghost sm" type="button" onClick={() => setOpen((o) => ({ ...o, [e.id]: !o[e.id] }))}>
                  {open[e.id] ? "해몽 접기" : "해몽 보기"}
                </button>
                {!e.ex && (
                  <button className="btn ghost sm" type="button" onClick={() => save(entries.filter((x) => x.id !== e.id), "기록을 지웠어요.")}>삭제</button>
                )}
              </div>
              {open[e.id] && (
                <div className="match-box">
                  {m.length ? m.map((d) => (
                    <div key={d.id}>
                      <b>{d.title}</b> <span className={`luck ${d.luck}`}>{LUCK_LABEL[d.luck]}</span>
                      <p>{d.text}</p>
                    </div>
                  )) : <p>사전에서 맞는 꿈을 찾지 못했어요. AI 해몽이 열리면 꿈 내용 전체를 읽고 풀어 드려요.</p>}
                </div>
              )}
            </article>
          );
        })}
      </div>

      <div className="panel mt">
        <h3 className="panel-h">백업</h3>
        <p className="muted" style={{ marginTop: 0 }}>일기는 이 기기 브라우저에만 저장돼요. 기기를 바꾸기 전에 내보내기로 백업하세요.</p>
        <div className="backup">
          <button type="button" className="btn ghost sm" onClick={exportJson}>내보내기 (JSON)</button>
          <button type="button" className="btn ghost sm" onClick={() => fileRef.current?.click()}>가져오기</button>
          <input
            ref={fileRef}
            id="diary-import"
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void importJson(f);
              e.target.value = "";
            }}
          />
        </div>
      </div>
    </>
  );
}
