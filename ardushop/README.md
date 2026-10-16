# 아두몰 — Next.js + Supabase로 쇼핑몰 만들기 (강의노트)

아두이노 부품 쇼핑몰 **아두몰**을 처음부터 배포까지 만드는 과정을 정리한 강의노트입니다.

- 완성본: https://ardushop.vercel.app
- 실제 판매는 하지 않는 **교육용 데모**입니다. 회원가입·결제가 없고, 누구나 개인정보 없이 "체험 주문"을 할 수 있습니다.

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

## 직접 실행해 보기

```bash
npm install
cp .env.example .env.local   # Supabase URL과 공개 키 입력
npm run dev                  # http://localhost:3000
```

DB는 `supabase/migrations/`의 SQL을 번호 순서대로 실행한 뒤 `supabase/seed/seed.sql`로 상품을 넣습니다.

## 목차

01. [기획과 폴더 구조](#01-기획과-폴더-구조)
02. [Supabase DB 설계](#02-supabase-db-설계)
03. [RLS로 권한 지키기](#03-rls로-권한-지키기)
04. [Next.js와 Supabase 연결](#04-nextjs와-supabase-연결)
05. [상품 목록·상세·검색](#05-상품-목록상세검색)
06. [장바구니](#06-장바구니)
07. [체험 주문 — DB 함수와 서버 액션](#07-체험-주문--db-함수와-서버-액션)
08. [관리자 페이지](#08-관리자-페이지)
09. [Vercel 배포](#09-vercel-배포)
10. [보안 점검과 교육용 전환](#10-보안-점검과-교육용-전환)
- [부록: 프로젝트 정보](#부록-프로젝트-정보)

---

## 01. 기획과 폴더 구조

### 학습 목표
- 만들 기능을 "누가, 무엇을" 기준으로 정리할 수 있다.
- Next.js App Router의 폴더 = 주소 규칙을 이해한다.

### 1. 기능 정리하기

코드를 쓰기 전에 **사용자별로 할 수 있는 일**을 먼저 적습니다.

| 사용자 | 할 수 있는 일 |
|---|---|
| 방문자 (누구나) | 상품 둘러보기, 카테고리·검색, 장바구니 담기, 체험 주문 |
| 관리자 | 상품 등록, 가격·재고 수정, 주문 상태 변경 |

> 처음 계획에는 회원가입·마이페이지·실제 결제가 있었지만, 교육용으로 바꾸면서 뺐습니다. 이 과정은 [10장](#10-보안-점검과-교육용-전환)에서 다룹니다.

### 2. 개발 순서

한 번에 다 만들지 않고, **매 단계가 끝나면 화면에서 확인할 수 있게** 나눕니다.

1. 프로젝트 생성과 DB 연결
2. DB 테이블과 샘플 상품
3. 상품 목록·상세
4. 장바구니
5. 주문
6. 관리자
7. 배포

### 3. App Router 폴더 규칙

Next.js에서는 **`src/app` 안의 폴더 경로가 곧 사이트 주소**입니다. `page.tsx`가 있어야 그 주소에 페이지가 생깁니다.

| 파일 | 주소 |
|---|---|
| `src/app/page.tsx` | `/` |
| `src/app/(shop)/products/page.tsx` | `/products` |
| `src/app/(shop)/products/[slug]/page.tsx` | `/products/아무값` |
| `src/app/admin/layout.tsx` | `/admin` 아래 모든 페이지를 감싸는 틀 |

알아둘 특수 규칙 세 가지:

- **`[slug]`** (대괄호): 동적 경로. `/products/arduino-uno-r3`에서 `arduino-uno-r3`가 `slug` 값으로 들어옵니다.
- **`(shop)`** (괄호): 주소에는 안 나오는 그룹 폴더. 파일을 정리하는 용도입니다. `(shop)/cart`의 주소는 `/cart`입니다.
- **`layout.tsx`**: 같은 폴더와 하위 페이지에 공통으로 씌우는 틀. 헤더·푸터는 `src/app/layout.tsx`에 있습니다.

### 4. 이 프로젝트의 폴더 구조

```
src/
├── app/
│   ├── page.tsx              # 홈
│   ├── layout.tsx            # 공통 틀 (헤더·푸터)
│   ├── (shop)/               # 고객용 페이지
│   │   ├── products/         # 전체상품, [slug] 상세
│   │   ├── categories/[category]/
│   │   ├── search/
│   │   ├── cart/
│   │   └── checkout/         # 체험 주문
│   ├── (auth)/login/         # 관리자 로그인
│   ├── admin/                # 관리자 페이지들
│   └── credits/              # 이미지 출처
├── actions/                  # 서버에서 실행되는 함수 (주문, 관리자 수정)
├── components/               # 화면 조각 (상품카드, 헤더 등)
├── lib/                      # Supabase 연결, 데이터 조회, 유틸
├── stores/                   # 장바구니 상태
└── types/                    # TypeScript 타입
```

**원칙:** 페이지(`app/`)는 얇게, 재사용하는 화면 조각은 `components/`로, DB 조회는 `lib/data.ts`로 모읍니다.

### 5. 프로젝트 만들기

```bash
npx create-next-app@15 ardushop --ts --tailwind --eslint --app --src-dir --import-alias "@/*"
cd ardushop
npm install @supabase/supabase-js @supabase/ssr zustand
```

### 실습 과제
1. `/about` 주소에 "아두몰 소개" 페이지를 만들어 보세요. 어느 폴더에 어떤 파일을 만들어야 할까요?
2. `(shop)` 폴더 이름을 `shop`(괄호 없이)으로 바꾸면 장바구니 주소는 어떻게 될까요?

---

## 02. Supabase DB 설계

### 학습 목표
- 쇼핑몰에 필요한 테이블과 관계를 설계할 수 있다.
- 제약조건(check, unique, foreign key)으로 잘못된 데이터를 막을 수 있다.

> 전체 SQL: [`supabase/migrations/20261013000001_init_shop.sql`](./supabase/migrations/20261013000001_init_shop.sql)

### 1. 테이블 한눈에 보기

```
categories 1 ──< N products
orders     1 ──< N order_items >── 1 products
auth.users 1 ─── 1 profiles   (관리자 구분용)
```

| 테이블 | 역할 | 주요 컬럼 |
|---|---|---|
| `categories` | 카테고리 | `slug`(주소용 영문), `name`, `sort_order` |
| `products` | 상품 | `price`, `stock`, `specs`(JSON), `image_url`, `is_active` |
| `orders` | 주문 1건 | `order_no`, `status`, `subtotal`, `shipping_fee`, `total` |
| `order_items` | 주문에 담긴 상품들 | `product_name`, `unit_price`, `quantity` |
| `profiles` | 로그인 계정의 역할 | `role` (`customer` / `admin`) |

### 2. 상품 테이블 살펴보기

```sql
create table public.products (
  id               bigserial primary key,
  category_id      int  not null references public.categories(id),
  slug             text not null unique,
  name             text not null,
  price            int  not null check (price >= 0),
  stock            int  not null default 0 check (stock >= 0),
  specs            jsonb not null default '{}'::jsonb,
  is_active        boolean not null default true,
  ...
);
```

| 문법 | 의미 | 막아주는 실수 |
|---|---|---|
| `references categories(id)` | 외래키 | 없는 카테고리에 상품 등록 |
| `unique` | 중복 금지 | 같은 주소(slug)를 가진 상품 두 개 |
| `check (stock >= 0)` | 값 조건 | 재고가 음수가 되는 것 |
| `jsonb` | JSON 저장 | 상품마다 다른 사양표를 컬럼 하나에 |

**돈은 `int`(원 단위 정수)로 저장합니다.** 소수(`float`)는 계산 오차가 생길 수 있습니다.

### 3. 주문 상품에 이름·가격을 따로 저장하는 이유

```sql
create table public.order_items (
  order_id     bigint not null references public.orders(id) on delete cascade,
  product_id   bigint references public.products(id) on delete set null,
  product_name text not null,   -- 주문 당시 이름
  unit_price   int  not null,   -- 주문 당시 가격
  quantity     int  not null check (quantity > 0)
);
```

나중에 상품 가격이 바뀌거나 상품이 삭제돼도 **과거 주문 내역은 그대로** 남아야 합니다. 그래서 주문 시점의 이름과 가격을 복사해 둡니다.

- `on delete cascade`: 주문이 지워지면 주문 상품도 같이 삭제
- `on delete set null`: 상품이 지워지면 연결만 끊고 기록은 유지

### 4. 회원 프로필 자동 생성 (트리거)

Supabase의 로그인 계정은 `auth.users`에 저장됩니다. 계정이 생길 때마다 `profiles`에 한 줄을 자동으로 넣도록 트리거를 겁니다.

```sql
create function public.handle_new_user() returns trigger ...
begin
  insert into public.profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)));
  return new;
end;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

### 5. 시드(샘플) 데이터

상품 데이터는 JSON으로 관리하고, 스크립트로 SQL을 만듭니다.

- 원본: [`supabase/seed/products.json`](./supabase/seed/products.json)
- 변환: `node scripts/build-seed.mjs` → `supabase/seed/seed.sql`

```json
{ "slug": "arduino-uno-r3", "category": "boards", "name": "Arduino Uno (R3)",
  "price": 29000, "stock": 120, "featured": true,
  "specs": { "MCU": "ATmega328P", "동작 전압": "5V" } }
```

`on conflict (slug) do update`를 쓰기 때문에 **여러 번 실행해도 중복되지 않습니다.**

### 6. TypeScript 타입 맞추기

DB 구조를 코드에서도 알 수 있도록 [`src/types/db.ts`](./src/types/db.ts)에 타입을 적어 둡니다.

```ts
export type Product = {
  id: number;
  slug: string;
  name: string;
  price: number;
  stock: number;
  specs: Record<string, string>;
  ...
};
```

### 실습 과제
1. 상품에 "제조사(brand)" 컬럼을 추가하는 SQL을 써 보세요. 비어 있어도 되게 할까요, 필수로 할까요?
2. `order_items`에 `unit_price`를 저장하지 않고 `products.price`를 매번 조회하면 어떤 문제가 생길까요?
3. `check (price >= 0)`이 있을 때 `update products set price = -100`을 실행하면 어떻게 될까요?

---

## 03. RLS로 권한 지키기

### 학습 목표
- Supabase에서 브라우저가 DB에 직접 접근할 때의 위험을 이해한다.
- RLS 정책으로 "누가 어떤 행을 읽고 쓸 수 있는지" 정할 수 있다.

### 1. 왜 RLS가 필요한가

Supabase는 **공개 키(publishable key)** 만 있으면 누구나 DB API를 호출할 수 있습니다. 이 키는 브라우저 코드에 들어가므로 숨길 수 없습니다.

그래서 "화면에 버튼을 안 보여주는 것"으로는 보안이 안 됩니다. **DB가 직접 요청을 거부해야** 합니다. 이것이 **RLS(Row Level Security, 행 단위 보안)** 입니다.

```sql
alter table public.products enable row level security;
```

RLS를 켜면 **정책이 허락한 것 외에는 전부 거부**됩니다.

### 2. 정책 읽는 법

```sql
create policy "정책 이름" on 테이블
  for 동작              -- select / insert / update / delete / all
  to 역할               -- anon(비로그인) / authenticated(로그인)
  using (조건)          -- 기존 행 중 어떤 행에 적용할지
  with check (조건);    -- 새로 쓰는 값이 만족해야 할 조건
```

### 3. 이 프로젝트의 정책

#### 상품: 누구나 판매중 상품을 보고, 관리자만 수정

```sql
create policy "products: 판매중 상품 조회" on public.products
  for select using (is_active or (select public.is_admin()));

create policy "products: 관리자 관리" on public.products
  for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
```

- 방문자는 `is_active = true`인 상품만 보입니다.
- 관리자는 숨긴 상품까지 보고 수정할 수 있습니다.

#### 관리자 확인 함수

```sql
create function public.is_admin() returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;
```

- `auth.uid()`: 지금 요청한 사람의 계정 ID (비로그인이면 null)
- `security definer`: 함수를 만든 사람 권한으로 실행. 정책 안에서 `profiles`를 읽을 때 정책이 다시 걸리는 문제를 피합니다.
- `set search_path = ''`: 함수 안에서는 `public.profiles`처럼 스키마를 꼭 붙여 쓰게 해서, 다른 스키마의 같은 이름 테이블이 끼어드는 공격을 막습니다.

#### 주문: 비로그인은 목록을 볼 수 없음

```sql
create policy "orders: 본인/관리자 조회" on public.orders
  for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));
```

비로그인(`anon`)용 정책이 없으므로, 방문자는 다른 사람의 주문을 조회할 수 없습니다.

### 4. 컬럼 단위 권한: 스스로 관리자가 되는 것 막기

본인 프로필 수정을 허용하면, `role` 컬럼까지 `admin`으로 바꿀 수 있게 됩니다. 그래서 **수정 가능한 컬럼을 지정**합니다.

```sql
revoke update on public.profiles from authenticated, anon;
grant update (name, phone, address) on public.profiles to authenticated;
```

### 5. 테스트로 확인하기

정책은 **직접 공격해 보고 막히는지** 확인해야 합니다. 이 프로젝트에서 실제로 확인한 항목:

| 시도 | 결과 |
|---|---|
| 비로그인으로 상품 가격 수정 | 거부 (수정된 행 0개) |
| 비로그인으로 주문 목록 조회 | 빈 결과 |
| 로그인 고객이 자기 `role`을 `admin`으로 변경 | `permission denied for table profiles` |
| 관리자로 상품 수정 | 성공 |

```js
// 비로그인 클라이언트로 가격 수정 시도
const { data } = await anon.from("products").update({ price: 1 }).eq("id", 1).select();
console.log(data.length); // 0 → 막힘
```

### 실습 과제
1. `categories` 테이블에 "누구나 조회" 정책이 없다면 홈 화면은 어떻게 될까요?
2. 리뷰(`reviews`) 테이블을 만든다고 할 때, "누구나 읽기 / 로그인한 사람만 쓰기 / 본인 글만 삭제" 정책 세 개를 작성해 보세요.

---

## 04. Next.js와 Supabase 연결

### 학습 목표
- 환경변수로 접속 정보를 관리할 수 있다.
- 서버 컴포넌트에서 Supabase를 쓰는 방법과, 로그인 세션을 쿠키로 유지하는 방법을 이해한다.

### 1. 환경변수

`.env.local` (git에 올리지 않음):

```
NEXT_PUBLIC_SUPABASE_URL=https://<프로젝트>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
```

- `NEXT_PUBLIC_`으로 시작하면 브라우저 코드에서도 읽을 수 있습니다.
- 공개 키는 원래 공개돼도 되는 값입니다. 보안은 [03장 RLS](#03-rls로-권한-지키기)가 담당합니다.
- **절대 공개하면 안 되는 키**(service_role, secret key)는 이 프로젝트에서 쓰지 않습니다.
- 저장소에는 값 없이 [`.env.example`](./.env.example)만 올립니다.

### 2. 서버용 Supabase 클라이언트

[`src/lib/supabase/server.ts`](./src/lib/supabase/server.ts)

```ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(URL, KEY, {
    cookies: {
      getAll() { return cookieStore.getAll(); },
      setAll(cookiesToSet) { /* 쿠키에 세션 저장 */ },
    },
  });
}
```

로그인 정보는 **쿠키**에 저장됩니다. 서버에서 쿠키를 읽어 "지금 요청한 사람이 누구인지" 알 수 있고, 그 정보가 DB의 `auth.uid()`로 전달됩니다.

### 3. 미들웨어: 모든 요청 앞에서 실행

[`src/middleware.ts`](./src/middleware.ts) → [`src/lib/supabase/middleware.ts`](./src/lib/supabase/middleware.ts)

```ts
const PROTECTED = ["/admin"];

const { data: { user } } = await supabase.auth.getUser();
if (!user && PROTECTED.some((p) => pathname.startsWith(p))) {
  // 로그인 페이지로 보내고, 로그인 후 돌아올 주소를 next에 담는다
  url.pathname = "/login";
  url.search = `?next=${encodeURIComponent(pathname)}`;
  return NextResponse.redirect(url);
}
```

미들웨어가 하는 일:
1. 만료가 가까운 로그인 세션을 갱신
2. 로그인이 필요한 주소(`/admin`)에 비로그인으로 오면 `/login`으로 보내기

`matcher`에서 이미지·정적 파일은 제외해 불필요한 실행을 줄였습니다.

### 4. 데이터 조회를 한 곳에 모으기

[`src/lib/data.ts`](./src/lib/data.ts)

```ts
export const getCategories = cache(async () => {
  const supabase = await createClient();
  const { data, error } = await supabase.from("categories").select("*").order("sort_order");
  if (error) throw error;
  return data;
});
```

- React의 `cache()`로 감싸면, 한 번의 페이지 요청 안에서 헤더와 본문이 같은 함수를 불러도 **DB는 한 번만** 조회합니다.
- 페이지마다 쿼리를 직접 쓰지 않고 여기 모아두면 수정할 곳이 한 군데로 줄어듭니다.

### 5. 연결 확인

```bash
npm run dev
```

홈에 카테고리 7개가 보이면 연결 성공입니다. 안 보이면 다음을 확인하세요.

- `.env.local` 값에 오타가 없는지
- 환경변수를 바꿨다면 개발 서버를 **재시작**했는지
- `categories` 테이블에 RLS "누구나 조회" 정책이 있는지

### 실습 과제
1. `PROTECTED`에 `/cart`를 추가하면 어떤 일이 생기나요? 실제로 바꿔서 확인해 보세요.
2. `getCategories`에서 `cache()`를 빼면 홈 화면 한 번에 카테고리 조회가 몇 번 일어날까요? (힌트: 헤더와 본문)

---

## 05. 상품 목록·상세·검색

### 학습 목표
- 서버 컴포넌트에서 DB를 바로 조회해 화면을 그릴 수 있다.
- 동적 라우트(`[slug]`)와 쿼리스트링(`?sort=`)을 다룰 수 있다.

### 1. 서버 컴포넌트

Next.js App Router의 페이지는 기본적으로 **서버 컴포넌트**입니다. 서버에서 실행되므로 `async`로 DB를 직접 조회할 수 있습니다.

[`src/app/(shop)/products/page.tsx`](<./src/app/(shop)/products/page.tsx>)

```tsx
export default async function ProductsPage({ searchParams }) {
  const sort = parseSort((await searchParams).sort);
  const products = await getProducts({ sort });

  return (
    <div>
      <h1>전체상품</h1>
      <SortTabs basePath="/products" current={sort} total={products.length} />
      <ProductGrid products={products} />
    </div>
  );
}
```

> Next.js 15부터 `params`, `searchParams`는 Promise라서 `await`이 필요합니다.

### 2. 정렬: 주소에 상태 담기

정렬 상태를 `useState`가 아니라 **주소(`?sort=price_asc`)** 에 담았습니다.

- 새로고침해도 정렬이 유지됩니다.
- 주소를 복사해서 공유할 수 있습니다.
- 정렬 버튼이 그냥 `<Link>`라서 자바스크립트가 필요 없습니다.

```ts
// 주소에 이상한 값이 들어와도 기본값으로 처리
export const parseSort = (v) =>
  SORT_OPTIONS.some((o) => o.value === v) ? v : "popular";
```

**주소로 들어온 값은 항상 검증**합니다. 사용자가 주소를 마음대로 바꿀 수 있기 때문입니다.

### 3. 동적 라우트: 상품 상세

[`src/app/(shop)/products/[slug]/page.tsx`](<./src/app/(shop)/products/[slug]/page.tsx>)

```tsx
export default async function ProductPage({ params }) {
  const product = await getProduct((await params).slug);
  if (!product) notFound();   // 없는 상품이면 404 페이지
  ...
}
```

- `/products/arduino-uno-r3` → `slug = "arduino-uno-r3"`
- `notFound()`를 부르면 Next.js가 404 페이지를 보여줍니다.

#### 페이지 제목(SEO)

```tsx
export async function generateMetadata({ params }) {
  const p = await getProduct((await params).slug);
  return p ? { title: p.name, description: p.summary } : {};
}
```

브라우저 탭과 검색엔진에 상품 이름이 나옵니다. `getProduct`는 `cache()`로 감싸서 본문과 메타데이터가 DB를 두 번 조회하지 않습니다.

#### 사양표: JSON 컬럼 그리기

```tsx
const specs = Object.entries(product.specs ?? {});
// [["MCU", "ATmega328P"], ["동작 전압", "5V"], ...]
{specs.map(([k, v]) => (
  <tr key={k}><th>{k}</th><td>{v}</td></tr>
))}
```

### 4. 검색

[`src/lib/data.ts`](./src/lib/data.ts)

```ts
if (opts.query) {
  const term = opts.query.replace(/[,()*%\\"]/g, " ").trim();
  if (term) q = q.or(`name.ilike.%${term}%,summary.ilike.%${term}%,sku.ilike.%${term}%`);
}
```

- `ilike`: 대소문자 구분 없는 부분 일치 검색
- `or(...)`: 이름, 설명, 부품번호 중 하나라도 맞으면
- **특수문자 제거**: `,`나 `(`가 들어가면 `or()` 문법이 깨지므로 미리 지웁니다.

검색창은 일반 HTML 폼입니다. 제출하면 `/search?q=검색어`로 이동합니다.

```tsx
<form action="/search">
  <input name="q" />
  <button>검색</button>
</form>
```

### 5. 이미지

```tsx
<Image src={product.image_url} alt={product.name} fill sizes="(max-width: 640px) 50vw, 25vw" />
```

Next.js `<Image>`는 화면 크기에 맞게 이미지를 줄이고 WebP 등으로 변환해서 보냅니다. `sizes`를 적어야 알맞은 크기를 고릅니다.

### 실습 과제
1. 정렬 옵션에 "이름순"을 추가해 보세요. (`SORT_OPTIONS`와 `getProducts`의 `switch`)
2. 상품 상세에 "같은 카테고리 상품"이 4개 나옵니다. 현재 상품이 빠지는 원리를 코드에서 찾아보세요.
3. 가격 범위 필터(`?min=1000&max=10000`)를 추가해 보세요. 들어온 값이 숫자가 아니면 어떻게 처리할까요?

---

## 06. 장바구니

### 학습 목표
- 서버 컴포넌트와 클라이언트 컴포넌트의 차이를 이해한다.
- Zustand로 전역 상태를 만들고 localStorage에 저장할 수 있다.

### 1. 클라이언트 컴포넌트가 필요한 순간

버튼 클릭, 입력값 변경처럼 **브라우저에서 반응해야 하는 부분**은 클라이언트 컴포넌트로 만듭니다. 파일 맨 위에 한 줄을 씁니다.

```tsx
"use client";
```

| 서버 컴포넌트 | 클라이언트 컴포넌트 |
|---|---|
| DB 직접 조회 가능 | `useState`, `onClick` 사용 가능 |
| 자바스크립트를 브라우저로 안 보냄 | 브라우저로 코드가 전송됨 |
| 예: 상품 목록, 상세 | 예: 장바구니 담기 버튼, 수량 조절 |

상품 상세 페이지는 서버 컴포넌트이고, 그 안의 **담기 버튼만** 클라이언트 컴포넌트([`AddToCart.tsx`](./src/components/product/AddToCart.tsx))입니다. 필요한 부분만 클라이언트로 만들면 페이지가 가벼워집니다.

### 2. Zustand 스토어

[`src/stores/cart.ts`](./src/stores/cart.ts)

```ts
export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      add: (item, quantity = 1) => set((s) => { /* 있으면 수량 증가, 없으면 추가 */ }),
      setQuantity: (productId, quantity) => set(...),
      remove: (productId) => set((s) => ({ items: s.items.filter((i) => i.productId !== productId) })),
      clear: () => set({ items: [] }),
    }),
    { name: "ardushop-cart" },   // localStorage 키 이름
  ),
);
```

- `create`: 어느 컴포넌트에서든 `useCart()`로 같은 장바구니를 씁니다.
- `persist`: 새로고침해도 장바구니가 남도록 **localStorage에 자동 저장**합니다.

#### 수량 제한

```ts
const clamp = (n: number, max: number) => Math.max(1, Math.min(n, Math.max(1, max), 99));
```

수량은 1 이상, 재고 이하, 99 이하로 묶습니다. 하지만 이건 **편의 기능일 뿐**입니다. 브라우저 값은 사용자가 조작할 수 있으므로 최종 검증은 서버(DB 함수)에서 다시 합니다. ([07장](#07-체험-주문--db-함수와-서버-액션))

### 3. 하이드레이션 불일치 피하기

서버는 사용자의 localStorage를 볼 수 없어서 장바구니를 항상 "0개"로 그립니다. 브라우저에서는 저장된 값이 있으니 "2개"가 됩니다. 두 결과가 다르면 React가 경고를 냅니다.

해결: **화면에 붙은 뒤(mount)에만** 장바구니 값을 보여줍니다.

[`src/components/layout/CartLink.tsx`](./src/components/layout/CartLink.tsx)

```tsx
const [mounted, setMounted] = useState(false);
useEffect(() => setMounted(true), []);
const count = mounted ? cartCount(items) : 0;
```

### 4. 금액 계산

```ts
export const cartSubtotal = (items) => items.reduce((n, i) => n + i.price * i.quantity, 0);

// src/lib/utils/format.ts
export const shippingFor = (subtotal) =>
  subtotal === 0 || subtotal >= 30000 ? 0 : 3000;
```

화면에는 "22,000원 더 담으면 무료배송!"처럼 안내합니다.

### 실습 과제
1. 장바구니에 "전체 비우기" 버튼을 추가해 보세요. 어떤 스토어 함수를 쓰면 될까요?
2. 개발자 도구 → Application → Local Storage에서 `ardushop-cart` 값을 직접 바꿔 가격을 1원으로 만들어 보세요. 장바구니에는 1원으로 보이지만 체험 주문 결과는 어떻게 나오는지 확인하고, 이유를 설명해 보세요.

---

## 07. 체험 주문 — DB 함수와 서버 액션

### 학습 목표
- 가격·재고 같은 중요한 계산을 왜 서버에서 해야 하는지 이해한다.
- Postgres 함수(RPC)와 Next.js 서버 액션을 연결할 수 있다.

### 1. 브라우저를 믿으면 안 되는 이유

장바구니에는 가격이 들어 있지만, 이 값은 사용자가 조작할 수 있습니다([06장 과제 2](#06-장바구니)). 그래서 주문할 때 브라우저는 **상품 ID와 수량만** 보내고, 가격은 DB에서 다시 읽어 계산합니다.

```
브라우저 → [{ product_id: 3, quantity: 2 }]   ← 가격은 보내지 않음
서버(DB) → 상품 가격 조회 → 합계 계산 → 주문 저장
```

### 2. DB 함수: `place_demo_order`

[`supabase/migrations/20261013000004_demo_orders.sql`](./supabase/migrations/20261013000004_demo_orders.sql)

```sql
create function public.place_demo_order(p_items jsonb)
returns jsonb
language plpgsql security definer set search_path = ''
as $$
begin
  -- ① 입력 검사: 비어있음, 50줄 초과, 수량 1~99
  -- ② 같은 상품이 여러 줄로 오면 합산
  for v_line in
    select (e ->> 'product_id')::bigint as product_id,
           sum((e ->> 'quantity')::int)::int as quantity
    from jsonb_array_elements(p_items) e group by 1 order by 1
  loop
    -- ③ DB의 실제 가격으로 계산, 판매중인지·재고 충분한지 확인
  end loop;
  -- ④ 배송비: 3만원 이상 무료
  -- ⑤ orders, order_items 저장 후 영수증(JSON) 반환
end;
$$;

grant execute on function public.place_demo_order(jsonb) to anon, authenticated;
```

DB 함수로 만든 이유:

| 장점 | 설명 |
|---|---|
| 한 번에 처리 | 주문과 주문상품 저장이 **모두 성공하거나 모두 실패** (트랜잭션) |
| 우회 불가 | 누가 API를 직접 호출해도 같은 검사를 통과해야 함 |
| 권한 분리 | `orders` 테이블에 직접 쓰기 권한을 주지 않고, 이 함수로만 주문 가능 |

#### 같은 상품을 여러 줄로 보내는 공격

`[{id:1, qty:99}, {id:1, qty:99}]`처럼 보내면 줄마다 검사할 경우 각각 통과할 수 있습니다. 그래서 **`group by`로 합산한 뒤** 재고를 검사합니다. 테스트 중 실제로 발견해서 고친 버그입니다.

#### 체험 주문은 재고를 줄이지 않음

로그인 없이 누구나 주문할 수 있으므로, 재고를 줄이면 장난으로 모든 상품을 품절시킬 수 있습니다. 그래서 체험 주문은 **재고를 검사만 하고 차감하지 않습니다.**

> 실제 쇼핑몰이라면 `select ... for update`로 상품 행을 잠근 뒤 재고를 차감합니다. 이전 버전인 `place_order` 함수(`20261013000003_order_fn_fixes.sql`)에 그 방식이 남아 있으니 비교해 보세요.

### 3. 서버 액션

[`src/actions/order.ts`](./src/actions/order.ts)

```ts
"use server";

export async function placeDemoOrder(items) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("place_demo_order", { p_items: items });
  if (error) return { error: error.message };
  revalidatePath("/admin", "layout");   // 관리자 화면 캐시 갱신
  return { receipt: data };
}
```

- `"use server"`: 이 파일의 함수는 **서버에서만** 실행됩니다. 클라이언트 컴포넌트에서 일반 함수처럼 불러도 실제로는 서버로 요청이 갑니다.
- `supabase.rpc(이름, 인자)`: DB 함수를 호출합니다.

### 4. 주문 화면

[`src/components/checkout/CheckoutForm.tsx`](./src/components/checkout/CheckoutForm.tsx)

```tsx
const [pending, startTransition] = useTransition();

const submit = () => {
  startTransition(async () => {
    const res = await placeDemoOrder(items.map((i) => ({ product_id: i.productId, quantity: i.quantity })));
    if (res.error) { setError(res.error); return; }
    clear();                  // 장바구니 비우기
    setReceipt(res.receipt);  // 영수증 보여주기
  });
};

<button disabled={pending}>{pending ? "주문 처리 중…" : "체험 주문하기"}</button>
```

- `useTransition`: 처리 중(`pending`)일 때 버튼을 비활성화해 **중복 주문을 막습니다.**
- 실패 메시지(예: "재고가 부족합니다")는 DB 함수가 만든 문구를 그대로 보여줍니다.

### 실습 과제
1. 개발자 도구 콘솔에서 공개 키로 `place_demo_order`를 직접 호출해 보고, 수량 100을 보내면 어떤 오류가 나는지 확인하세요.
2. "5만원 이상이면 5% 할인" 규칙을 추가하려면 함수의 어느 부분을 고쳐야 할까요? 브라우저 코드만 고치면 왜 안 될까요?
3. 체험 주문도 재고를 줄이게 바꾸려면 무엇을 추가해야 하고, 어떤 위험이 생기나요?

---

## 08. 관리자 페이지

### 학습 목표
- 로그인과 역할(role)로 관리자 화면을 보호할 수 있다.
- 서버 액션으로 상품·주문을 수정하는 기능을 만들 수 있다.

### 1. 3중 보호

관리자 기능은 세 곳에서 막습니다. 하나가 뚫려도 다음 단계에서 막히도록 하는 것이 원칙입니다.

| 단계 | 위치 | 하는 일 |
|---|---|---|
| ① 미들웨어 | `src/lib/supabase/middleware.ts` | 비로그인 → `/login`으로 이동 |
| ② 레이아웃 | `src/app/admin/layout.tsx` | 로그인했지만 관리자가 아니면 404 |
| ③ DB | RLS 정책, `is_admin()` | API를 직접 호출해도 거부 |

[`src/app/admin/layout.tsx`](./src/app/admin/layout.tsx)

```tsx
const session = await getCurrentUser();
if (!session) redirect("/login?next=/admin");
if (session.profile?.role !== "admin") notFound();
```

관리자가 아닌 사람에게 "권한 없음" 대신 **404**를 보여주면, 관리자 페이지가 있다는 사실도 숨길 수 있습니다.

### 2. 로그인

[`src/actions/auth.ts`](./src/actions/auth.ts)

```ts
export async function signIn(_: FormState, formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: "이메일 또는 비밀번호가 올바르지 않습니다." };
  redirect(safeNext(formData.get("next")));
}
```

#### 열린 리다이렉트 막기

로그인 후 `?next=` 주소로 보내는데, 여기에 `https://나쁜사이트.com`을 넣으면 로그인한 사용자를 외부로 보낼 수 있습니다.

```ts
const safeNext = (v) => {
  const s = typeof v === "string" ? v : "";
  return s.startsWith("/") && !s.startsWith("//") ? s : "/admin";
};
```

`/`로 시작하는 **사이트 내부 주소만** 허용합니다. `//evil.com`도 외부 주소로 해석되므로 따로 막습니다.

#### 폼 상태: `useActionState`

```tsx
const [state, action, pending] = useActionState(signIn, undefined);
<form action={action}> ... {state?.error && <p>{state.error}</p>}
```

서버 액션의 반환값(오류 메시지)과 처리 중 상태를 한 번에 받습니다.

### 3. 관리자 기능

| 화면 | 파일 | 기능 |
|---|---|---|
| 대시보드 | `app/admin/page.tsx` | 누적 매출, 주문 수, 배송 대기, 재고 부족 |
| 상품 관리 | `app/admin/products/page.tsx` | 신규 등록, 가격·재고·추천·판매중 수정 |
| 재고 관리 | `app/admin/inventory/page.tsx` | 재고 20개 이하 상품만 모아 보기 |
| 주문 관리 | `app/admin/orders/page.tsx` | 주문 상태 변경 (결제완료 → 배송중 → 배송완료) |

#### 서버 액션에서 한 번 더 확인

[`src/actions/admin.ts`](./src/actions/admin.ts)

```ts
async function adminClient() {
  const supabase = await createClient();
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) throw new Error("관리자 권한이 필요합니다.");
  return supabase;
}
```

RLS가 최종 방어선이지만, 여기서 먼저 확인하면 **알기 쉬운 오류 메시지**를 보여줄 수 있습니다.

#### 입력값 검증

```ts
if (!Number.isInteger(patch.price) || patch.price < 0) return { error: "가격이 올바르지 않습니다." };
if (!/^[a-z0-9-]+$/.test(slug)) return { error: "슬러그를 확인해 주세요." };
```

관리자 입력도 검증합니다. 실수로 음수 재고나 공백이 들어간 주소를 만들지 않도록요.

#### 취소는 DB 함수로

주문 취소는 단순히 `status = 'cancelled'`만 바꾸지 않고 `cancel_order()` 함수로 처리합니다. 이미 취소된 주문, 배송이 시작된 주문은 취소할 수 없게 함수 안에서 검사합니다.

### 4. 관리자 계정 만들기

회원가입이 없으므로 Supabase 대시보드에서 만듭니다.

1. Authentication → Users → **Add user** (이메일·비밀번호, Auto Confirm 체크)
2. SQL Editor에서 관리자로 지정

```sql
update public.profiles set role = 'admin'
where id = (select id from auth.users where email = '관리자이메일');
```

### 실습 과제
1. 관리자가 아닌 계정으로 로그인한 뒤 `/admin`에 들어가면 어떤 화면이 나오나요? 어느 코드 때문인가요?
2. `/login?next=https://google.com`으로 로그인하면 어디로 이동하나요?
3. 상품 관리에 "상품 설명(summary) 수정" 기능을 추가해 보세요. `updateProduct`의 `patch` 타입부터 바꿔야 합니다.

---

## 09. Vercel 배포

### 학습 목표
- 로컬에서 만든 Next.js 앱을 인터넷에 공개할 수 있다.
- 배포 환경의 환경변수와 비밀값 관리 방법을 이해한다.

### 1. 배포 전에 로컬에서 빌드해 보기

```bash
npx tsc --noEmit    # 타입 오류 확인
npx eslint src      # 코드 규칙 확인
npm run build       # 실제 배포와 같은 빌드
```

`npm run dev`에서는 되는데 빌드에서 실패하는 경우가 많습니다. 이 프로젝트에서 실제로 만난 빌드 오류:

| 오류 | 원인 | 해결 |
|---|---|---|
| `Cannot apply unknown utility class 'btn'` | Tailwind v4에서는 `.btn { @apply ... }` 방식의 커스텀 클래스를 `@apply`로 재사용할 수 없음 | `@utility btn { ... }`으로 정의 |
| 페이지 파일에서 상수 export 오류 | `page.tsx`는 정해진 이름만 export 가능 | 상수를 `lib/utils`로 이동 |

### 2. Vercel CLI로 배포

```bash
npm i -g vercel
vercel login                         # 브라우저에서 승인
vercel link --yes --project ardushop # 프로젝트 생성·연결
```

#### 환경변수 등록

`.env.local`은 배포되지 않으므로 Vercel에 따로 등록합니다.

```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
```

`production`(실서비스), `preview`(미리보기), `development`(로컬) 세 환경에 각각 등록합니다.

#### 비밀 파일이 올라가지 않게

[`.vercelignore`](./.vercelignore)

```
.env*
!.env.example
.claude
```

`.gitignore`와 별개로 Vercel 업로드에서도 제외합니다. 이 프로젝트의 `.env.local`에는 테스트 계정 비밀번호가 있어서 꼭 필요했습니다.

#### 배포

```bash
vercel deploy --prod
```

`https://ardushop.vercel.app`처럼 고정 주소가 생깁니다.

### 3. 보안 패치 때문에 배포가 거부된 사례

처음 배포할 때 Vercel이 이렇게 거부했습니다.

```
Error: Vulnerable version of Next.js detected, please update immediately.
```

Next.js 15.5.4에 알려진 취약점이 있었기 때문입니다. **같은 15.x 안의 최신 패치 버전**으로 올려서 해결했습니다.

```bash
npm view next dist-tags          # 버전 목록 확인
npm install next@15.5.27 eslint-config-next@15.5.27
npm run build                    # 다시 빌드 확인
```

메이저 버전(15 → 16)을 올리면 코드 수정이 필요할 수 있어서, 패치 버전만 올렸습니다.

### 4. 배포 후 확인

```bash
for p in / /products /cart /checkout /admin /없는주소; do
  echo "$p $(curl -s -o /dev/null -w '%{http_code}' https://ardushop.vercel.app$p)"
done
```

| 주소 | 기대값 |
|---|---|
| `/`, `/products`, `/cart`, `/checkout` | 200 |
| `/admin` (비로그인) | 307 (로그인으로 이동) |
| 없는 주소 | 404 |

### 5. 코드 수정 후 다시 배포

```bash
git add -A && git commit -m "변경 내용"
git push
vercel deploy --prod
```

GitHub 저장소를 Vercel 프로젝트에 연결하면 `git push`만으로 자동 배포됩니다. (Vercel → Settings → Git)

### 실습 과제
1. `vercel deploy`(`--prod` 없이)로 배포하면 어떤 주소가 나오나요? 실서비스 주소와 무엇이 다른가요?
2. Vercel 환경변수에서 `NEXT_PUBLIC_SUPABASE_URL`을 일부러 틀리게 바꾸고 다시 배포하면 어떤 화면이 나올까요? (확인 후 꼭 되돌리세요)

---

## 10. 보안 점검과 교육용 전환

### 학습 목표
- Supabase Security Advisor 경고를 읽고 대응할 수 있다.
- 서비스 목적에 맞게 개인정보 수집을 줄이는 결정을 내릴 수 있다.

### 1. Security Advisor

Supabase 대시보드 → Advisors → Security에서 DB 보안 경고를 볼 수 있습니다. 스키마를 바꿀 때마다 확인하는 습관을 들이세요.

이 프로젝트에서 나온 경고와 대응:

| 경고 | 대상 | 판단 | 대응 |
|---|---|---|---|
| 비로그인이 SECURITY DEFINER 함수 실행 가능 | `handle_new_user()` | 트리거 전용인데 API로 호출 가능 → **불필요** | 실행 권한 회수 |
| 〃 | `is_admin()` | 상품 조회 정책에서 사용, 항상 false 반환 → **의도된 것** | 유지 |
| 〃 | `place_demo_order()` | 비로그인 체험 주문용 → **의도된 것** | 유지 |
| 유출 비밀번호 차단 꺼짐 | Auth | 회원가입이 없어 해당 없음 | 유지 |

```sql
-- 20261013000002_revoke_trigger_fn_execute.sql
revoke execute on function public.handle_new_user() from public, anon, authenticated;
```

**경고 = 무조건 고칠 것**이 아닙니다. 각 경고가 의도한 동작인지 판단하고, 의도한 것이면 이유를 기록해 둡니다.

### 2. 테스트로 발견한 버그

권한·주문 기능은 스크립트로 직접 공격해 보며 확인했습니다. 그 과정에서 발견해 고친 것:

| 발견 | 문제 | 수정 |
|---|---|---|
| 같은 상품을 여러 줄로 주문 | 줄별 재고 검사를 각각 통과 | 상품별로 합산 후 검사 (`group by`) |
| 이미 취소된 주문을 다시 취소 | "배송이 시작된 주문" 이라는 엉뚱한 메시지 | 상태별 메시지 분리 |

### 3. 교육용으로 전환한 이유

처음에는 회원가입 → 로그인 → 주문(이름·연락처·주소 입력) 흐름이었습니다. 그런데:

- 실제로 판매하지 않는 **교육용** 사이트
- 개인정보를 받으면 보관·파기 책임과 개인정보처리방침이 필요
- Supabase 기본 메일 서버는 발송 제한이 있어서, 가입 확인 메일이 안 갈 수 있음

**"필요 없는 개인정보는 처음부터 받지 않는다"** 는 원칙(개인정보 최소수집)에 따라 바꿨습니다.

### 4. 바꾼 내용

[`supabase/migrations/20261013000004_demo_orders.sql`](./supabase/migrations/20261013000004_demo_orders.sql)

| 항목 | 전 | 후 |
|---|---|---|
| 회원가입 | 있음 | **삭제** |
| 마이페이지 | 주문내역·회원정보 | **삭제** |
| 주문 | 로그인 필수, 이름·연락처·주소 입력 | **로그인 없이 체험 주문**, 개인정보 없음 |
| 재고 | 주문 시 차감 | 검사만 (장난 주문으로 품절되는 것 방지) |
| 로그인 | 고객용 | **관리자 전용** (푸터의 작은 링크) |

```sql
-- 체험 주문에는 회원·배송 정보가 없다
alter table public.orders alter column user_id   drop not null;
alter table public.orders alter column recipient drop not null;
...
-- 개인정보를 받던 기존 주문 함수는 더 이상 호출 불가
revoke execute on function public.place_order(jsonb, text, text, text, text) from authenticated;
```

함수를 삭제(`drop`)하지 않고 **권한만 회수**했습니다. 마이그레이션 기록이 남고, 필요하면 다시 열 수 있습니다.

### 5. 전환 후 검증

| 확인 항목 | 결과 |
|---|---|
| 비로그인 체험 주문 | 성공, 주문번호 발급 |
| 체험 주문 후 재고 | 변화 없음 |
| 수량 100 주문 | 거부 |
| 비로그인으로 주문 목록 조회 | 빈 결과 |
| 기존 개인정보 주문 함수 호출 | `permission denied` |
| `/signup`, `/mypage` | 404 |

### 6. 실제 쇼핑몰로 확장한다면

| 필요한 것 | 방법 |
|---|---|
| 결제 | 토스페이먼츠 등 PG 연동 → 결제 승인 후 주문 확정 |
| 회원가입 | 이메일 인증, 유출 비밀번호 차단 켜기, 메일 서버(SMTP) 연결 |
| 재고 | `select ... for update`로 잠그고 차감 (`place_order` 참고) |
| 법적 요건 | 개인정보처리방침, 이용약관, 사업자 정보 표시 |

### 실습 과제
1. 본인 Supabase 프로젝트에서 Advisors를 열고 경고를 하나 골라 "의도된 것인지" 판단해 기록해 보세요.
2. 체험 주문에 "주문자 닉네임"을 받는다면 개인정보일까요? 받는다면 어떤 제약을 둘까요?
3. 6절의 확장 항목 중 하나를 골라 구현 계획을 세워 보세요.

---

## 부록: 프로젝트 정보

### 파일 위치

| 경로 | 내용 |
|---|---|
| `supabase/migrations/` | 테이블, RLS, 주문 함수 (`place_demo_order`, `cancel_order`) |
| `supabase/seed/products.json` | 상품 원본 데이터 (디바이스마트 판매가 기준) |
| `scripts/build-seed.mjs` | 상품 JSON → `seed.sql` 생성 |
| `scripts/build-readme.mjs` | `docs/lecture/` 장별 노트 → 이 README 생성 |

### 관리자 계정
회원가입이 없으므로 Supabase 대시보드에서 계정을 만들고 `profiles.role = 'admin'`으로 지정합니다. 로그인은 사이트 푸터의 "관리자" 링크(`/login`)입니다. 자세한 방법은 [08장](#08-관리자-페이지)에 있습니다.

### 이미지 출처
`public/images/`의 사진은 Wikimedia Commons의 자유 라이선스 이미지입니다. 저작자와 라이선스는 사이트의 `/credits` 페이지와 `public/images/credits.json`에 있습니다.

> 이 README는 `node scripts/build-readme.mjs`로 생성됩니다. 내용을 고칠 때는 `docs/lecture/`의 장별 파일을 수정한 뒤 스크립트를 다시 실행하세요.
