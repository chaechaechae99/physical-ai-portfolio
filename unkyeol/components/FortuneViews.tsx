"use client";

import { useState } from "react";
import { Icon } from "@/components/Icons";
import { useProfile } from "@/components/ProfileProvider";
import {
  Cols, Items, Legend, Loading, LuckyRow, Note, OhengPanel, PillarsPanel, ProfileHead, Ring,
} from "@/components/ui";
import {
  EARLY, EL_INFO, ERA, FAMILY, LATE, LOVE, MATCH_CONFLICT, MATCH_TIP, MATCH_TYPE, MID, PAST_ID, PAST_TIE,
  PAST_TRACE, PAST_TRAIT, REL, REL_LINE, SP_LOOK, SP_MEET, SP_PER, SP_TITLE, TODAY_ALL, WORK, YEAR_KW,
} from "@/lib/fortune/content";
import { BR_PT, brRel, pScore, scoreOf } from "@/lib/fortune/score";
import {
  EL, EL_KO, GAN, GAN_EL, HOUR_TXT, JI, JI_EL, JI_KO, TTI, dateP, dayP, daeun, isValidProfile, mod, monthP,
  relOf, saju as calcSaju, yearP, type Profile, type Saju,
} from "@/lib/saju/simple";
import { clamp, euro, eun, iga, maxBy, minBy, pickR, seedOf, store, todayStr, ymd } from "@/lib/util";

const readEl = (e: keyof typeof EL_KO) => EL_KO[e];

/** 프로필을 읽은 뒤에만 그린다 (날짜·저장값에 따라 달라지는 화면) */
function useReadySaju(): Saju | null {
  const { saju, ready } = useProfile();
  return ready ? saju : null;
}

function Shell({ title, children }: { title: string; children: React.ReactNode }) {
  const { ready } = useProfile();
  return (
    <>
      <ProfileHead title={title} />
      {ready ? children : <Loading />}
    </>
  );
}

/* ---------- 오늘의 운세 ---------- */
export function Today() {
  const s = useReadySaju();
  return <Shell title="오늘의 운세">{s && <TodayBody s={s} />}</Shell>;
}
function TodayBody({ s }: { s: Saju }) {
  const t = dateP(new Date());
  const r = seedOf(s.key + "today" + todayStr());
  const el = GAN_EL[t.g];
  const k = relOf(s.me, el);
  const sc = scoreOf(s, el, r);
  const all = pickR(r, TODAY_ALL), love = pickR(r, LOVE), work = pickR(r, WORK);
  return (
    <>
      <div className="grid2"><PillarsPanel s={s} /><OhengPanel s={s} /></div>
      <div className="mt">
        <Ring n={sc} title={REL[k].t} desc={`오늘 일진 ${t.s}(${el})${eun(readEl(el))} 나에게 ${REL[k].n}이에요. ${REL[k].d}`} />
      </div>
      <Items rows={[
        ["총운", all], ["애정", love], ["일 · 학업", work],
        ["건강", `${EL_INFO[s.most].organ} 쪽이 예민한 사주예요. ${EL_INFO[s.most].tip}`],
      ]} />
      <LuckyRow s={s} r={r} />
      <Note />
    </>
  );
}

