import type { Metadata } from "next";
import { Spouse } from "@/components/FortuneViews";
import { SpouseShare } from "./SpouseShare";

export const metadata: Metadata = { title: "미래 배우자 · 운결" };

export default function SpousePage() {
  return (
    <>
      <Spouse />
      <SpouseShare />
    </>
  );
}
