import type { Metadata } from "next";
import { Tti } from "./Tti";

export const metadata: Metadata = { title: "띠별 운세 · 운결" };

export default function TtiPage() {
  return <Tti />;
}