/* ---------- 재물운 ---------- */
export function Wealth() {
  const s = useReadySaju();
  return <Shell title="재물운">{s && <WealthBody s={s} />}</Shell>;
}
function WealthBody({ s }: { s: Saju }) {
  const wEl = EL[mod(EL.indexOf(s.me) + 2, 5)];
  const wc = s.cnt[wEl];
  const yr = new Date().getFullYear();
  const r = seedOf(s.key + "coin" + yr);
  const M: [string, number][] = Array.from({ length: 12 }, (_, i) => {
    const x = monthP(yr, i + 1, 15);
    let v = pScore(s, x, r);
    if (GAN_EL[x.g] === wEl || JI_EL[x.j] === wEl) v = Math.min(98, v + 8);
    return [`${i + 1}월`, v];
  });
  const hi = maxBy(M, (x) => x[1])[0], lo = minBy(M, (x) => x[1])[0];
  const avg = Math.round(M.reduce((a, b) => a + b[1], 0) / 12);
  const title = wc === 0 ? "일이 곧 재테크인 사주" : wc >= 3 ? "돈 기운이 넘치는 사주" : "벌고 모으는 균형형 사주";
  const desc = wc === 0
    ? `재물을 뜻하는 ${wEl} 기운이 사주에 드러나 있지 않아요. 돈이 저절로 들어오기보다 실력에서 만들어지는 타입이라 커리어가 곧 재테크예요.`
    : wc >= 3
      ? `재물을 뜻하는 ${wEl} 기운이 ${wc}개나 있어요. 돈 감각은 좋은데 들어온 만큼 나가기 쉬우니 지키는 습관이 핵심이에요.`
      : `재물을 뜻하는 ${wEl} 기운이 ${wc}개 있어요. 꾸준히 벌고 차곡차곡 모으는 방식이 가장 잘 맞아요.`;
  const DO = s.strong
    ? ["목표 금액을 정하고 적극적으로 모으기", "사이드 프로젝트나 부업 시도해 보기", "공부한 뒤 소액으로 투자 연습하기", "연봉 협상이나 몸값 올리기에 도전"]
    : ["자동이체 저축으로 새는 돈 막기", "돈 관리는 믿을 만한 사람·앱에 맡기기", "언제든 현금화할 수 있는 곳에 보관", "고정지출을 매달 한 번 점검"];
  const DONT = s.strong
    ? ["혼자 판단으로 큰돈 한 번에 넣기", "지인 보증이나 돈 거래", "기분 따라 하는 충동 쇼핑"]
    : ["고위험 투자, 레버리지", "\"지금 아니면 늦는다\"는 급한 제안", "부담되는 장기 할부"];
  return (
    <>
      <Ring n={avg} title={title} desc={desc} />
      <div className="panel mt">
        <h3 className="panel-h">{yr}년 월별 재물 흐름</h3>
        <Cols rows={M} hi={hi} lo={lo} />
        <Legend hi="가장 좋은 달" lo="가장 조심할 달" />
      </div>
      <div className="panel mt dolist">
        <div><h4 className="good-t">이렇게 해보세요</h4><ul>{DO.map((x) => <li key={x}>{x}</li>)}</ul></div>
        <div><h4 className="bad-t">이건 피하세요</h4><ul>{DONT.map((x) => <li key={x}>{x}</li>)}</ul></div>
      </div>
      <div className="grid2 mt">
        <OhengPanel s={s} />
        <div className="panel items">
          <div><h4>돈이 들어오는 길</h4><p>{EL_INFO[s.me].way}에서 돈이 따라와요. {s.strong ? "기운이 강해서 직접 부딪히는 쪽이 유리해요." : "혼자보다 팀이나 조직 안에서 벌 때 더 안정적이에요."}</p></div>
          <div><h4>잘 맞는 분야</h4><p>{[...EL_INFO[s.me].jobs.slice(0, 2), ...EL_INFO[wEl].jobs.slice(0, 2)].join(", ")}</p></div>
          <div><h4>올해 가장 좋은 달</h4><p>{hi}에 큰 결정을, {lo}에는 지출 점검을 하세요.</p></div>
        </div>
      </div>
      <Note />
    </>
  );
}

/* ---------- 사주 궁합 ---------- */
const PT_KEY = "unkyeol-partner-v1";
const SAMPLE_PT: Profile = { gender: "F", date: "1992-05-20", hour: 4 };

