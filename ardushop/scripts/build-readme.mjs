// docs/lecture/*.md → README.md (강의노트 전체를 한 파일로)
// 실행: node scripts/build-readme.mjs
import fs from "node:fs";

const root = new URL("..", import.meta.url);
const dir = new URL("docs/lecture/", root);
const chapters = fs.readdirSync(dir).filter((f) => /^\d\d-.*\.md$/.test(f)).sort();

// GitHub 헤딩 앵커 규칙: 소문자, 문자·숫자·공백·하이픈만 남기고 공백 → 하이픈
const slug = (h) => h.trim().toLowerCase().replace(/[^\p{L}\p{M}\p{N}\p{Pc} -]/gu, "").replace(/ /g, "-");

const titles = Object.fromEntries(
  chapters.map((f) => [f, fs.readFileSync(new URL(f, dir), "utf8").match(/^# (.+)$/m)[1]]),
);

const fixLinks = (md) =>
  md
    // 장 사이 링크 → README 안 앵커
    .replace(/\]\((\d\d-[^)#]+\.md)\)/g, (_, f) => `](#${slug(titles[f])})`)
    // docs/lecture 기준 상대경로 → 저장소 루트 기준
    .replace(/\]\(<\.\.\/\.\.\//g, "](<./")
    .replace(/\]\(\.\.\/\.\.\//g, "](./");

const body = chapters
  .map((f) => {
    const md = fs.readFileSync(new URL(f, dir), "utf8");
    // 장 제목 #→##, 하위 제목 한 단계씩 내림 (코드 블록 안은 그대로)
    let inCode = false;
    const demoted = md
      .split("\n")
      .map((line) => {
        if (line.startsWith("```")) inCode = !inCode;
        return !inCode && /^#{1,5} /.test(line) ? `#${line}` : line;
      })
      .join("\n");
    return fixLinks(demoted).trim();
  })
  .join("\n\n---\n\n");

const toc = chapters.map((f) => `${titles[f].match(/^\d+/)[0]}. [${titles[f].replace(/^\d+\.\s*/, "")}](#${slug(titles[f])})`).join("\n");

const readme = `# 아두몰 — Next.js + Supabase로 쇼핑몰 만들기 (강의노트)

아두이노 부품 쇼핑몰 **아두몰**을 처음부터 배포까지 만드는 과정을 정리한 강의노트입니다.

- 완성본: https://ardushop.vercel.app
- 실제 판매는 하지 않는 **교육용 데모**입니다. 회원가입·결제가 없고, 누구나 개인정보 없이 "체험 주문"을 할 수 있습니다.

## 완성본 미리보기

| 화면 | 주소 |
|---|---|
| 홈 | \`/\` |
| 전체상품 / 카테고리 / 검색 | \`/products\`, \`/categories/sensors\`, \`/search?q=우노\` |
| 상품 상세 | \`/products/arduino-uno-r3\` |
| 장바구니 → 체험 주문 | \`/cart\` → \`/checkout\` |
| 관리자 (로그인 필요) | \`/admin\` |

## 기술 스택

| 역할 | 기술 | 한 줄 설명 |
|---|---|---|
| 화면·서버 | **Next.js 15** (App Router) | React 기반. 페이지와 서버 로직을 한 프로젝트에서 작성 |
| 스타일 | **Tailwind CSS v4** | 클래스 이름으로 스타일 지정 |
| DB·인증 | **Supabase** | Postgres DB + 로그인 + 행 단위 권한(RLS) |
| 상태 관리 | **Zustand** | 장바구니를 브라우저에 저장 |
| 배포 | **Vercel** | 명령 한 줄로 인터넷에 공개 |

## 직접 실행해 보기

\`\`\`bash
npm install
cp .env.example .env.local   # Supabase URL과 공개 키 입력
npm run dev                  # http://localhost:3000
\`\`\`

DB는 \`supabase/migrations/\`의 SQL을 번호 순서대로 실행한 뒤 \`supabase/seed/seed.sql\`로 상품을 넣습니다.

## 목차

${toc}
- [부록: 프로젝트 정보](#부록-프로젝트-정보)

---

${body}

---

## 부록: 프로젝트 정보

### 파일 위치

| 경로 | 내용 |
|---|---|
| \`supabase/migrations/\` | 테이블, RLS, 주문 함수 (\`place_demo_order\`, \`cancel_order\`) |
| \`supabase/seed/products.json\` | 상품 원본 데이터 (디바이스마트 판매가 기준) |
| \`scripts/build-seed.mjs\` | 상품 JSON → \`seed.sql\` 생성 |
| \`scripts/build-readme.mjs\` | \`docs/lecture/\` 장별 노트 → 이 README 생성 |

### 관리자 계정
회원가입이 없으므로 Supabase 대시보드에서 계정을 만들고 \`profiles.role = 'admin'\`으로 지정합니다. 로그인은 사이트 푸터의 "관리자" 링크(\`/login\`)입니다. 자세한 방법은 [08장](#${slug(titles[chapters.find((f) => f.startsWith("08"))])})에 있습니다.

### 이미지 출처
\`public/images/\`의 사진은 Wikimedia Commons의 자유 라이선스 이미지입니다. 저작자와 라이선스는 사이트의 \`/credits\` 페이지와 \`public/images/credits.json\`에 있습니다.

> 이 README는 \`node scripts/build-readme.mjs\`로 생성됩니다. 내용을 고칠 때는 \`docs/lecture/\`의 장별 파일을 수정한 뒤 스크립트를 다시 실행하세요.
`;

fs.writeFileSync(new URL("README.md", root), readme);
console.log(`README.md: ${chapters.length}장, ${readme.split("\n").length}줄`);
