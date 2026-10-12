import dreams from "@/data/dreams.json";

export type Luck = "good" | "bad" | "mid";
export type Dream = { id: number; category: string; title: string; luck: Luck; text: string };
type RawDream = Omit<Dream, "id">;
export const DREAMS: Dream[] = (dreams as RawDream[]).map((d, i) => ({ id: i + 1, ...d }));
export const DREAM_CATS = ["전체", "동물", "사람", "자연", "몸", "행동", "사물"];
export const LUCK_LABEL: Record<Luck, string> = { good: "길몽", bad: "주의", mid: "보통" };

export function searchDreams(q: string, cat: string) {
  const k = q.trim().replace(/\s*꿈$/, "");
  return DREAMS.filter((d) => (cat === "전체" || d.category === cat) && (!k || d.title.includes(k) || d.text.includes(k)));
}

/** 꿈 제목에서 핵심 단어 (예: "돼지에게 물리는 꿈" → 돼지) */
export const dreamKey = (d: Dream) => {
  const core = d.title.replace(/\s*꿈$/, "");
  return { core, key: core.split(" ")[0].replace(/(에게|에서|이|가|에|을|를)$/, "") };
};

/** 일기 문장에서 사전과 맞는 꿈 최대 3개 */
export function matchDreams(text: string) {
  const r: [number, Dream][] = [];
  for (const d of DREAMS) {
    const { core, key } = dreamKey(d);
    let s = 0;
    if (text.includes(core)) s = 2;
    else if (key.length >= 2 ? text.includes(key) : new RegExp(key + "(가|이|를|을|에|의|는|도|랑|와|\\s|꿈|$)").test(text)) s = 1;
    if (s) r.push([s, d]);
  }
  return r.sort((a, b) => b[0] - a[0]).slice(0, 3).map((x) => x[1]);
}
