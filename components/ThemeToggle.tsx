"use client";

import { useEffect, useState } from "react";

import { THEME_KEY } from "@/lib/theme";

/** 일반모드(기본) ↔ 다크모드. <html data-theme>에 반영하고 저장한다. */
export function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.dataset.theme === "dark");
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.dataset.theme = next ? "dark" : "light";
    try {
      localStorage.setItem(THEME_KEY, next ? "dark" : "light");
    } catch {
      /* 저장이 막혀도 이번 방문 동안은 적용 */
    }
  };

  return (
    <button type="button" className="theme-btn" onClick={toggle} aria-pressed={dark}>
      {dark ? "☀ 일반모드" : "☾ 다크모드"}
    </button>
  );
}
