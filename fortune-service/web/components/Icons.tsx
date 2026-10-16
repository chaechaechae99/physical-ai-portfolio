// 라인 아이콘 (stroke는 currentColor)
const P: Record<string, React.ReactNode> = {
  sun: <><circle cx="24" cy="24" r="9" /><path d="M24 5v6M24 37v6M5 24h6M37 24h6M10.6 10.6l4.2 4.2M33.2 33.2l4.2 4.2M10.6 37.4l4.2-4.2M33.2 14.8l4.2-4.2" /></>,
  heart: <><path d="M24 40S7 29.5 7 18a8.5 8.5 0 0 1 17-3 8.5 8.5 0 0 1 17 3c0 11.5-17 22-17 22z" /><path d="M17 22h5l2-4 3 8 2-4h3" /></>,
  coin: <><ellipse cx="24" cy="14" rx="14" ry="6" /><path d="M10 14v10c0 3.3 6.3 6 14 6s14-2.7 14-6V14M10 24v10c0 3.3 6.3 6 14 6s14-2.7 14-6V24" /></>,
  week: <><rect x="7" y="10" width="34" height="30" /><path d="M7 18h34M15 6v8M33 6v8M13 26h4M22 26h4M31 26h4M13 33h4M22 33h4" /></>,
  month: <><rect x="8" y="8" width="32" height="32" /><path d="M19 15v18M19 15h10v18M19 22h10M19 28h10" /></>,
  year: <><path d="M24 6v36M14 14c4 3 16 3 20 0M12 24h24M16 34c3-3 13-3 16 0" /><circle cx="24" cy="24" r="17" /></>,
  yin: <><circle cx="24" cy="24" r="17" /><path d="M24 7a8.5 8.5 0 0 1 0 17 8.5 8.5 0 0 0 0 17" /><circle cx="24" cy="15.5" r="2" /><circle cx="24" cy="32.5" r="2" /></>,
  moon: <><path d="M30 8a16 16 0 1 0 10 25A13 13 0 0 1 30 8z" /><path d="M36 10l1 3 3 1-3 1-1 3-1-3-3-1 3-1z" /></>,
  tarot: <><rect x="10" y="7" width="20" height="32" rx="1" /><path d="M18 12l16 3-4 28-14-3" /><circle cx="20" cy="23" r="4" /></>,
  crown: <><path d="M8 34l3-18 8 8 5-12 5 12 8-8 3 18z" /><path d="M8 40h32" /></>,
  ring: <><circle cx="24" cy="29" r="12" /><path d="M18 11l6-5 6 5-6 6z" /></>,
  lotto: <><circle cx="24" cy="24" r="16" /><circle cx="24" cy="24" r="7" /><path d="M22 21.5l3-1.5v8" /></>,
  diary: <><path d="M10 8h24a4 4 0 0 1 4 4v28H14a4 4 0 0 1-4-4z" /><path d="M10 36a4 4 0 0 1 4-4h24" /><path d="M27 14a5.5 5.5 0 1 0 4.5 9A4.5 4.5 0 0 1 27 14z" /></>,
  star: <><path d="M24 7l4.4 10.9 11.6 1-8.9 7.6 2.8 11.5L24 31.8 14.1 38l2.8-11.5L8 18.9l11.6-1z" /><circle cx="40" cy="8" r="1.4" /><circle cx="8" cy="40" r="1.4" /></>,
  tti: <><circle cx="24" cy="24" r="17" /><circle cx="24" cy="24" r="8" /><path d="M24 7v4M24 37v4M7 24h4M37 24h4M12 12l3 3M33 33l3 3M12 36l3-3M33 15l3-3" /></>,
  logo: <><circle cx="24" cy="24" r="19" /><path d="M24 5a9.5 9.5 0 0 1 0 19 9.5 9.5 0 0 0 0 19" /><circle cx="24" cy="14.5" r="2.2" fill="currentColor" /><circle cx="24" cy="33.5" r="2.2" /></>,
};

export type IconName = keyof typeof P;

export function Icon({ name, className }: { name: IconName; className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} fill="none" stroke="currentColor" strokeWidth={1.6} aria-hidden="true">
      {P[name]}
    </svg>
  );
}
