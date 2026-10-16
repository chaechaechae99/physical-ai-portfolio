# 04. Next.js와 Supabase 연결

## 학습 목표
- 환경변수로 접속 정보를 관리할 수 있다.
- 서버 컴포넌트에서 Supabase를 쓰는 방법과, 로그인 세션을 쿠키로 유지하는 방법을 이해한다.

## 1. 환경변수

`.env.local` (git에 올리지 않음):

```
NEXT_PUBLIC_SUPABASE_URL=https://<프로젝트>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
```

- `NEXT_PUBLIC_`으로 시작하면 브라우저 코드에서도 읽을 수 있습니다.
- 공개 키는 원래 공개돼도 되는 값입니다. 보안은 [03장 RLS](03-RLS-권한.md)가 담당합니다.
- **절대 공개하면 안 되는 키**(service_role, secret key)는 이 프로젝트에서 쓰지 않습니다.
- 저장소에는 값 없이 [`.env.example`](../../.env.example)만 올립니다.

## 2. 서버용 Supabase 클라이언트

[`src/lib/supabase/server.ts`](../../src/lib/supabase/server.ts)

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

## 3. 미들웨어: 모든 요청 앞에서 실행

[`src/middleware.ts`](../../src/middleware.ts) → [`src/lib/supabase/middleware.ts`](../../src/lib/supabase/middleware.ts)

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

## 4. 데이터 조회를 한 곳에 모으기

[`src/lib/data.ts`](../../src/lib/data.ts)

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

## 5. 연결 확인

```bash
npm run dev
```

홈에 카테고리 7개가 보이면 연결 성공입니다. 안 보이면 다음을 확인하세요.

- `.env.local` 값에 오타가 없는지
- 환경변수를 바꿨다면 개발 서버를 **재시작**했는지
- `categories` 테이블에 RLS "누구나 조회" 정책이 있는지

## 실습 과제
1. `PROTECTED`에 `/cart`를 추가하면 어떤 일이 생기나요? 실제로 바꿔서 확인해 보세요.
2. `getCategories`에서 `cache()`를 빼면 홈 화면 한 번에 카테고리 조회가 몇 번 일어날까요? (힌트: 헤더와 본문)
