"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Items, Loading, PageTitle, Ring } from "@/components/ui";
import { useProfile } from "@/components/ProfileProvider";
import { LUCKY_COLOR, LUCKY_ITEM, STAR_ALL, STAR_LOVE, STAR_MONEY, STAR_WORK } from "@/lib/fortune/content";
import { ZODIAC, signOf } from "@/lib/saju/simple";
import { pickR, seedOf, todayStr } from "@/lib/util";

const mdTxt = (n: number) => `${Math.floor(n / 100)}.${n % 100}`;

/** 별자리 운세. sign이 없으면 내 별자리를 보여준다. */
export function ZodiacView({ signId }: { signId?: string }) {
  const { saju, ready } = useProfile();
  const router = useRouter();
  const mine = saju.sign;
  const idx = signId ? ZODIAC.findIndex((z) => z.id === signId) : mine;

  return (
    <>
      <PageTitle title="별자리 운세" lead="내 별자리를 고르거나 생일을 넣어 찾아보세요. 운세는 매일 바뀌어요." />
      <div className="finder">
        <label htmlFor="zodiac-bd">생일로 찾기</label>
        <input
          id="zodiac-bd"
          type="date"
          onChange={(e) => {
            const v = e.target.value;
            if (!v) return;
            const [, m, d] = v.split("-").map(Number);
            router.push(`/zodiac/${ZODIAC[signOf(m, d)].id}`);
          }}
        />
      </div>
      <div className="zgrid">
        {ZODIAC.map((z, i) => (
          <Link key={z.id} href={`/zodiac/${z.id}`} className="zbtn" aria-current={ready && i === idx}>
            <span className="sym">{z.sym}&#xFE0E;</span>
            <b>{z.name}{ready && i === mine ? " · 나" : ""}</b>
            <small>{mdTxt(z.start)}~{mdTxt(z.end)}</small>
          </Link>
        ))}
      </div>
      {ready ? <Reading idx={idx} /> : <Loading />}
    </>
  );
}

function Reading({ idx }: { idx: number }) {
  const z = ZODIAC[idx];
  const today = todayStr();
  const r = seedOf(`star${idx}${today}`);
  const sc = 55 + Math.floor(r() * 41);
  const all = pickR(r, STAR_ALL), love = pickR(r, STAR_LOVE), work = pickR(r, STAR_WORK), money = pickR(r, STAR_MONEY);
  let mate = Math.floor(r() * 12);
  if (mate === idx) mate = (mate + 4) % 12;
  const color = pickR(r, LUCKY_COLOR), n1 = 1 + Math.floor(r() * 9), n2 = 10 + Math.floor(r() * 36), item = pickR(r, LUCKY_ITEM);
  return (
    <>
      <Ring n={sc} title={`${z.sym}︎ ${z.name} · 오늘의 총운`} desc={all} />
      <Items rows={[["애정", love], ["일 · 학업", work], ["금전", money]]} />
      <div className="lucky mt">
        <div><small>행운의 색</small><b>{color}</b></div>
        <div><small>행운의 숫자</small><b>{n1} · {n2}</b></div>
        <div><small>잘 맞는 별자리</small><b>{ZODIAC[mate].name}</b></div>
        <div><small>행운의 아이템</small><b>{item}</b></div>
      </div>
      <p className="note">{today.replace(/-/g, ".")} 기준 · 같은 날에는 같은 결과가 나와요. 재미로만 봐주세요.</p>
    </>
  );
}
