import type { Metadata } from "next";
import { Gowun_Batang, IBM_Plex_Sans_KR } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import { BirthBar } from "@/components/BirthBar";
import { Icon } from "@/components/Icons";
import { ProfileProvider } from "@/components/ProfileProvider";
import { ThemeToggle } from "@/components/ThemeToggle";
import { THEME_KEY } from "@/lib/theme";

const display = Gowun_Batang({ weight: ["400", "700"], subsets: ["latin"], variable: "--font-display", display: "swap" });
const body = IBM_Plex_Sans_KR({ weight: ["400", "500", "600", "700"], subsets: ["latin"], variable: "--font-body", display: "swap" });

export const metadata: Metadata = {
  title: "운결",
  description: "사주 운세와 타로, 꿈해몽을 한곳에서. 모든 운세는 재미로 봐주세요.",
};

// 저장된 테마를 그리기 전에 적용 (깜빡임 방지). 기본은 일반모드.
const themeScript = `try{var t=localStorage.getItem('${THEME_KEY}');document.documentElement.dataset.theme=t==='dark'?'dark':'light'}catch(e){document.documentElement.dataset.theme='light'}`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko" data-theme="light" className={`${display.variable} ${body.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <ProfileProvider>
          <header className="top">
            <div className="wrap nav">
              <Link href="/" className="logo" aria-label="운결 홈">
                <Icon name="logo" />
                운결
              </Link>
              <BirthBar />
              <div className="top-right">
                <ThemeToggle />
              </div>
            </div>
          </header>
          <main className="wrap">{children}</main>
          <footer>
            <div className="wrap" style={{ display: "grid", gap: 6 }}>
              <p style={{ margin: 0 }}>
                운결의 모든 결과는 재미를 위한 콘텐츠이며 의학·투자·법률 등 전문적인 조언을 대신하지 않아요.
                결과를 근거로 한 판단과 그로 인한 결과는 이용자 본인에게 있어요.
              </p>
              <p style={{ margin: 0 }}>
                운결 · 공부용 개인 프로젝트 · <Link href="/terms" style={{ color: "inherit" }}>이용 안내 · 출처</Link>
              </p>
            </div>
          </footer>
        </ProfileProvider>
      </body>
    </html>
  );
}