export function Match() {
  const s = useReadySaju();
  return <Shell title="사주 궁합">{s && <MatchBody s={s} />}</Shell>;
}
function MatchBody({ s }: { s: Saju }) {
  const [pt, setPt] = useState<Profile>(() => {
    const v = store.get<Profile>(PT_KEY);
    return isValidProfile(v) ? v : SAMPLE_PT;
  });
  const [form, setForm] = useState<Profile>(pt);
  const [msg, setMsg] = useState("");
  const o = calcSaju(pt);
  const r = seedOf(s.key + "match" + o.key);
  const k = relOf(s.me, o.me);
  const stemPt = [6, 12, -4, -4, 12][k];
  const br = brRel(s.D.j, o.D.j);
  const dayPt = BR_PT[br];
  const ttiPt = BR_PT[brRel(s.Y.j, o.Y.j)];
  const comp = (o.cnt[s.least] >= 2 ? 8 : 0) + (s.cnt[o.least] >= 2 ? 8 : 0);
  const n = () => Math.round((r() - 0.5) * 8);
  const S: [string, number][] = ([
    ["연인 궁합", 62 + stemPt + dayPt * 0.8 + comp / 2 + n()],
    ["결혼 궁합", 58 + dayPt * 1.2 + comp + stemPt / 2 + n()],
    ["친구 궁합", 66 + ttiPt + stemPt + n()],
    ["직장 궁합", 62 + stemPt / 2 + comp / 2 + ttiPt / 2 + n()],
  ] as [string, number][]).map(([a, b]) => [a, Math.round(clamp(b, 35, 97))]);
  const avg = Math.round(S.reduce((a, b) => a + b[1], 0) / 4);
  const brText =
    br === "yukhap" ? `${JI[s.D.j]}와 ${JI[o.D.j]}가 서로 끌어당기는 육합이에요. 생활 리듬이 잘 맞아요.`
      : br === "samhap" ? `${JI[s.D.j]}와 ${JI[o.D.j]}가 한 팀을 이루는 삼합이에요. 같은 목표가 있으면 무서울 게 없어요.`
        : br === "chung" ? `${JI[s.D.j]}와 ${JI[o.D.j]}가 부딪히는 충이에요. 싸움이 잦을 수 있지만 그만큼 서로를 바꿔놔요.`
          : `${JI[s.D.j]}와 ${JI[o.D.j]}는 무난한 사이예요. 노력한 만큼 가까워져요.`;
  return (
    <>
      <form
        className="panel form"
        onSubmit={(e) => {
          e.preventDefault();
          if (!isValidProfile(form)) {
            setMsg("상대방 생년월일을 입력해 주세요.");
            return;
          }
          setPt(form);
          setMsg(store.set(PT_KEY, form) ? "궁합을 다시 계산했어요." : "궁합을 다시 계산했어요. (이 브라우저에선 저장이 막혀 있어요)");
        }}
      >
        <div className="full" style={{ fontWeight: 600 }}>상대방 정보</div>
        <label>성별
          <select id="pt-gender" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value as Profile["gender"] })}>
            <option value="F">여자</option><option value="M">남자</option>
          </select>
        </label>
        <label>생년월일 (양력)
          <input id="pt-date" type="date" value={form.date} max={todayStr()} onChange={(e) => setForm({ ...form, date: e.target.value })} />
        </label>
        <label className="full">태어난 시간
          <select id="pt-hour" value={form.hour} onChange={(e) => setForm({ ...form, hour: Number(e.target.value) })}>
            {HOUR_TXT.map((t, i) => <option key={i} value={i}>{t}</option>)}
            <option value={-1}>모름</option>
          </select>
        </label>
        <div className="full"><button className="btn block">궁합 다시 보기</button></div>
        {msg && <p className="status full" role="status" style={{ margin: 0 }}>{msg}</p>}
      </form>
      <div className="panel mt">
        <div className="couple">
          <div className="who"><small>나</small><b>{GAN[s.D.g]}{s.me}</b><small>{s.label}</small></div>
          <span className="x">♥</span>
          <div className="who"><small>상대</small><b>{GAN[o.D.g]}{o.me}</b><small>{o.label}</small></div>
        </div>
      </div>
      <div className="mt"><Ring n={avg} title={MATCH_TYPE[k][0]} desc={MATCH_TYPE[k][1]} /></div>
      <div className="panel mt">
        <h3 className="panel-h">관계별 궁합 점수</h3>
        <div className="bars">
          {S.map(([a, v]) => (
            <div className="bar wide" key={a}>
              <span>{a}</span>
              <div className="t"><span className={v >= 80 ? "gold" : undefined} style={{ width: `${v}%` }} /></div>
              <b>{v}</b>
            </div>
          ))}
        </div>
      </div>
      <Items rows={[
        ["두 사람의 기운", `나는 ${EL_INFO[s.me].nick}, 상대는 ${EL_INFO[o.me].nick}이에요. ${comp >= 8 ? "서로 부족한 기운을 채워주는 조합이라 같이 있으면 편안해요." : "채워주는 기운은 적지만 각자의 색이 뚜렷해서 지루할 틈이 없어요."}`],
        ["배우자 자리(일지)", brText],
        ["갈등 포인트", pickR(r, MATCH_CONFLICT)],
        ["오래가는 팁", pickR(r, MATCH_TIP)],
      ]} />
      <Note />
    </>
  );
}

