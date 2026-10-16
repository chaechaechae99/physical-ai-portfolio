# 아두몰 강의노트 — Next.js + Supabase로 쇼핑몰 만들기

아두이노 부품 쇼핑몰 **아두몰**(https://ardushop.vercel.app)을 처음부터 배포까지 만드는 과정을 정리한 강의노트입니다.
실제 판매는 하지 않는 **교육용 데모**라서 회원가입과 결제가 없고, 누구나 개인정보 없이 "체험 주문"을 할 수 있습니다.

## 완성본 미리보기

| 화면 | 주소 |
|---|---|
| 홈 | `/` |
| 전체상품 / 카테고리 / 검색 | `/products`, `/categories/sensors`, `/search?q=우노` |
| 상품 상세 | `/products/arduino-uno-r3` |
| 장바구니 → 체험 주문 | `/cart` → `/checkout` |
| 관리자 (로그인 필요) | `/admin` |

## 기술 스택

| 역할 | 기술 | 한 줄 설명 |
|---|---|---|
| 화면·서버 | **Next.js 15** (App Router) | React 기반. 페이지와 서버 로직을 한 프로젝트에서 작성 |
| 스타일 | **Tailwind CSS v4** | 클래스 이름으로 스타일 지정 |
| DB·인증 | **Supabase** | Postgres DB + 로그인 + 행 단위 권한(RLS) |
| 상태 관리 | **Zustand** | 장바구니를 브라우저에 저장 |
| 배포 | **Vercel** | 명령 한 줄로 인터넷에 공개 |

## 목차

| 장 | 주제 | 핵심 개념 |
|---|---|---|
| [01](01-기획과-폴더구조.md) | 기획과 폴더 구조 | 기능 목록, App Router 폴더 규칙 |
| [02](02-DB-설계.md) | Supabase DB 설계 | 테이블, 외래키, 제약조건, 시드 데이터 |
| [03](03-RLS-권한.md) | RLS로 권한 지키기 | Row Level Security, 정책, 컬럼 권한 |
| [04](04-Supabase-연결.md) | Next.js와 Supabase 연결 | 환경변수, 서버 클라이언트, 미들웨어 |
| [05](05-상품-페이지.md) | 상품 목록·상세·검색 | 서버 컴포넌트, 동적 라우트, searchParams |
| [06](06-장바구니.md) | 장바구니 | 클라이언트 컴포넌트, Zustand, localStorage |
| [07](07-체험-주문.md) | 체험 주문 | DB 함수(RPC), 서버 액션, 가격 위변조 방지 |
| [08](08-관리자.md) | 관리자 페이지 | 로그인, 권한 확인, 수정 기능 |
| [09](09-배포.md) | Vercel 배포 | 빌드, 환경변수, 보안 패치 |
| [10](10-보안-점검과-교육용-전환.md) | 보안 점검과 교육용 전환 | Supabase Advisors, 개인정보 최소화 |

## 이 저장소에서 장별로 볼 파일

```
src/
├── app/                 # 페이지 (05, 07, 08장)
├── actions/             # 서버 액션 (07, 08장)
├── components/          # 화면 조각 (05~08장)
├── lib/supabase/        # Supabase 연결 (04장)
├── stores/cart.ts       # 장바구니 (06장)
└── types/db.ts          # DB 타입 (02장)
supabase/
├── migrations/          # DB 스키마 SQL (02, 03, 07, 10장)
└── seed/                # 상품 데이터 (02장)
```

## 직접 실행해 보기

```bash
npm install
cp .env.example .env.local   # Supabase URL과 공개 키 입력
npm run dev                  # http://localhost:3000
```

> 상품 가격은 디바이스마트 판매가(2026-10-13)를 참고했고, 사진은 Wikimedia Commons의 자유 라이선스 이미지입니다. 출처는 사이트의 `/credits` 페이지에 있습니다.
