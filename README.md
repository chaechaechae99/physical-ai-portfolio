# 🤖 Physical AI Portfolio

> **피지컬 AI 교육에서 배운 내용**을 프로젝트별로 모아 둔 저장소입니다.
> 컴퓨터 비전, 모션 인식 게임, AI 에이전트, 웹 서비스, 전자전기 기초까지 실습하며 만든 결과물을 정리했습니다.

각 폴더는 원래 따로 있던 저장소를 그대로 옮긴 것이고, 커밋 기록도 함께 옮겨 왔습니다.

---

## 📂 프로젝트 목록

### 👁️ 컴퓨터 비전 (Vision AI)

| 프로젝트 | 설명 | 기술 |
|---|---|---|
| [face-landmark](./face-landmark) | 웹캠으로 얼굴 랜드마크를 실시간 검출 | Python · MediaPipe |
| [gesture-recognition](./gesture-recognition) | 웹캠으로 손 제스처를 실시간 인식 | Python · MediaPipe |
| [hand-landmark](./hand-landmark) | 손 랜드마크 검출 + 나만의 제스처 학습 · [🌐 데모](https://chaechaechae99.github.io/hand-landmark/) | Python · MediaPipe · JS |
| [yolo26-webcam](./yolo26-webcam) | 웹캠 실시간 객체 탐지 · 분할 · 추적 | Python · Ultralytics YOLO26 |

### 🎮 모션 인식 · 웹 게임

| 프로젝트 | 설명 | 기술 |
|---|---|---|
| [snake](./snake) | 웹캠 동작으로 조종하는 뱀게임 | Teachable Machine · JS |
| [whack-a-mole](./whack-a-mole) | 30초 두더지 잡기 웹게임 · [🌐 플레이](https://chaechaechae99.github.io/whack-a-mole/) | HTML · JS |

### 🧠 AI 에이전트 · 웹 서비스

| 프로젝트 | 설명 | 기술 |
|---|---|---|
| [ardushop](./ardushop) | 아두이노 부품 쇼핑몰 '아두몰' 제작 강의노트 | Next.js · Supabase |
| [WebShopping](./WebShopping) | AI 에이전트로 조립PC 견적 짜기 강의노트 | Claude Code · Gemini · MCP |
| [pc-dragonball](./pc-dragonball) | 조립PC 견적 결과 페이지 · [🌐 보기](https://chaechaechae99.github.io/pc-dragonball/) | HTML |
| [fortune-service](./fortune-service) | 운세 사이트 '운결' 기획 · 개발 강의노트 | Next.js · TypeScript |
| [unkyeol](./unkyeol) | '운결' 웹 앱 소스 | Next.js 15 · Tailwind v4 |
| [fortune-service-site](./fortune-service-site) | '운결' 배포 사이트 · [🌐 보기](https://chaechaechae99.github.io/fortune-service-site/) | 정적 빌드 |

### 🐍 Python

| 프로젝트 | 설명 | 기술 |
|---|---|---|
| [airport-rookie](./airport-rookie) | 신입사원이 공항을 키워 회장이 되는 도트 경영 시뮬레이션 | Python · tkinter · Web |

### ⚡ 하드웨어 기초

| 프로젝트 | 설명 | 기술 |
|---|---|---|
| [electronics-basics](./electronics-basics) | 비전공자를 위한 전자전기 기초 10강 | 강의노트 · 슬라이드 |

---

## 📝 참고

- **공개 버전:** `fortune-service`와 `WebShopping`은 웹 크롤링 코드와 수집 데이터를 빼고 올렸습니다.
- **사용한 오픈소스와 라이선스**
  - MediaPipe 모델 (Apache 2.0)
  - Ultralytics YOLO (AGPL-3.0)
  - youtube-mcp (MIT)
  - 1909 라이더-웨이트 타로 이미지 (퍼블릭 도메인)
- 모든 프로젝트는 **공부용**이며 상업적 목적이 없습니다.
