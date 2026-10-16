# 🐉 AI 에이전트로 조립PC "드래곤볼" 하기 — 강의노트

> 2026-10-13 실습 기록. Claude Code + Firecrawl + Google AI Studio(Gemini) + youtube-mcp 로
> **예산 150만원(모니터 제외) 조립PC 부품을 부품별 최저가 판매처에서 모으는(=드래곤볼)** 과정을 정리한 노트입니다.

결과 견적서 👉 [PC견적_2026-10-13.md](PC견적_2026-10-13.md)
공개 결과 페이지 👉 **https://chaechaechae99.github.io/pc-dragonball/**

---

## 목차
1. [오늘의 목표](#1-오늘의-목표)
2. [준비물: API 키 2개](#2-준비물-api-키-2개)
3. [크롤링 전에: 법적·윤리적 체크 (robots.txt)](#3-크롤링-전에-법적윤리적-체크-robotstxt)
4. [Firecrawl로 다나와 크롤링하기](#4-firecrawl로-다나와-크롤링하기)
5. [마크다운에서 가격 뽑아내기](#5-마크다운에서-가격-뽑아내기)
6. [시장 상황 파악 → 플랫폼 결정](#6-시장-상황-파악--플랫폼-결정)
7. [드래곤볼: 판매처별 최저가 + 배송비](#7-드래곤볼-판매처별-최저가--배송비)
8. [youtube-mcp 설치와 고장 수리](#8-youtube-mcp-설치와-고장-수리)
9. [조사 결과를 GitHub Pages로 공개하기](#9-조사-결과를-github-pages로-공개하기)
10. [정리 & 과제](#10-정리--과제)

---

## 1. 오늘의 목표

| 항목 | 내용 |
|---|---|
| 예산 | 150만원 (모니터 제외, 본체 부품 전부) |
| 방식 | **드래곤볼** — 조립PC 은어. 완본체를 사지 않고 부품마다 가장 싼 쇼핑몰에서 따로 사서 모으는 것 |
| 도구 | Firecrawl(웹 크롤링 API), 다나와(가격비교), Google Gemini API(임베딩), youtube-mcp(유튜브 리뷰 검색 MCP 서버) |

## 2. 준비물: API 키 2개

키는 **절대 코드나 깃에 넣지 말고** `.env` 파일에만 둡니다. 이 저장소의 `.gitignore`가 `.env`를 막고 있고, 형식은 `*.env.example`에 있습니다.

```
firecrawl/.env   →  FIRECRAWL_API_KEY=fc-...
google/.env      →  GOOGLE_API_KEY=...
```

### Firecrawl
- https://firecrawl.dev 가입 → API Key 복사. 무료 플랜 1,000 크레딧/월 (스크랩 1회 ≈ 1크레딧)
- 키 동작 확인(크레딧 조회):
  ```bash
  . firecrawl/.env
  curl -s -H "Authorization: Bearer $FIRECRAWL_API_KEY" https://api.firecrawl.dev/v1/team/credit-usage
  ```

### Google AI Studio (Gemini API 키)
- https://aistudio.google.com/apikey → 약관 동의(만 18세 이상) → 기본 프로젝트의 키 복사
- 💡 **변수 이름은 반드시 `GOOGLE_API_KEY`** — youtube-mcp 코드가 `os.getenv("GOOGLE_API_KEY")`로 읽음
- 💡 2026년 기준 새 키는 `AIza...`가 아니라 **`AQ.`로 시작하는 형식**도 나옴. 형식만 보고 잘못된 키라고 판단하지 말 것
- 키 동작 확인(모델 목록 조회):
  ```bash
  curl -s -H "x-goog-api-key: $GOOGLE_API_KEY" \
    "https://generativelanguage.googleapis.com/v1beta/models?pageSize=50" | grep embed
  ```
  → `gemini-embedding-001` 등이 보이면 OK. (옛 `embedding-001`은 목록에 없음 → 8장에서 수리)

## 3. 크롤링 전에: 법적·윤리적 체크 (robots.txt)

크롤링은 "할 수 있다"와 "해도 된다"가 다릅니다. 가장 먼저 각 사이트의 `robots.txt`를 확인합니다.

```bash
for d in search.danawa.com prod.danawa.com www.compuzone.co.kr www.11st.co.kr; do
  echo "== $d"; curl -s https://$d/robots.txt | head -20
done
```

| 사이트 | 결과 | 판단 |
|---|---|---|
| `search.danawa.com` | 일부 경로만 Disallow, **`Crawl-delay: 10`** | ✅ 검색결과 OK, **요청 사이 10초 대기** |
| `prod.danawa.com` | `/api/`, `/bridge/`, `/list/ajax/` 등만 Disallow | ✅ 상품 페이지(`/info/?pcode=`) OK |
| `www.compuzone.co.kr` | `Allow: /` | ✅ |
| `www.11st.co.kr` | 일반 봇 `Disallow: /` | ❌ 직접 크롤링 안 함 → 다나와에 나온 11번가 가격만 참고 |

원칙
- robots.txt가 막은 경로는 긁지 않는다
- Crawl-delay를 지킨다 (그래서 스크립트에 `sleep 10`)
- 로그인 필요 페이지, 개인정보는 건드리지 않는다
- 가격 "정보"만 개인 구매 판단용으로 쓰고, 데이터를 재배포하지 않는다

## 4. Firecrawl로 다나와 크롤링하기

Firecrawl은 URL을 주면 JS 렌더링까지 끝낸 페이지를 **마크다운**으로 돌려주는 API입니다.

[`scripts/scrape.sh`](scripts/scrape.sh)
```bash
curl -s -X POST https://api.firecrawl.dev/v1/scrape \
  -H "Authorization: Bearer $FIRECRAWL_API_KEY" -H "Content-Type: application/json" \
  -d '{"url":"https://search.danawa.com/dsearch.php?query=7500F&tab=goods","formats":["markdown"],"onlyMainContent":true}'
```

부품별 검색을 한 번에: [`scripts/crawl_parts.sh`](scripts/crawl_parts.sh) — 검색어 목록을 돌며 10초 간격으로 스크랩.

```bash
bash scripts/crawl_parts.sh      # → out/*.json
```

## 5. 마크다운에서 가격 뽑아내기

다나와 검색결과 마크다운은 30만 자가 넘고 메뉴·광고가 대부분입니다. 필요한 패턴만 정규식으로 뽑습니다.

다나와 검색결과 구조(관찰 결과)
```
[AMD 라이젠5-5세대 **7500F** (라파엘)](...pcode=21694499)   ← 상품명 + pcode
     212몰                                                 ← 입점 쇼핑몰 수
    [**171,370** 원](...pcode=21694499)                    ← 옵션별 최저가 (CPU/VGA/RAM 등)
    1위[멀티팩 정품]()                                      ← 옵션 이름
```
카테고리에 따라 `[112,080원](...pcode=...)` + `237몰` 처럼 **레이아웃이 다른 경우**도 있어서 두 패턴 모두 처리합니다.

```bash
python scripts/extract.py out/gpu9060.json 6    # 상위 6개 상품과 가격
```
```
# SAPPHIRE 라데온 RX 9060 XT PULSE OC D6 16GB  [pcode 91909571]
      848,990원  161몰
      790,490원  128몰    [pcode 91909763]
```

⚠️ 함정: 검색결과의 대표가격이 **어떤 용량 옵션의 가격인지** 꼭 확인. (예: "NVMe 1TB"로 검색해도 표시가격이 다른 용량일 수 있음 → `clean.py`로 원문을 보고 `**1TB**` 라벨 확인)

## 6. 시장 상황 파악 → 플랫폼 결정

크롤링해 보니 2026년 10월 메모리·저장장치 가격이 매우 높았습니다.

| 품목 | 최저가 수준 |
|---|---|
| DDR5-5600 16GB (1개) | 약 33만원 |
| DDR5-5600 32GB (16×2) | 약 69만원~ |
| DDR4-3200 8GB | 약 8만원 |
| NVMe 1TB / 500GB | 약 29만원 / 15~16만원 |
| RTX 5060 8GB / RX 9060 XT 16GB / RTX 5060 Ti 16GB | 약 67만 / 79만 / 104만원 |

→ AM5(DDR5) 구성은 최저가로 맞춰도 **약 155만원+** 로 예산 초과.
→ **AM4 + DDR4**로 플랫폼 비용을 줄이고, 아낀 돈을 그래픽카드(RX 9060 XT 16GB)에 투자.

> 교훈: "요즘 국룰 견적"을 외워서 쓰지 말고, **현재 가격 데이터를 먼저 보고** 구성을 정한다.

## 7. 드래곤볼: 판매처별 최저가 + 배송비

부품을 정했으면 다나와 **상품 페이지**(`prod.danawa.com/info/?pcode=...`)를 크롤링합니다. 쇼핑몰 이름은 텍스트가 아니라 **로고 이미지의 alt 텍스트**(`![11번가](...logo.gif)`)에 들어있다는 게 포인트.

```bash
bash scripts/crawl_products.sh   # 상품 페이지 크롤링 + scripts/malls.py로 판매처 비교
```
```
## ASRock 라데온 RX 9060 XT CHALLENGER OC D6 16GB 대원씨티에스
    790,490원  배송 무료      11번가
    790,500원  배송 무료      G마켓
## 삼성전자 DDR4-3200 (8GB)
     80,190원  배송 4,000원   컴오아시스
     81,990원  배송 무료      G마켓
```

드래곤볼 팁
- **단가 + 배송비**로 비교 (8GB×2를 사면 G마켓 무료배송이 컴오아시스보다 쌀 수도 있음)
- 한 판매처에 여러 부품이 몰리면 **묶음배송**으로 배송비 절약 (오늘은 컴오아시스에 5개)
- 최종 결과: **약 1,499,000원** → [견적서](PC견적_2026-10-13.md)

## 8. youtube-mcp 설치와 고장 수리

[ia-programming/youtube-mcp](https://github.com/ia-programming/youtube-mcp): 유튜브 검색 / 자막 추출 / 자막을 Gemini 임베딩으로 LanceDB에 저장 / 의미 검색을 제공하는 MCP 서버. 부품 리뷰 영상 조사용.

### 설치
```bash
git clone https://github.com/ia-programming/youtube-mcp
cd youtube-mcp
pip install uv            # uv가 없으면
cp ../google/.env .env    # GOOGLE_API_KEY
uv sync
git apply ../patches/youtube-mcp.patch   # ↓ 아래 수리 내용
uv add "youtube-transcript-api>=1.2"
```

### 그대로는 안 돌아간 이유 4가지 (2026-10 기준)
| 증상 | 원인 | 수리 |
|---|---|---|
| 자막 추출 시 `ParseError: no element found` | 고정된 `youtube-transcript-api==0.6.3`이 유튜브 변경으로 고장 | 1.2.x로 업그레이드, 새 API(`YouTubeTranscriptApi().list()/fetch()`)로 직접 호출하는 `fetch_transcript()` 추가 (LangChain `YoutubeLoader`는 옛 API를 써서 사용 불가) |
| 임베딩 실패 가능 | `models/embedding-001` 서비스 종료 | `models/gemini-embedding-001` + `output_dimensionality=768` (기존 LanceDB 스키마 768차원 유지) |
| 한국어 자막이 빈 문자열 | `clean_text()`가 ASCII 외 문자를 전부 삭제 | 이모지(BMP 밖 문자)만 제거하도록 변경 |
| 에러 메시지 대신 `McpError.__init__()...` | 최신 mcp SDK의 `McpError` 시그니처 변경 | `McpError(ErrorData(code=..., message=...))` |

전체 변경: [`patches/youtube-mcp.patch`](patches/youtube-mcp.patch)

### 동작 테스트 & Claude Code 연결
```bash
python scripts/mcptest.py "<youtube-mcp 경로>"   # 4개 툴 실제 호출 테스트
claude mcp add youtube -s local -- uv --directory "<youtube-mcp 경로>" run server.py
claude mcp get youtube                           # Status: ✔ Connected
```
키는 MCP 설정이 아니라 `youtube-mcp/.env`에서 읽히게 해서 설정 파일에 키가 남지 않게 했습니다.

## 9. 조사 결과를 GitHub Pages로 공개하기

목표: **이 저장소(코드·노트)는 비공개로 두고, 결과 페이지 링크만 공개**

### 막힌 점
```bash
gh api -X POST repos/chaechaechae99/WebShopping/pages -f "source[branch]=main" -f "source[path]=/"
# → 422 "Your current plan does not support GitHub Pages for this repository."
```
GitHub **무료 플랜은 비공개 저장소에서 Pages를 켤 수 없음** (Pro 이상 필요).

### 해결: 페이지 전용 공개 저장소 분리
| 저장소 | 공개 여부 | 내용 |
|---|---|---|
| `WebShopping` (여기) | 🔒 비공개 | 강의노트, 스크립트, 패치, 페이지 원본 [`site/index.html`](site/index.html) |
| [`pc-dragonball`](https://github.com/chaechaechae99/pc-dragonball) | 🌐 공개 | `index.html` 한 장 + `.nojekyll` 뿐 (키·스크립트 없음) |

```bash
mkdir pages && cp site/index.html pages/ && touch pages/.nojekyll
cd pages && git init -b main && git add -A && git commit -m "견적 페이지"
gh repo create pc-dragonball --public --source . --push
gh api -X POST repos/chaechaechae99/pc-dragonball/pages -f "source[branch]=main" -f "source[path]=/"
gh api repos/chaechaechae99/pc-dragonball/pages --jq .status   # building → built (약 2분)
```
→ **https://chaechaechae99.github.io/pc-dragonball/**

- 페이지 수정 시: `site/index.html` 수정 → `pc-dragonball` 저장소에 복사해서 push
- 한계: 프로필의 저장소 목록에 `pc-dragonball`은 보임. 완전히 숨기려면 GitHub Pro로 비공개 저장소 Pages 사용
- 페이지는 단일 HTML(외부 라이브러리 없음), 모바일·다크모드 대응

## 10. 정리 & 과제

**오늘 배운 것**
1. 비밀키는 `.env` + `.gitignore`, 깃에는 `.env.example`만
2. 크롤링 전 robots.txt 확인, Crawl-delay 준수, 막힌 사이트는 우회하지 않고 가격비교 사이트 정보로 대체
3. 크롤링 결과는 거대한 마크다운 → 구조를 관찰하고 정규식으로 필요한 것만 추출
4. 견적은 "현재 데이터 → 판단" 순서로. 시장이 바뀌면 정답 구성도 바뀐다
5. 오픈소스 MCP 서버는 의존성 노후화로 깨져 있을 수 있음 → 실제로 끝까지 호출해 보고 고친다

**과제**
- [ ] 컴오아시스 장바구니에서 5개 부품 묶음배송 배송비 확인 → 견적서 업데이트
- [ ] youtube-mcp로 "RX 9060 XT 리뷰" 영상 3개 저장 후 "발열/소음" 의미 검색해 보기
- [ ] `store-video-info`의 metadata가 저장되지 않는 문제 수정 (LanceDB 스키마가 빈 struct)
- [ ] 같은 스크립트로 1주일 뒤 가격 다시 크롤링해서 변동 비교

---

### 폴더 구조
```
.
├── README.md                  # 이 강의노트
├── PC견적_2026-10-13.md        # 최종 견적서
├── scripts/
│   ├── scrape.sh              # Firecrawl 스크랩 1건
│   ├── crawl_parts.sh         # 다나와 부품 검색 일괄 크롤링 (10초 간격)
│   ├── crawl_products.sh      # 선택 부품 상품페이지 크롤링 + 판매처 비교
│   ├── clean.py               # 마크다운 정리(원문 확인용)
│   ├── extract.py             # 검색결과 → 상품/옵션/가격/입점몰수
│   ├── malls.py               # 상품페이지 → 판매처/가격/배송비
│   └── mcptest.py             # youtube-mcp 툴 호출 테스트
├── site/index.html            # 공개 결과 페이지 원본 (→ pc-dragonball 저장소로 배포)
├── patches/youtube-mcp.patch  # youtube-mcp 수리 패치
├── firecrawl/.env.example
└── google/.env.example
```

---

> 🔒 공개 버전 안내: 웹 크롤링 코드와 수집 데이터는 이용약관·저작권 문제를 피하려고 이 저장소에서 제외했고, 비공개 저장소(`WebShopping-private`)에 따로 보관합니다.