/* ---------- 주간 운세 ---------- */
const WD = ["일", "월", "화", "수", "목", "금", "토"];
export function Week() {
  const s = useReadySaju();
  return <Shell title="주간 운세">{s && <WeekBody s={s} />}</Shell>;
}
function WeekBody({ s }: { s: Saju }) {
  const now = new Date();
  const st = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
  const D = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(st.getFullYear(), st.getMonth(), st.getDate() + i);
    const x = dayP(d.getFullYear(), d.getMonth() + 1, d.getDate());
    const r = seedOf(s.key + "day" + ymd(d));
    const k = relOf(s.me, GAN_EL[x.g]);
    return { lab: `${d.getDate()} ${WD[i]}`, md: `${d.getMonth() + 1}월 ${d.getDate()}일`, full: `${d.getMonth() + 1}월 ${d.getDate()}일 ${WD[i]}요일`, v: scoreOf(s, GAN_EL[x.g], r), x, k, line: pickR(r, REL_LINE[k]) };
  });
  const best = maxBy(D, (d) => d.v), worst = minBy(D, (d) => d.v);
  return (
    <>
      <div className="panel">
        <h3 className="panel-h">{D[0].md} – {D[6].md}</h3>
        <Cols rows={D.map((d) => [d.lab, d.v] as [string, number])} hi={best.lab} lo={worst.lab} />
        <Legend hi="베스트 데이" lo="조심할 날" />
      </div>
      <div className="grid2 mt">
        <div className="panel">
          <h4 className="good-t" style={{ margin: "0 0 4px" }}>베스트 데이 · {best.full}</h4>
          <p className="muted" style={{ margin: 0 }}>일진 {best.x.s}{iga(JI_KO[best.x.j])} 나에게 {REL[best.k].n}이에요. {REL[best.k].d}</p>
        </div>
        <div className="panel">
          <h4 className="bad-t" style={{ margin: "0 0 4px" }}>조심할 날 · {worst.full}</h4>
          <p className="muted" style={{ margin: 0 }}>일진 {worst.x.s}{iga(JI_KO[worst.x.j])} 나에게 {REL[worst.k].n}이에요. 큰 결정은 하루 미뤄요.</p>
        </div>
      </div>
      <div className="panel mt days">
        {D.map((d) => (
          <div className="day" key={d.lab}><b>{d.lab} · {d.x.s}</b><span className="s">{d.v}</span><p>{d.line}</p></div>
        ))}
      </div>
      <Note />
    </>
  );
}

