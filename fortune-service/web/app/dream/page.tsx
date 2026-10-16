import type { Metadata } from "next";
import { Suspense } from "react";
import { DreamSearch } from "./DreamSearch";

export const metadata: Metadata = { title: "꿈해몽 · 운결" };

export default function DreamPage() {
  return (
    <Suspense>
      <DreamSearch />
    </Suspense>
  );
}
