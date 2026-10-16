import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-gray-200 bg-white">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 text-sm text-gray-500 md:grid-cols-3">
        <div>
          <p className="text-base font-bold text-brand-900">아두몰</p>
          <p className="mt-2">아두이노 부품 쇼핑몰 교육용 데모 사이트</p>
          <p>실제 판매·결제·배송은 이루어지지 않습니다.</p>
        </div>
        <div>
          <p className="font-semibold text-gray-700">고객 안내</p>
          <p className="mt-2">3만원 이상 무료배송 · 기본 배송비 3,000원</p>
          <p>회원가입 없이 체험 주문까지 해볼 수 있습니다.</p>
        </div>
        <div>
          <p className="font-semibold text-gray-700">정보</p>
          <p className="mt-2">가격 정보: 디바이스마트 판매가 참고</p>
          <Link href="/credits" className="underline hover:text-brand-700">
            이미지 출처 및 라이선스
          </Link>
          <Link href="/login" className="mt-1 block text-xs text-gray-400 hover:text-brand-700">
            관리자
          </Link>
        </div>
      </div>
    </footer>
  );
}
