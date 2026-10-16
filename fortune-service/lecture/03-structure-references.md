# 03강. 폴더 구조와 레퍼런스

## 학습 목표
- 원문 데이터와 서비스 데이터를 **폴더 수준에서** 분리한다
- 직접 만들 것과 라이브러리로 해결할 것을 구분한다

---

## 1. 최종 폴더 구조

```
C:\dev\fortune-service\          (비공개 저장소)
├── PLAN.md  REFERENCES.md  README.md
├── lecture/                     ← 이 강의노트
├── crawl/                       ← 수집 스크립트
│   └── output/                  ⚠ 원문 — .gitignore, 공개 금지
├── data/                        ✅ 자체 작성 데이터 (dreams.json, saju_answers.json)
├── references/tarot/            퍼블릭 도메인 타로 이미지
├── prototype/index.html         HTML 프로토타입
├── scripts/deploy-site.sh       배포 스크립트
└── web/                         Next.js 실제 사이트
    ├── app/        페이지 (dream, tarot, fortune/[type], zodiac/[sign] …)
    ├── components/ BirthBar, ProfileProvider, share/ …
    ├── lib/saju/   사주 엔진 (simple.ts, engine.ts)
    ├── lib/dream/  키워드 해몽
    ├── lib/fortune/ 문장 풀, 점수 계산
    └── data/       dreams.json, tarot.json

C:\dev\fortune-service-site\     (공개 저장소 — 빌드 결과만)
```

## 2. 핵심 원칙: 원문 ≠ 서비스 데이터

| 폴더 | 내용 | 공개 |
|---|---|---|
| `crawl/output/` | 수집한 원문 | ❌ 로컬에만 |
| `data/` | 재작성본·사실 데이터 | ✅ 사이트에 들어감 |

폴더로 나눠 두면 실수로 원문이 섞일 일이 없다. `.gitignore`가 두 번째 안전장치.

```gitignore
.env
**/.env*
crawl/output/
references/design_*.png   # 타사 화면 캡처
web/node_modules/
web/.next/
web/out/
```

## 3. OneDrive 밖에서 개발하기

처음엔 `OneDrive\바탕 화면\…`에 만들었다가 `C:\dev`로 옮겼다. `node_modules`(파일 수만 개)가 계속 동기화되면 PC가 느려지고 파일 잠금 오류가 난다.

## 4. 레퍼런스 조사 — 라이브러리 비교

| 라이브러리 | 특징 | 선택 |
|---|---|---|
| **manseryeok** | 4기둥(절기 시각 반영), 십신·대운, 음양력 1391~2100, MIT | ⭐ 1순위 |
| @fullstackfamily/manseryeok | 4기둥, 절기, 대운·십신 없음 | 대안 |
| korean-lunar-calendar | 음양력 변환 전용, KASI 기준 | 대안 |
| lunar-javascript (6tail) | 중국식 八字 종합 | 교차 검증용 |

> 직접 만들기 어려운 것(정확한 절기 시각, 음력 변환)은 라이브러리로, **공부가 되는 것**(60갑자, 일주 공식)은 직접 구현했다(05강).

## 5. 레퍼런스 문서에 꼭 넣을 것
- 출처 URL과 **무엇을 참고했는지** (레이아웃만? 항목 구성만?)
- 라이선스 (MIT, OFL, 퍼블릭 도메인)
- 공식 검증 데이터 (한국천문연구원 음양력 API)
- 앞으로 필요한 것 (API 키 등)

## 정리
- 원문과 서비스 데이터는 폴더부터 분리
- 개발 폴더는 클라우드 동기화 밖에
- "직접 만들 것 vs 라이브러리"를 공부 목표 기준으로 나눈다
