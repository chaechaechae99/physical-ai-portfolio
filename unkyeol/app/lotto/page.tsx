import type { Metadata } from "next";
import { Lotto } from "./Lotto";

export const metadata: Metadata = { title: "로또 번호 뽑기 · 운결" };

export default function LottoPage() {
  return <Lotto />;
}
