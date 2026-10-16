// 사주 엔진을 크롤링 정답셋(양력·음력 22건)과 비교한다.
// 실행: npm run test:saju
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { engineSaju } from "../lib/saju/engine.ts";
import { daeun, simpleSaju, type Calendar, type Saju } from "../lib/saju/simple.ts";

type Answer = {
  memo: string;
  input: { gender: "M" | "F"; cal: Calendar; year: number; month: number; day: number; hour: string };
  solar: string;
  pillars: Record<"year" | "month" | "day" | "hour", { ganji: string }>;
  daeun: { start_age: number; list: { age: number; ganji: string }[] };
};

const file = fileURLToPath(new URL("../../data/saju_answers.json", import.meta.url));
const answers: Answer[] = JSON.parse(readFileSync(file, "utf8"));

const pad = (n: number) => String(n).padStart(2, "0");
const names = ["년주", "월주", "일주", "시주", "대운수", "첫 대운"] as const;

function check(label: string, calc: (a: Answer) => Saju | null) {
  const pass = names.map(() => 0);
  let n = 0;
  const fails: string[] = [];
  for (const a of answers) {
    const s = calc(a);
    if (!s) continue;
    n++;
    const du = daeun(s);
    const got = [s.Y.s, s.M.s, s.D.s, s.H?.s ?? "?", String(du.start), du.list[0]?.s ?? "?"];
    const want = [
      a.pillars.year.ganji, a.pillars.month.ganji, a.pillars.day.ganji, a.pillars.hour.ganji,
      String(a.daeun.start_age), a.daeun.list[0].ganji,
    ];
    want.forEach((w, i) => {
      if (got[i] === w) pass[i]++;
      else fails.push(`  ${a.memo} (${a.input.cal} ${a.input.year}.${a.input.month}.${a.input.day} ${a.input.hour}시) ${names[i]}: ${got[i]} ≠ ${w}`);
    });
  }
  console.log(`\n${label} · ${n}건`);
  console.log("  " + names.map((nm, i) => `${nm} ${pass[i]}/${n}`).join("  "));
  if (fails.length) console.log("  불일치:\n" + fails.join("\n"));
  return { pass, n };
}

const profileOf = (a: Answer) => ({
  gender: a.input.gender,
  cal: a.input.cal,
  date: `${a.input.year}-${pad(a.input.month)}-${pad(a.input.day)}`,
  hour: Number(a.input.hour) / 2, // "24"(夜子) → 12
});

// 1) 정식 엔진 (manseryeok) — 양력·음력 전부
const main = check("정식 엔진 (manseryeok)", (a) => engineSaju(profileOf(a)));

// 2) 참고: 간이 엔진 — 양력 사례만
check("참고: 간이 엔진 (양력만)", (a) => (a.input.cal === "S" ? simpleSaju(profileOf(a)) : null));

// 기준: 정식 엔진의 4기둥은 전부 일치해야 한다 (대운수는 학파·반올림 차이가 있어 경고만)
const pillarsOk = main.pass.slice(0, 4).every((p) => p === main.n);
if (!pillarsOk) {
  console.error("\nFAIL: 정식 엔진의 사주팔자가 정답셋과 다릅니다");
  process.exit(1);
}
console.log("\nOK: 정식 엔진 사주팔자 4기둥 전부 일치");
