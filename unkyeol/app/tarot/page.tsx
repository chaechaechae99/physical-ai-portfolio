import type { Metadata } from "next";
import { Tarot } from "./Tarot";

export const metadata: Metadata = { title: "오늘의 타로 · 운결" };

export default function TarotPage() {
  return <Tarot />;
}
