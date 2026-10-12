"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { isValidProfile, saju, type Profile, type Saju } from "@/lib/saju/simple";
import { store } from "@/lib/util";

const KEY = "unkyeol-profile-v1";
export const SAMPLE_PROFILE: Profile = { gender: "M", date: "1990-01-01", hour: 6 };

type Ctx = {
  profile: Profile;
  saju: Saju;
  isSample: boolean;
  /** 저장 실패 시 false (이번 방문 동안만 유지) */
  saved: boolean;
  /** localStorage를 읽은 뒤 true. 그 전에는 날짜·프로필에 따라 달라지는 화면을 그리지 않는다 */
  ready: boolean;
  update: (patch: Partial<Profile>) => void;
};

const ProfileContext = createContext<Ctx | null>(null);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<Profile>(SAMPLE_PROFILE);
  const [isSample, setIsSample] = useState(true);
  const [saved, setSaved] = useState(true);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const p = store.get<Profile>(KEY);
    if (isValidProfile(p)) {
      setProfile(p);
      setIsSample(false);
    }
    setReady(true);
  }, []);

  const update = useCallback((patch: Partial<Profile>) => {
    setProfile((prev) => {
      const next = { ...prev, ...patch };
      if (!isValidProfile(next)) return prev;
      setSaved(store.set(KEY, next));
      setIsSample(false);
      return next;
    });
  }, []);

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
