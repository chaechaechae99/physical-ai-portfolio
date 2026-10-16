# 09강. GitHub 업로드와 배포

## 학습 목표
- `gh` CLI로 저장소를 만들고 올린다
- Next.js를 정적 사이트로 내보내 GitHub Pages에 배포한다
- 소스는 비공개, 사이트만 공개하는 구조를 만든다

---

## 1. 공유 가능한 주소 vs 아닌 주소

| 주소 | 친구가 열 수 있나? |
|---|---|
| `http://localhost:3000` | ❌ "내 컴퓨터"라는 뜻. 친구 기기에선 친구 컴퓨터를 찾는다 |
| Claude artifact 링크 | △ Claude 로그인 필요 |
| `https://chaechaechae99.github.io/fortune-service-site/` | ✅ 누구나, 폰에서도 |

> 시크릿 모드에서 localhost가 열리는 건 **같은 컴퓨터**라서다. 로그인 정보만 없을 뿐.

## 2. gh CLI로 저장소 만들기

```bash
gh auth status                          # 로그인 확인
git init -b main && git add -A && git commit -m "…"
gh repo create fortune-service --private --source=. --remote=origin --push
```

올리기 전 민감 파일 점검:
```bash
git status --short | grep -iE "\.env|output/|design_|node_modules"   # 아무것도 안 나와야 함
```

## 3. Next.js 정적 내보내기

```ts
// next.config.ts — 배포 빌드에서만 적용, 로컬 dev는 그대로
const basePath = process.env.PAGES_BASE_PATH ?? "";
const nextConfig = {
  ...(basePath && { output: "export", basePath, trailingSlash: true,
                    images: { unoptimized: true } }),
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
};
```

주의할 점:
- GitHub Pages 주소는 `/저장소이름/` 하위 경로 → `basePath` 필요
- `next/link`, `router.push`는 basePath 자동 처리. **직접 쓴 문자열 경로는 안 된다**
  ```ts
  const img = (id) => `${process.env.NEXT_PUBLIC_BASE_PATH}/tarot/${id}.jpg`;
  ```
- `_next/` 폴더 때문에 `.nojekyll` 파일 필요
- `trailingSlash: true` → `/dream/` → `dream/index.html`로 서빙

## 4. 최종 구조: 소스 비공개 + 사이트 공개

무료 계정은 **비공개 저장소에서 Pages를 못 켠다.** 그래서 저장소를 둘로 나눴다.

```
fortune-service (🔒 비공개)            fortune-service-site (🌐 공개)
 크롤러·문서·소스 코드         빌드 ─▶   out/ 결과물만  ─▶  GitHub Pages
```

```bash
bash scripts/deploy-site.sh
# 1) PAGES_BASE_PATH=/fortune-service-site 로 빌드
# 2) prototype/ 와 .nojekyll 추가
# 3) fortune-service-site 폴더에 복사 → commit → push
```

Pages 켜기 (CLI):
```bash
gh api -X POST repos/<user>/fortune-service-site/pages \
  -f "source[branch]=main" -f "source[path]=/"
```

## 5. 시도했다가 바꾼 것들
| 시도 | 결과 |
|---|---|
| Vercel 웹 Import | Vercel 계정에 GitHub 연결이 안 돼 "Could not access the repository" |
| Vercel CLI | 기기 인증 단계까지 갔으나 GitHub 방식으로 전환 |
| 공개 저장소 + Actions 자동 배포 | 성공했지만 크롤러·문서까지 공개됨 |
| **소스 비공개 + 사이트 저장소 공개** | ✅ 최종 |

## 정리
- localhost는 공유 주소가 아니다
- 정적 내보내기 + basePath + .nojekyll
- 하드코딩한 경로는 basePath를 붙인다
- 공개할 것(결과물)과 숨길 것(소스·수집 코드)을 저장소로 분리
