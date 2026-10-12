// 간이 만세력을 크롤링 정답셋(양력 사례)과 비교한다.
// 실행: npm run test:saju   (Node 22.18+ / 24의 TypeScript 타입 제거 기능 사용)
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { saju } from "../lib/saju/simple.ts";

type Answer = {
  memo: string;
  input: { gender: "M" | "F"; cal: string; hour: string };
  solar: string;
  pillars: Record<"year" | "month" | "day" | "hour", { ganji: string }>;
};

const file = fileURLToPath(new URL("../../data/saju_answers.json", import.meta.url));
const answers: Answer[] = JSON.parse(readFileSync(file, "utf8"));
const cases = answers.filter((a) => a.input.cal === "S");

const names = ["년주", "월주", "일주", "시주"] as const;
const keys = ["year", "month", "day", "hour"] as const;
const pass = [0, 0, 0, 0];
const fails: string[] = [];

for (const a of cases) {
  const [y, m, d] = a.solar.split(".").map(Number);
  const date = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  const t = saju({ gender: a.input.gender, date, hour: Number(a.input.hour) / 2 });
  const got = [t.Y.s, t.M.s, t.D.s, t.H?.s ?? "?"];
  keys.forEach((k, i) => {
    const want = a.pillars[k].ganji;
    if (got[i] === want) pass[i]++;
    else fails.push(`  ${a.memo} (${date} ${a.input.hour}시) ${names[i]}: ${got[i]} ≠ ${want}`);
  });
}

const n = cases.length;
console.log(`간이 만세력 검증 · 양력 ${n}건`);
names.forEach((nm, i) => console.log(`  ${nm} ${pass[i]}/${n}`));
if (fails.length) console.log("불일치:\n" + fails.join("\n"));

// 일주·시주는 100%가 기준 (년·월주는 절기 근사라 경계일 오차 허용)
if (pass[2] !== n || pass[3] !== n) {
  console.error("FAIL: 일주/시주가 정답셋과 다릅니다");
  process.exit(1);
}
console.log("OK: 일주/시주 전부 일치");