/* ---------- 월간 운세 ---------- */
export function Month() {
  const s = useReadySaju();
  const m = new Date().getMonth() + 1;
  return <Shell title={`${m}월 운세`}>{s && <MonthBody s={s} />}</Shell>;
}
function MonthBody({ s }: { s: Saju }) {
  const now = new Date();
  const y = now.getFullYear(), m = now.getMonth() + 1;
  const last = new Date(y, m, 0).getDate(), first = new Date(y, m - 1, 1).getDay();
  const days = Array.from({ length: last }, (_, i) => {
    const d = i + 1, x = dayP(y, m, d), r = seedOf(s.key + "day" + ymd(new Date(y, m - 1, d)));
    return { d, x, k: relOf(s.me, GAN_EL[x.g]), v: scoreOf(s, GAN_EL[x.g], r) };
  });
  const byV = [...days].sort((a, b) => b.v - a.v);
  const good = byV.slice(0, 7).map((x) => x.d), bad = byV.slice(-5).map((x) => x.d);
  const mp = monthP(y, m, 15), r = seedOf(s.key + "month" + y + m), sc = pScore(s, mp, r), mk = relOf(s.me, GAN_EL[mp.g]);
  const list = (k: number) => {
    const a = days.filter((x) => x.k === k && x.v >= 65).map((x) => x.d).slice(0, 4);
    return a.length ? a.join(", ") + "일" : "이번 달은 뚜렷한 날이 없어요";
  };
  const money = pickR(r, ["계획에 없던 지출이 생길 수 있어요. 새 투자보다 지출 관리에 집중해요.", "작은 수입이 여러 번 들어오는 달이에요. 모아두면 꽤 커요.", "돈 이야기는 가까운 사람일수록 선을 지켜요."]);
  const love = pickR(r, LOVE), work = pickR(r, WORK);
  return (
    <>
      <Ring n={sc} title={`${mp.s}월 · ${REL[mk].t.replace("날", "달")}`} desc={`이번 달의 기운 ${mp.s}${eun(JI_KO[mp.j])} 나에게 ${REL[mk].n}이에요. ${REL[mk].d.replace(/날이에요/g, "달이에요")}`} />
      <div className="grid2 mt">
        <div className="panel">
          <h3 className="panel-h">{m}월 달력</h3>
          <div className="cal">
            {WD.map((w) => <span key={w} className="wd">{w}</span>)}
            {Array.from({ length: first }, (_, i) => <span key={`e${i}`} />)}
            {days.map((x) => (
              <span key={x.d} title={`${x.x.s}일 ${x.v}점`} className={`d${good.includes(x.d) ? " g" : ""}${bad.includes(x.d) ? " c" : ""}${x.d === now.getDate() ? " t" : ""}`}>{x.d}</span>
            ))}
          </div>
          <div className="legend"><span><i className="sw-good" />좋은 날</span><span><i className="sw-lo" />피할 날</span><span><i className="sw-today" />오늘</span></div>
        </div>
        <div className="panel items">
          <div><h4>돈 흐름이 좋은 날</h4><p>{list(2)}</p></div>
          <div><h4>말하고 제안하기 좋은 날</h4><p>{list(1)}</p></div>
          <div><h4>공부·계약에 좋은 날</h4><p>{list(4)}</p></div>
          <div><h4>꼭 피할 날</h4><p>{[...bad].sort((a, b) => a - b).join(", ")}일</p></div>
        </div>
      </div>
      <Items rows={[["재물", money], ["애정", love], ["건강", `${EL_INFO[s.most].organ} 쪽을 챙겨요. ${EL_INFO[s.most].tip}`], ["일", work]]} />
      <LuckyRow s={s} r={r} />
      <Note />
    </>
  );
}

