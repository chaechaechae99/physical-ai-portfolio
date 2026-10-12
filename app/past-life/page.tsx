import type { Metadata } from "next";
import { PastLife } from "@/components/FortuneViews";
import { PastLifeShare } from "./PastLifeShare";

export const metadata: Metadata = { title: "나의 전생 찾기 · 운결" };

export default function PastLifePage() {
  return (
    <>
      <PastLife />
      <PastLifeShare />
    </>
  );
}
