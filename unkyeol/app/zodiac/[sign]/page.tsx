import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ZodiacView } from "@/components/Zodiac";
import { ZODIAC } from "@/lib/saju/simple";

export function generateStaticParams() {
  return ZODIAC.map((z) => ({ sign: z.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ sign: string }> }): Promise<Metadata> {
  const { sign } = await params;
  const z = ZODIAC.find((x) => x.id === sign);
  return { title: `${z?.name ?? "별자리"} 운세 · 운결` };
}

export default async function ZodiacSignPage({ params }: { params: Promise<{ sign: string }> }) {
  const { sign } = await params;
  if (!ZODIAC.some((z) => z.id === sign)) notFound();
  return <ZodiacView signId={sign} />;
}
