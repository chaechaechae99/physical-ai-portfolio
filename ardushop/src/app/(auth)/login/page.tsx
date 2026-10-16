import type { Metadata } from "next";
import LoginForm from "./LoginForm";

export const metadata: Metadata = { title: "관리자 로그인", robots: { index: false } };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next = "/admin" } = await searchParams;
  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <h1 className="mb-2 text-center text-2xl font-bold">관리자 로그인</h1>
      <p className="mb-6 text-center text-sm text-gray-500">
        이 사이트는 교육용 데모라 회원가입이 없습니다. 쇼핑과 체험 주문은 로그인 없이 이용할 수 있어요.
      </p>
      <LoginForm next={next} />
    </div>
  );
}
