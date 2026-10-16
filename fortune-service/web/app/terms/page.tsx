import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "이용 안내 · 운결" };

const SECTIONS: { title: string; items: string[] }[] = [
  {
    title: "오락 목적의 서비스예요",
    items: [
      "운결의 모든 운세, 사주 풀이, 타로, 꿈해몽, 별자리·띠별 운세, 전생·배우자 결과는 재미와 공부를 위해 만든 콘텐츠예요.",
      "결과는 과학적으로 검증된 예측이 아니며, 실제로 일어날 일을 보장하지 않아요.",
      "같은 생년월일이라도 계산 방식이나 기준에 따라 다른 결과가 나올 수 있어요.",
    ],
  },
  {
    title: "전문적인 조언을 대신하지 않아요",
    items: [
      "건강운은 의학적 진단이나 치료 안내가 아니에요. 몸이 불편하면 꼭 의료 전문가와 상담하세요.",
      "재물운은 투자·금융 조언이 아니에요. 돈과 관련된 결정은 스스로 판단하고 필요하면 전문가와 상의하세요.",
      "로또 번호 뽑기는 무작위 추첨이며 당첨과 아무 관계가 없어요.",
      "연애·결혼·진로처럼 중요한 결정을 운세 결과만 보고 내리지 마세요.",
    ],
  },
  {
    title: "책임의 한계",
    items: [
      "운결의 결과를 근거로 한 판단이나 행동, 그로 인해 생긴 손해에 대해 운결은 책임지지 않아요.",
      "운결은 공부용 개인 프로젝트로, 서비스 내용은 예고 없이 바뀌거나 중단될 수 있어요.",
    ],
  },
  {
    title: "내 정보는 내 기기에만 저장돼요",
    items: [
      "생년월일, 궁합 상대 정보, 꿈 일기는 서버로 보내지 않고 이 브라우저에만 저장해요.",
      "브라우저 데이터를 지우면 기록도 사라지니, 꿈 일기는 내보내기로 백업해 두세요.",
    ],
  },
  {
    title: "출처와 라이선스",
    items: [
      "타로 카드 이미지: Rider-Waite 타로(1909, Pamela Colman Smith) — 퍼블릭 도메인",
      "사주 계산: manseryeok (MIT 라이선스)",
      "글꼴: Gowun Batang, IBM Plex Sans KR (SIL Open Font License)",
      "운세·꿈해몽 문장은 운결이 직접 작성했어요.",
    ],
  },
];

export default function TermsPage() {
  return (
    <div style={{ maxWidth: 720 }}>
      <Link href="/" className="back">‹ 홈으로</Link>
      <h1 className="pagetitle">이용 안내</h1>
      <p className="lead">운결을 이용하기 전에 알아두세요.</p>
      <div style={{ display: "grid", gap: 14 }}>
        {SECTIONS.map((s) => (
          <section key={s.title} className="panel">
            <h2 className="panel-h">{s.title}</h2>
            <ul style={{ margin: 0, paddingLeft: 18, display: "grid", gap: 6, color: "var(--muted)" }}>
              {s.items.map((t) => <li key={t}>{t}</li>)}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
