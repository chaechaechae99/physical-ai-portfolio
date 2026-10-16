import Link from "next/link";
import { DreamSearchBand } from "@/components/DreamSearchBand";
import { Icon, type IconName } from "@/components/Icons";

const BIG: { href: string; title: string; desc: string; icon: IconName; span: string }[] = [
  { href: "/fortune/today", title: "오늘의 운세", desc: "오늘의 총운과 애정, 일, 건강을 점수와 함께 알려드려요.", icon: "sun", span: "span3" },
  { href: "/fortune/match", title: "사주 궁합", desc: "두 사람의 오행이 서로 살리는지, 부딪히는지 확인해요.", icon: "heart", span: "span3" },
  { href: "/fortune/wealth", title: "재물운", desc: "올해 돈의 흐름과 피해야 할 지출.", icon: "coin", span: "span2" },
  { href: "/fortune/life", title: "평생 운세", desc: "타고난 성격과 10년 단위 대운의 흐름.", icon: "yin", span: "span2" },
  { href: "/fortune/year", title: "신년 운세", desc: "열두 달의 흐름과 올해의 키워드 세 가지.", icon: "year", span: "span2" },
];

const SMALL_FORTUNE: { href: string; title: string; desc: string; icon: IconName }[] = [
  { href: "/fortune/week", title: "주간 운세", desc: "요일별 점수와 한 줄 조언", icon: "week" },
  { href: "/fortune/month", title: "월간 운세", desc: "이번 달 길일과 주의일", icon: "month" },
];

const MYSTIC: { href: string; title: string; desc: string; icon: IconName }[] = [
  { href: "/dream", title: "꿈해몽", desc: "키워드·카테고리 검색", icon: "moon" },
  { href: "/dream/diary", title: "꿈 일기장", desc: "꾼 꿈을 적고 해몽 모아보기", icon: "diary" },
  { href: "/tarot", title: "오늘의 타로", desc: "카드 3장과 종합 해설", icon: "tarot" },
  { href: "/zodiac", title: "별자리 운세", desc: "12별자리 오늘의 흐름", icon: "star" },
  { href: "/zodiac-animal", title: "띠별 운세", desc: "내 띠와 출생년도별 한마디", icon: "tti" },
  { href: "/past-life", title: "나의 전생 찾기", desc: "전생에 나는 누구였을까", icon: "crown" },
  { href: "/spouse", title: "미래 배우자", desc: "나는 누구랑 결혼했을까?", icon: "ring" },
  { href: "/lotto", title: "로또 번호 뽑기", desc: "추첨기로 랜덤 뽑기", icon: "lotto" },
];

export default function Home() {
  return (
    <>
      <section>
        <DreamSearchBand />
      </section>

      <section>
        <div className="sec-h"><h2>운세</h2></div>
        <div className="big">
          {BIG.map((c) => (
            <Link key={c.href} href={c.href} className={`card ${c.span}`}>
              <div>
                <h3>{c.title}</h3>
                <p>{c.desc}</p>
              </div>
              <Icon name={c.icon} />
            </Link>
          ))}
        </div>
        <div className="small two">
          {SMALL_FORTUNE.map((c) => (
            <Link key={c.href} href={c.href} className="scard">
              <div><b>{c.title}</b><span>{c.desc}</span></div>
              <Icon name={c.icon} />
            </Link>
          ))}
        </div>
      </section>

      <section>
        <div className="sec-h"><h2>신비</h2></div>
        <div className="small">
          {MYSTIC.map((c) => (
            <Link key={c.href} href={c.href} className="scard">
              <div><b>{c.title}</b><span>{c.desc}</span></div>
              <Icon name={c.icon} />
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
