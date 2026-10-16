# 03. RLS로 권한 지키기

## 학습 목표
- Supabase에서 브라우저가 DB에 직접 접근할 때의 위험을 이해한다.
- RLS 정책으로 "누가 어떤 행을 읽고 쓸 수 있는지" 정할 수 있다.

## 1. 왜 RLS가 필요한가

Supabase는 **공개 키(publishable key)** 만 있으면 누구나 DB API를 호출할 수 있습니다. 이 키는 브라우저 코드에 들어가므로 숨길 수 없습니다.

그래서 "화면에 버튼을 안 보여주는 것"으로는 보안이 안 됩니다. **DB가 직접 요청을 거부해야** 합니다. 이것이 **RLS(Row Level Security, 행 단위 보안)** 입니다.

```sql
alter table public.products enable row level security;
```

RLS를 켜면 **정책이 허락한 것 외에는 전부 거부**됩니다.

## 2. 정책 읽는 법

```sql
create policy "정책 이름" on 테이블
  for 동작              -- select / insert / update / delete / all
  to 역할               -- anon(비로그인) / authenticated(로그인)
  using (조건)          -- 기존 행 중 어떤 행에 적용할지
  with check (조건);    -- 새로 쓰는 값이 만족해야 할 조건
```

## 3. 이 프로젝트의 정책

### 상품: 누구나 판매중 상품을 보고, 관리자만 수정

```sql
create policy "products: 판매중 상품 조회" on public.products
  for select using (is_active or (select public.is_admin()));

create policy "products: 관리자 관리" on public.products
  for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
```

- 방문자는 `is_active = true`인 상품만 보입니다.
- 관리자는 숨긴 상품까지 보고 수정할 수 있습니다.

### 관리자 확인 함수

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

### 주문: 비로그인은 목록을 볼 수 없음

```sql
create policy "orders: 본인/관리자 조회" on public.orders
  for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));
```

비로그인(`anon`)용 정책이 없으므로, 방문자는 다른 사람의 주문을 조회할 수 없습니다.

## 4. 컬럼 단위 권한: 스스로 관리자가 되는 것 막기

본인 프로필 수정을 허용하면, `role` 컬럼까지 `admin`으로 바꿀 수 있게 됩니다. 그래서 **수정 가능한 컬럼을 지정**합니다.

```sql
revoke update on public.profiles from authenticated, anon;
grant update (name, phone, address) on public.profiles to authenticated;
```

## 5. 테스트로 확인하기

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

## 실습 과제
1. `categories` 테이블에 "누구나 조회" 정책이 없다면 홈 화면은 어떻게 될까요?
2. 리뷰(`reviews`) 테이블을 만든다고 할 때, "누구나 읽기 / 로그인한 사람만 쓰기 / 본인 글만 삭제" 정책 세 개를 작성해 보세요.