/* ---------- 신년 운세 ---------- */
export function Year() {
  const s = useReadySaju();
  return <Shell title={`${new Date().getFullYear()} 신년 운세`}>{s && <YearBody s={s} />}</Shell>;
}
function YearBody({ s }: { s: Saju }) {
  const yr = new Date().getFullYear(), yp = yearP(yr, 6, 1), r = seedOf(s.key + "year" + yr);
  const k = relOf(s.me, GAN_EL[yp.g]), sc = pScore(s, yp, r);
  const M: [string, number][] = Array.from({ length: 12 }, (_, i) => [`${i + 1}월`, pScore(s, monthP(yr, i + 1, 15), r)]);
  const hi = maxBy(M, (x) => x[1])[0], lo = minBy(M, (x) => x[1])[0], tb = brRel(s.Y.j, yp.j);
  const ttiLine = tb === "chung"
    ? `${s.tti}띠와 올해 ${TTI[yp.j][0]}띠 해가 부딪혀요. 이사·이직 같은 변화가 생기기 쉬우니 미리 준비해요.`
    : tb === "yukhap" || tb === "samhap"
      ? `${s.tti}띠와 올해 ${TTI[yp.j][0]}띠 해가 잘 맞아요. 사람 복이 따르는 해예요.`
      : `${s.tti}띠에게 올해는 무난한 해예요. 노력한 만큼 돌아와요.`;
  const money = k === 2 ? "돈이 들어오는 길이 넓어지는 해예요. 다만 나가는 길도 같이 넓어져요."
    : k === 3 ? "수입은 안정적이지만 책임질 지출이 생겨요."
      : pickR(r, ["한 방보다 꾸준함이 이기는 해예요.", "작은 부수입이 쌓여 연말에 웃어요."]);
  const work = pickR(r, WORK), love = pickR(r, LOVE);
  return (
    <>
      <Ring n={sc} title={`${yp.s}년 · ${REL[k].t.replace("날", "해")}`} desc={`올해의 기운 ${yp.s}${eun(JI_KO[yp.j])} 나에게 ${REL[k].n}이에요. ${REL[k].d.replace(/날이에요/g, "해예요")}`} />
      <div className="panel mt"><h3 className="panel-h">올해의 키워드</h3><div className="kw3">{YEAR_KW[k].map((x) => <span key={x}>{x}</span>)}</div></div>
      <div className="panel mt">
        <h3 className="panel-h">월별 흐름</h3>
        <Cols rows={M} hi={hi} lo={lo} />
        <Legend hi="가장 좋은 달" lo="가장 조심할 달" />
      </div>
      <Items rows={[["띠로 본 올해", ttiLine], ["재물", money], ["일·학업", work], ["인연", love]]} />
      <p className="note">가장 좋은 달은 {hi}, 조심할 달은 {lo}이에요.</p>
      <Note />
    </>
  );
}

/* ---------- 평생 운세 ---------- */
export function Life() {
  const s = useReadySaju();
  return <Shell title="평생 운세">{s && <LifeBody s={s} />}</Shell>;
}
function LifeBody({ s }: { s: Saju }) {
  const du = daeun(s);
  const age = new Date().getFullYear() - s.y + 1;
  const cur = du.list.filter((x) => x.age <= age).pop();
  const r = seedOf(s.key + "life");
  const mid = pickR(r, MID), late = pickR(r, LATE), fam = pickR(r, FAMILY);
  const curRel = cur ? REL[relOf(s.me, GAN_EL[cur.g])] : null;
  return (
    <>
      <div className="panel">
        <h3 className="panel-h">대운 흐름 <small>10년마다 바뀌는 큰 운 · {du.start}세 시작 · {du.fwd ? "순행" : "역행"}</small></h3>
        <div className="xscroll">
          <table className="daeun">
            <thead><tr>{du.list.map((d) => <th key={d.age} className={d === cur ? "now" : undefined}>{d.age}세~{d === cur ? " (지금)" : ""}</th>)}</tr></thead>
            <tbody><tr>{du.list.map((d) => <td key={d.age} className={d === cur ? "now" : undefined}>{GAN[d.g]}<br />{JI[d.j]}</td>)}</tr></tbody>
          </table>
        </div>
      </div>
      <div className="grid2 mt">
        <OhengPanel s={s} />
        <div className="panel items">
          <div><h4>타고난 성격 · {EL_INFO[s.me].nick}</h4><p>{EL_INFO[s.me].trait}</p></div>
          <div><h4>지금의 대운</h4><p>{cur && curRel ? `${cur.s} 대운(${cur.age}세~)이에요. 이 10년은 나에게 ${curRel.n}의 시기라 ${curRel.d.split(". ")[0]}.` : `첫 대운은 ${du.start}세부터 시작돼요.`}</p></div>
        </div>
      </div>
      <Items rows={[["초년", EARLY[s.me]], ["중년", mid], ["말년", late], ["가족", fam]]} />
      <div className="panel mt">
        <h3 className="panel-h">잘 맞는 일</h3>
        <p className="muted" style={{ margin: 0 }}>타고난 {s.me} 기운과 부족한 {s.least} 기운을 함께 살리는 분야예요.</p>
        <div className="jobs">{Array.from(new Set([...EL_INFO[s.me].jobs.slice(0, 3), ...EL_INFO[s.least].jobs.slice(0, 3)])).map((x) => <span key={x}>{x}</span>)}</div>
      </div>
      <Note />
    </>
  );
}

