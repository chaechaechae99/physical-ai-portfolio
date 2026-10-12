import cards from "@/data/tarot.json";
import { eulReul, iga, pickR, seedOf } from "@/lib/util";

export type TarotCard = {
  id: number; num: string; name: string; en: string; theme: string;
  /** 정방향 기운 -2~2 */ tone: number;
  /** 역방향 기운 -2~2 */ toneR: number;
  kw: string[]; kwR: string[];
  upright: string; reversed: string; love: string; work: string; money: string; advice: string;
};
export const TAROT = cards as TarotCard[];

export type Topic = "all" | "love" | "work" | "money";
export const TOPICS: { id: Topic; label: string }[] = [
  { id: "all", label: "오늘 전반" },
  { id: "love", label: "연애" },
  { id: "work", label: "일·학업" },
  { id: "money", label: "금전" },
];
export const POSITIONS = ["과거", "현재", "미래"] as const;

export type Drawn = { card: TarotCard; reversed: boolean };

/** 역방향 반영한 기운 (-2~2) */
export const effTone = (d: Drawn) => (d.reversed ? d.card.toneR : d.card.tone);

export const keywordsOf = (d: Drawn) => (d.reversed ? d.card.kwR : d.card.kw);

/** 주제에 맞는 카드 한 줄 (역방향은 역방향 해석) */
export const topicLine = (d: Drawn, topic: Topic) => {
  if (topic === "all") return d.reversed ? d.card.reversed : d.card.upright;
  return d.reversed ? `${d.card[topic]} 다만 역방향으로 나와서 이 흐름이 더디게 들어와요.` : d.card[topic];
};

export type Trend = "up" | "flat" | "down";
export const TREND_LABEL: Record<Trend, string> = { up: "상승", flat: "유지", down: "하락" };

const ARC: Record<Trend, string[]> = {
  up: [
    "흐름이 아래에서 위로 올라가는 모양이에요. 지난 고비가 오히려 발판이 되고 있어요.",
    "시작은 무거웠지만 갈수록 가벼워지는 흐름이에요. 지금의 노력이 곧 보상으로 바뀌어요.",
  ],
  flat: [
    "큰 굴곡 없이 비슷한 결이 이어지는 흐름이에요. 지금 페이스를 유지하는 게 가장 좋은 전략이에요.",
    "급하게 바뀌는 건 없지만 그만큼 안정적이에요. 조용히 쌓는 시기로 보면 돼요.",
  ],
  down: [
    "좋았던 기운이 조금씩 가라앉는 흐름이에요. 지금 속도를 늦추고 정리하면 큰 손해는 없어요.",
    "앞으로 신경 쓸 일이 하나 생길 수 있어요. 미리 알고 대비하면 충분히 넘길 수 있는 정도예요.",
  ],
};

const THEME_LINE: Record<string, string> = {
  시작: "세 장 모두 '새로 여는 것'에 무게가 실려 있어요. 망설이던 시작을 미루지 않는 게 핵심이에요.",
  성취: "결과와 성과의 기운이 강하게 모여 있어요. 지금 하는 일을 끝까지 밀어붙일 가치가 있어요.",
  관계: "사람과의 연결이 이번 리딩의 중심이에요. 누구와 함께하느냐가 결과를 바꿔요.",
  안정: "기본과 균형을 지키라는 메시지가 반복돼요. 화려한 한 방보다 꾸준함이 이겨요.",
  내면: "밖보다 내 마음 안쪽을 들여다보라는 신호가 겹쳐요. 답은 이미 내 안에 있어요.",
  변화: "판이 바뀌는 기운이 겹쳐 있어요. 변화를 막기보다 올라타는 쪽이 유리해요.",
  갈등: "끊어내야 할 것이 보이는 리딩이에요. 불편해도 정리하고 나면 훨씬 가벼워져요.",
  희망: "다시 기대해도 좋다는 메시지가 담겨 있어요. 지친 마음을 회복하는 데 집중해요.",
};

const TOPIC_FOCUS: Record<Topic, string> = {
  all: "오늘 하루 전체로 보면",
  love: "연애 쪽으로 보면",
  work: "일과 공부 쪽으로 보면",
  money: "돈 흐름으로 보면",
};

export type Reading = {
  trend: Trend;
  summary: string[];
  advice: string;
  keywords: string[];
  answer: string | null;
};

export function readSpread(spread: Drawn[], topic: Topic, question: string): Reading {
  const [past, now, future] = spread;
  const tones = spread.map(effTone);
  const diff = tones[2] - tones[0] + (tones[1] - tones[0]) / 2;
  const trend: Trend = diff >= 1 ? "up" : diff <= -1 ? "down" : "flat";
  const r = seedOf(spread.map((d) => d.card.id + (d.reversed ? "r" : "")).join("-") + topic);

  const themes: Record<string, number> = {};
  spread.forEach((d, i) => (themes[d.card.theme] = (themes[d.card.theme] ?? 0) + (i === 1 ? 1.5 : 1)));
  const dominant = Object.entries(themes).sort((a, b) => b[1] - a[1])[0][0];

  // 조사는 카드 이름에 맞춰 붙인다 (예: 달(역방향)을)
  const nm = (d: Drawn, josa: (w: string) => string = () => "") => `${d.card.name}${d.reversed ? "(역방향)" : ""}${josa(d.card.name)}`;
  const k0 = keywordsOf(past)[0];
  const k1 = keywordsOf(now)[0];
  const k2 = keywordsOf(future)[0];

  const summary = [
    `과거 자리의 ${nm(past, iga)} 보여주듯, 지금까지는 '${k0}'의 시간이었어요.`,
    `현재는 ${nm(now)}의 '${k1}' 기운이 중심에 있어요. ${TOPIC_FOCUS[topic]} ${topicLine(now, topic)}`,
    `미래 자리의 ${nm(future, eulReul)} 보면 ${tones[2] >= 0 ? `'${k2}' 쪽으로 이어질 가능성이 커요.` : `'${k2}'${eulReul(k2)} 조심하라는 신호가 있어요.`}`,
    pickR(r, ARC[trend]),
    THEME_LINE[dominant] ?? "",
  ].filter(Boolean);

  const reversedCount = spread.filter((d) => d.reversed).length;
  if (reversedCount >= 2) summary.push("역방향 카드가 많아요. 지금은 밀어붙이기보다 막힌 곳을 먼저 살피는 때예요.");

  const keywords = Array.from(new Set(spread.flatMap((d) => keywordsOf(d).slice(0, 2))));

  let answer: string | null = null;
  const q = question.trim();
  if (q) {
    const score = tones[2] * 2 + tones[1];
    answer =
      score >= 3 ? "카드는 '좋아요, 해 보세요' 쪽이에요. 타이밍도 나쁘지 않아요."
        : score >= 1 ? "가능성은 열려 있어요. 준비를 조금 더 하면 결과가 좋아져요."
          : score >= -1 ? "아직은 반반이에요. 서두르지 말고 상황을 한 번 더 지켜봐요."
            : "지금은 멈추라는 쪽이에요. 시기를 늦추거나 방법을 바꿔 보세요.";
  }

  return { trend, summary, advice: future.reversed ? now.card.advice : future.card.advice, keywords, answer };
}

/** 22장 중 3장, 역방향 약 30% */
export function shuffleDeck(): Drawn[] {
  const ids = TAROT.map((c) => c.id);
  for (let i = ids.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [ids[i], ids[j]] = [ids[j], ids[i]];
  }
  return ids.map((id) => ({ card: TAROT[id], reversed: Math.random() < 0.3 }));
}
