import type { Metadata } from "next";
import { ZodiacView } from "@/components/Zodiac";

export const metadata: Metadata = { title: "별자리 운세 · 운결" };

export default function ZodiacPage() {
  return <ZodiacView />;
}