/* ---------- 나의 전생 찾기 ---------- */
export function PastLife() {
  const s = useReadySaju();
  return <Shell title="나의 전생 찾기">{s && <PastBody s={s} />}</Shell>;
}
function PastBody({ s }: { s: Saju }) {
  const r = seedOf(s.key + "past");
  const id = PAST_ID[s.D.g][s.D.j % 2], era = ERA[s.Y.j], rare = 1 + Math.floor(r() * 29), tie = pickR(r, PAST_TIE);
  return (
    <>
      <div className="share">
        <Icon name="crown" />
        <small>{s.label} · 전생 결과</small>
        <h2>{era}, {id}</h2>
        <p>{GAN[s.D.g]}{s.me}의 기운을 타고난 당신은 {era}에 {id}{euro(id)} 살았어요.</p>
        <div className="kw3">{EL_INFO[s.me].tags.map((x) => <span key={x}>{x}</span>)}</div>
        <small>같은 전생이 나온 사람 · 상위 {rare}%</small>
      </div>
      <Items rows={[
        ["전생의 성격", PAST_TRAIT[s.me]],
        ["현생에 남은 흔적", `${PAST_TRACE[s.me]}은 전생에서 이어진 거예요.`],
        ["전생의 인연", tie],
        ["그 시절 띠", `${s.tti}띠의 기운처럼 ${s.strong ? "앞장서서 일을 벌이는" : "뒤에서 조용히 받쳐주는"} 쪽이었어요.`],
      ]} />
      <Note />
    </>
  );
}

/* ---------- 미래 배우자 ---------- */
export function Spouse() {
  const s = useReadySaju();
  return <Shell title="미래에 나는 누구랑 결혼했을까?">{s && <SpouseBody s={s} />}</Shell>;
}
function SpouseBody({ s }: { s: Saju }) {
  const spEl = EL[mod(EL.indexOf(s.me) + (s.p.gender === "M" ? 2 : 3), 5)];
  const yr = new Date().getFullYear();
  let meet: number | null = null, warn: number | null = null;
  for (let y = yr + 1; y <= yr + 10; y++) {
    const rel = brRel(s.D.j, mod(y - 2020, 12));
    if (!meet && (rel === "yukhap" || rel === "samhap")) meet = y;
    if (!warn && y <= yr + 6 && rel === "chung") warn = y;
  }
  const r = seedOf(s.key + "spouse");
  return (
    <>
      <div className="share">
        <Icon name="ring" />
        <small>{s.label} · 미래 배우자</small>
        <h2>{SP_TITLE[spEl]}</h2>
        <p>배우자 자리 {JI[s.D.j]}({JI_EL[s.D.j]})와 배우자 별 {spEl} 기운으로 본 인연이에요.</p>
        <div className="kw3">{EL_INFO[spEl].tags.map((x) => <span key={x}>{x}</span>)}</div>
      </div>
      <Items rows={[
        ["분위기·인상", SP_LOOK[spEl]],
        ["성격", SP_PER[spEl]],
        ["일하는 분야", `${EL_INFO[spEl].jobs.slice(0, 3).join(", ")} 쪽일 가능성이 커요.`],
        ["만날 시기", `${meet ? `${meet}년 무렵 인연이 무르익어요.` : "10년 안에 뚜렷한 해는 없지만, 그만큼 언제든 만날 수 있어요."}${warn ? ` ${warn}년에 급하게 시작하는 관계는 한 번 더 생각해 보세요.` : ""}`],
        ["첫 만남 힌트", pickR(r, SP_MEET)],
      ]} />
      <Note />
    </>
  );
}
