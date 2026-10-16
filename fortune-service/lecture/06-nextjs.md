# 06강. Next.js 실제 사이트

## 학습 목표
- 프로토타입을 Next.js App Router 프로젝트로 옮긴다
- 전역 상태(생년월일)를 Context + localStorage로 동기화한다
- 테마 깜빡임 없는 다크 모드를 만든다
- 여러 작업을 병렬로 진행한다

---

## 1. 프로젝트 생성

```bash
winget install OpenJS.NodeJS.LTS          # Node.js 설치
npx create-next-app@15 web --ts --tailwind --eslint --app --no-src-dir --use-npm
```

## 2. 라우트 구조

```
app/
├── page.tsx                 홈 (꿈 검색 + 운세 + 신비)
├── fortune/[type]/          운세 7종 — generateStaticParams로 정적 생성
├── zodiac/[sign]/           별자리 12개 정적 페이지
├── dream/  dream/diary/     꿈해몽, 꿈 일기
├── tarot/  past-life/  spouse/  lotto/  zodiac-animal/
└── terms/                   이용 안내·면책
```

## 3. 생년월일 하나로 사이트 전체 동기화

```
<BirthBar/> (헤더 입력칸) ──setProfile──▶ <ProfileProvider/> (Context)
                                              │  localStorage 저장
                                              ▼
                              모든 페이지: useProfile() → saju(profile)
```

- 입력을 바꾸면 **보고 있던 페이지가 즉시** 다시 계산된다
- 저장값이 없으면 예시(1990-01-01 午 남)로 시작 → 첫 화면부터 결과가 보인다
- 예전 저장값(calendar 필드 없음)은 양력으로 **마이그레이션**
- 없는 날짜(1985년 윤3월)는 입력칸에서 바로 안내

> 처음엔 "환영 모달 → 프로필 칩"이었는데 "로고 옆 입력칸이 덜 귀찮다"는 피드백으로 바꿨다. **입력은 적게, 바꾸기는 쉽게.**

## 4. 깜빡임 없는 다크 모드

React가 그려지기 **전에** 저장된 테마를 적용해야 한다.

```tsx
const themeScript = `try{var t=localStorage.getItem('${THEME_KEY}');
  document.documentElement.dataset.theme=t==='dark'?'dark':'light'}catch(e){…}`;

<html data-theme="light" suppressHydrationWarning>
  <head><script dangerouslySetInnerHTML={{ __html: themeScript }} /></head>
```

## 5. 결정적(deterministic) 랜덤

운세 문장은 문장 풀에서 고르는데, **같은 사람·같은 날엔 같은 결과**여야 한다.

```ts
const r = seeded(hash(profile + date + type));   // 시드 고정 난수
const line = pick(TODAY_ALL, r);
```

새로고침할 때마다 운세가 바뀌면 신뢰가 깨진다.

## 6. 병렬 작업 — 파일 소유권 나누기

M4·M6·M3를 동시에 진행할 때 충돌을 막은 규칙:

| 작업 | 수정 가능 파일 |
|---|---|
| A. 사주 엔진 | `lib/saju/**`, BirthBar, ProfileProvider, **package.json (npm install은 A만)** |
| B. 결과 카드 | `components/share/**`, past-life, spouse, tarot |
| C. 꿈해몽 | `app/dream/**`, `lib/dream/**`, dreams.json, 크롤러 |

추가 규칙:
- 시작 전 **커밋** (되돌릴 지점)
- 개발 서버가 돌고 있으니 각자 `npm run build` 금지 (`.next` 충돌) → `tsc --noEmit`, `lint`만
- 모두 끝나면 한 번에 build·test·commit

B가 A의 export(`EL`, `mod`, `GAN`)를 쓰게 되자 A에게 "그 export 유지" 메시지를 보냈다. **공유 인터페이스는 명시적으로 고정.**

## 7. 검증 체크리스트

```bash
npx tsc --noEmit     # 타입
npm run lint         # 0 errors
npm run test:saju    # 정답셋
npm run build        # 32~33 페이지 정적 생성
curl 로 주요 페이지 200 확인 + 실제 브라우저에서 클릭 테스트
```

## 정리
- 전역 입력은 Context + localStorage, 하위 호환(마이그레이션) 챙기기
- 테마는 그리기 전에 적용
- 운세 랜덤은 시드 고정
- 병렬 작업은 파일 소유권 + 시작 전 커밋
