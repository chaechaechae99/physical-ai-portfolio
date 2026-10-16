# 운결 (fortune-service/web)

Next.js 15 (App Router) + TypeScript + Tailwind v4. 계획서는 `../PLAN.md`.

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # 프로덕션 빌드
npm run lint
npm run test:saju  # 간이 만세력을 ../data/saju_answers.json 정답셋과 비교
```

- `lib/saju/simple.ts` — 간이 만세력 (양력만, 절기는 고정 날짜 근사). M4에서 정식 엔진으로 교체 예정
- `data/dreams.json`, `data/tarot.json` — 자체 작성 콘텐츠
- `public/tarot/` — Rider-Waite 타로 (1909, 퍼블릭 도메인)
- 생년월일·궁합 상대·꿈 일기·테마는 브라우저 localStorage에만 저장 (서버 저장 없음)
