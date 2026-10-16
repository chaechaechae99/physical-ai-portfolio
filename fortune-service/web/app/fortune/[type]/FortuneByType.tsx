"use client";

import { Life, Match, Month, Today, Wealth, Week, Year } from "@/components/FortuneViews";
import type { FortuneType } from "@/lib/fortune/types";

const VIEWS: Record<FortuneType, () => React.ReactNode> = {
  today: Today, wealth: Wealth, match: Match, week: Week, month: Month, year: Year, life: Life,
};

export function FortuneByType({ type }: { type: FortuneType }) {
  const View = VIEWS[type];
  return <View />;
}
