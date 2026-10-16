# 아두이노 쇼핑몰 — 개발 계획

## 1. 기술 스택
| 영역 | 선택 | 이유 |
|---|---|---|
| 프레임워크 | Next.js (App Router) + TypeScript | SSR/SEO, 서버 액션, API 라우트를 한 프로젝트에서 처리 |
| 스타일 | Tailwind CSS (+ shadcn/ui) | 빠른 UI 개발 |
| DB·인증·스토리지 | Supabase (Postgres, Auth, Storage) | 이미 MCP 연결됨, RLS로 권한 관리 |
| 상태관리 | Zustand (장바구니) | 가볍고 단순 |
| 결제 | 토스페이먼츠 (테스트 모드) | 국내 결제 표준 |
| 배포 | Vercel | Next.js 기본 배포 환경 |

## 2. 핵심 기능
**고객**
- 상품 목록 / 카테고리(보드, 센서, 모듈, 모터, 키트, 부품) / 검색·필터
- 상품 상세: 사양표(전압, 핀, 통신 방식), 호환 보드, 데이터시트·예제코드 링크
- 장바구니 (비로그인 시 로컬 저장 → 로그인 시 병합)
- 회원가입/로그인 (이메일, 소셜)
- 주문·결제, 주문 내역, 배송 조회
- (선택) 리뷰, 찜, "이 프로젝트에 필요한 부품" 키트 묶음

**관리자**
- 상품 등록/수정/삭제, 이미지 업로드
- 재고 관리 (품절 표시, 재고 알림)
- 주문 상태 관리 (결제완료 → 배송중 → 완료)

## 3. DB 설계 (초안)
- `profiles` (id, name, phone, address, role)
- `categories` (id, name, slug, parent_id)
- `products` (id, category_id, name, slug, price, stock, specs JSONB, datasheet_url, is_active)
- `product_images` (id, product_id, url, sort_order)
- `cart_items` (user_id, product_id, quantity)
- `orders` (id, user_id, status, total, shipping_address, payment_key)
- `order_items` (order_id, product_id, quantity, unit_price)
- `reviews` (id, product_id, user_id, rating, body)

RLS: 상품/카테고리는 전체 읽기, 쓰기는 admin만 / 장바구니·주문은 본인만.

## 4. 개발 단계
| 단계 | 내용 | 결과물 |
|---|---|---|
| 1. 셋업 | Next.js·Tailwind·Supabase 연결, 환경변수 | 빈 페이지 + DB 연결 확인 |
| 2. DB | 마이그레이션, RLS, 시드 데이터(아두이노 상품 20~30개) | 테이블 + 샘플 상품 |
| 3. 상품 | 메인, 목록, 카테고리, 상세, 검색 | 상품 둘러보기 가능 |
| 4. 인증 | 회원가입/로그인/마이페이지 | 로그인 동작 |
| 5. 장바구니 | 담기/수량변경/삭제, 로그인 병합 | 장바구니 동작 |
| 6. 주문·결제 | 체크아웃, 토스 테스트 결제, 웹훅, 재고 차감 | 테스트 주문 완료 |
| 7. 관리자 | 상품·재고·주문 관리 | 관리자 페이지 |
| 8. 마무리 | 반응형, SEO, 테스트, Vercel 배포 | 배포 URL |

## 5. 폴더 구조
```
MCP/
├── docs/                     # 기획·설계 문서
├── public/images/            # 정적 이미지 (배너, 임시 상품 이미지)
├── supabase/
│   ├── migrations/           # 테이블·RLS SQL
│   └── seed/                 # 샘플 상품 데이터
├── tests/
└── src/
    ├── app/                  # 라우트 (Next.js App Router)
    │   ├── (shop)/           # 고객용: products/[slug], categories/[category], cart, checkout, search
    │   ├── (auth)/           # login, signup
    │   ├── mypage/           # orders, profile
    │   ├── admin/            # products, orders, inventory
    │   └── api/payments/webhook/
    ├── actions/              # 서버 액션 (장바구니, 주문 등)
    ├── components/
    │   ├── ui/               # 버튼·입력 등 공통 UI
    │   ├── layout/           # 헤더, 푸터, 네비게이션
    │   ├── product/          # 상품 카드, 사양표, 갤러리
    │   ├── cart/  checkout/  admin/
    ├── hooks/                # 커스텀 훅
    ├── lib/
    │   ├── supabase/         # 서버/브라우저 클라이언트
    │   ├── payments/         # 토스페이먼츠 연동
    │   └── utils/            # 가격 포맷 등
    ├── stores/               # Zustand (장바구니)
    └── types/                # DB·도메인 타입
```

## 6. 진행 상황 (2026-10-13)
- 1~7단계 완료. Supabase 프로젝트 `ardushop` (ap-northeast-2, ref `acjaojcxihxbamiaxwbg`)
- 결제는 토스 대신 **테스트 결제**(주문 즉시 결제완료)로 구현 → 실서비스 시 `place_order` 앞단에 PG 승인 단계 추가
- 장바구니는 Zustand + localStorage (DB `cart_items` 미사용)
- 배포: https://ardushop.vercel.app (Vercel 프로젝트 ardushop, Next 15.5.27)
- 남은 일: Auth 설정(이메일 인증·유출 비밀번호 보호), PG 연동

## 7. 교육용 전환 (2026-10-13)
- 회원가입·마이페이지 제거 (개인정보 수집 안 함)
- 주문 → 비로그인 체험 주문 (`place_demo_order`), 배송정보 없음, 재고 차감 없음
- 로그인은 관리자 전용 (푸터 링크)
