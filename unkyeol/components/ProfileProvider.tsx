"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { toSolar } from "@/lib/saju/engine"; // import 시 정식 엔진(manseryeok)이 등록된다
import { isValidProfile, saju, type Profile, type Saju } from "@/lib/saju/simple";
import { store } from "@/lib/util";

const KEY = "unkyeol-profile-v1";
export const SAMPLE_PROFILE: Profile = { gender: "M", date: "1990-01-01", hour: 6, cal: "S" };

/** 저장값 형식 확인 + 예전 저장값(cal 없음)은 양력으로 */
const migrate = (p: unknown): Profile | null => (isValidProfile(p) ? { ...p, cal: p.cal ?? "S" } : null);

/** 실제로 있는 날짜인지 (음력 윤달이 없는 해 등은 false) */
const exists = (p: Profile) => {
  try {
    toSolar(p);
    return true;
  } catch {
    return false;
  }
};

type Ctx = {
  profile: Profile;
  saju: Saju;
  isSample: boolean;
  /** 저장 실패 시 false (이번 방문 동안만 유지) */
  saved: boolean;
  /** localStorage를 읽은 뒤 true. 그 전에는 날짜·프로필에 따라 달라지는 화면을 그리지 않는다 */
  ready: boolean;
  /** 적용됐으면 true, 없는 날짜라 무시했으면 false */
  update: (patch: Partial<Profile>) => boolean;
};

const ProfileContext = createContext<Ctx | null>(null);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<Profile>(SAMPLE_PROFILE);
  const [isSample, setIsSample] = useState(true);
  const [saved, setSaved] = useState(true);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const p = migrate(store.get<Profile>(KEY));
    if (p && exists(p)) {
      setProfile(p);
      setIsSample(false);
    }
    setReady(true);
  }, []);

  const update = useCallback(
    (patch: Partial<Profile>) => {
      const next = { ...profile, ...patch };
      if (!isValidProfile(next) || !exists(next)) return false;
      setProfile(next);
      setSaved(store.set(KEY, next));
      setIsSample(false);
      return true;
    },
    [profile],
  );

  const value = useMemo(
    () => ({ profile, saju: saju(profile), isSample, saved, ready, update }),
    [profile, isSample, saved, ready, update],
  );
  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error("useProfile must be used inside ProfileProvider");
  return ctx;
}
