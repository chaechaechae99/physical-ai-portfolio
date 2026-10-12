export const FORTUNE_TITLES = {
  today: "오늘의 운세",
  wealth: "재물운",
  match: "사주 궁합",
  week: "주간 운세",
  month: "월간 운세",
  year: "신년 운세",
  life: "평생 운세",
} as const;
export type FortuneType = keyof typeof FORTUNE_TITLES;
