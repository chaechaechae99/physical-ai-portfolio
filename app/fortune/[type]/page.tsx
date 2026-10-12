import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FortuneByType } from "./FortuneByType";
import { FORTUNE_TITLES, type FortuneType } from "@/lib/fortune/types";

const TYPES = Object.keys(FORTUNE_TITLES) as FortuneType[];

export function generateStaticParams() {
  return TYPES.map((type) => ({ type }));
}

export async function generateMetadata({ params }: { params: Promise<{ type: string }> }): Promise<Metadata> {
  const { type } = await params;
  return { title: `${FORTUNE_TITLES[type as FortuneType] ?? "운세"} · 운결` };
}

export default async function FortunePage({ params }: { params: Promise<{ type: string }> }) {
  const { type } = await params;
  if (!TYPES.includes(type as FortuneType)) notFound();
  return <FortuneByType type={type as FortuneType} />;
}
