"use client";

import Link from "next/link";
import { useProfile } from "@/components/ProfileProvider";
import { EL, EL_KO, GAN, GAN_EL, JI, JI_EL, hourName, type Element, type Pillar, type Saju } from "@/lib/saju/simple";
import { EL_INFO, LUCKY_ITEM } from "@/lib/fortune/content";
import { iga, pickR, yeyo } from "@/lib/util";

export const EL_CLASS: Record<Element, string> = { 木: "el-wood", 火: "el-fire", 土: "el-earth", 金: "el-metal", 水: "el-water" };

export function BackHome() {
  return <Link href="/" className="back">‹ 홈으로</Link>;
}

export function PageTitle({ title, lead }: { title: string; lead?: React.ReactNode }) {
  return (
    <>
      <BackHome />
      <h1 className="pagetitle">{title}</h1>
      {lead ? <p className="lead">{lead}</p> : null}
    </>
  );
}

/** 프로필 기반 페이지의 제목 + 누구 기준인지 */
export function ProfileHead({ title }: { title: string }) {
  const { profile, saju, isSample } = useProfile();
  const focusBar = (e: React.MouseEvent) => {
    e.preventDefault();
    window.scrollTo(0, 0);
    const el = document.getElementById("birth-date") as HTMLInputElement | null;
    el?.focus();
    try {
      el?.showPicker?.();
    } catch {
      /* 일부 브라우저는 showPicker 미지원 */
    }
  };
  return (
    <PageTitle
      title={title}
      lead={
        <>
          {profile.date.replace(/-/g, ".")} {hourName(profile.hour)} · {profile.gender === "M" ? "남자" : "여자"} · 일간 {GAN[saju.D.g]}
          {saju.me}
          {isSample ? " (예시 생년월일)" : ""} ·{" "}
          <a href="#birth-date" onClick={focusBar}>생년월일 바꾸기</a>
        </>
      }
    />
  );
}

export const Note = () => <p className="note">간이 계산 · 절기는 고정 날짜로 근사했어요. 재미로 봐주세요.</p>;

export function Ring({ n, title, desc }: { n: number; title: string; desc: React.ReactNode }) {
  return (
    <div className="panel">
      <div className="score">
        <div className="ring" style={{ "--p": n } as React.CSSProperties}>
          <b>{n}</b>
        </div>
        <div>
          <h3 className="ring-title">{title}</h3>
          <p className="muted">{desc}</p>
        </div>
      </div>
    </div>
  );
}

export function Cols({ rows, hi, lo }: { rows: [string, number][]; hi: string; lo: string }) {
  return (
    <div className="cols">
      {rows.map(([k, v]) => (
        <div key={k} className={`col${k === hi ? " hi" : ""}${k === lo ? " lo" : ""}`}>
          <span className="v">{v}</span>
          <div className="bw"><span style={{ height: `${v}%` }} /></div>
          <span className="k">{k}</span>
        </div>
      ))}
    </div>
  );
}

export function Legend({ hi, lo }: { hi: string; lo: string }) {
  return (
    <div className="legend">
      <span><i className="sw-hi" />{hi}</span>
      <span><i className="sw-lo" />{lo}</span>
      <span><i className="sw-mid" />그 외</span>
    </div>
  );
}

export function Items({ rows }: { rows: [string, React.ReactNode][] }) {
  return (
    <div className="panel items mt">
      {rows.map(([h, p]) => (
        <div key={h}>
          <h4>{h}</h4>
          <p>{p}</p>
        </div>
      ))}
    </div>
  );
}

export const balanceNote = (s: Saju) => {
  const L = EL_INFO[s.least];
  return `${s.season}에 태어난 ${GAN[s.D.g]}${s.me}${yeyo(EL_KO[s.me])}. ${s.most} 기운이 가장 강하고 ${s.least} 기운이 ${s.cnt[s.least] === 0 ? "없어요" : "약해요"}. ${L.color} 계열과 ${L.dir}${iga(L.dir)} 균형을 잡아줘요.`;
};

export function OhengPanel({ s, note }: { s: Saju; note?: string }) {
  const mx = Math.max(1, ...EL.map((e) => s.cnt[e]));
  return (
    <div className="panel">
      <h3 className="panel-h">오행 분포 <small>{s.strong ? "신강" : "신약"} · 글자 {s.total}개</small></h3>
      <div className="bars">
        {EL.map((e) => (
          <div className="bar" key={e}>
            <span>{e} {EL_KO[e]}</span>
            <div className="t"><span className={EL_CLASS[e]} style={{ width: `${(s.cnt[e] / mx) * 100}%` }} /></div>
            <b>{s.cnt[e]}</b>
          </div>
        ))}
      </div>
      <p className="note">{note ?? balanceNote(s)}</p>
    </div>
  );
}

function Cell({ x, part }: { x: Pillar | null; part: "g" | "j" }) {
  if (!x) return <td><span className="han muted">?</span><small>모름</small></td>;
  const ch = part === "g" ? GAN[x.g] : JI[x.j];
  const el = part === "g" ? GAN_EL[x.g] : JI_EL[x.j];
  return <td><span className={`han ${EL_CLASS[el]}-t`}>{ch}</span><small>{el}</small></td>;
}

export function PillarsPanel({ s }: { s: Saju }) {
  return (
    <div className="panel">
      <h3 className="panel-h">사주팔자 <small>{s.label}</small></h3>
      <div className="xscroll">
        <table className="pillars">
          <thead><tr>{["시", "일", "월", "년"].map((l) => <th key={l}>{l}주</th>)}</tr></thead>
          <tbody>
            <tr>{s.pillars.map((x, i) => <Cell key={i} x={x} part="g" />)}</tr>
            <tr>{s.pillars.map((x, i) => <Cell key={i} x={x} part="j" />)}</tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function LuckyRow({ s, r }: { s: Saju; r: () => number }) {
  const L = EL_INFO[s.least];
  return (
    <div className="lucky mt">
      <div><small>행운의 색</small><b>{L.color}</b></div>
      <div><small>행운의 숫자</small><b>{L.num[0]} · {L.num[1]}</b></div>
      <div><small>행운의 방향</small><b>{L.dir}</b></div>
      <div><small>행운의 아이템</small><b>{pickR(r, LUCKY_ITEM)}</b></div>
    </div>
  );
}

/** localStorage를 읽기 전에는 자리만 잡아 둔다 (서버/클라이언트 렌더 불일치 방지) */
export function Loading() {
  return <div className="panel loading" aria-busy="true">불러오는 중…</div>;
}
