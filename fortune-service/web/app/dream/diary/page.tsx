import type { Metadata } from "next";
import { Suspense } from "react";
import { Diary } from "./Diary";

export const metadata: Metadata = { title: "꿈 일기장 · 운결" };

export default function DiaryPage() {
  return (
    <Suspense>
      <Diary />
    </Suspense>
  );
}
