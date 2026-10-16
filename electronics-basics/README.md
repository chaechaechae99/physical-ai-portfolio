# ⚡ 전자전기 기초 — 아무것도 몰라도 괜찮아요

전기·전자를 처음 배우는 **비전공자**를 위한 10강짜리 입문 강의입니다.
수식보다 **그림과 비유, 움직이는 애니메이션**으로 설명합니다.

<p align="center"><img src="visuals/images/L01/mascot.png" width="220" alt="전자 마스코트"></p>

## 강의 노트

| 강 | 주제 | 핵심 비유·그림 | 노트 |
|---|---|---|---|
| 01 | 전기란 무엇인가 | 원자와 전자, 정전기 풍선, 전자 흐름 애니메이션 | [📖 읽기](notes/01_전기란_무엇인가.md) |
| 02 | 전압·전류·저항 | 물탱크와 파이프 (애니메이션) | [📖 읽기](notes/02_전압_전류_저항.md) |
| 03 | 옴의 법칙과 전력 | V=IR 삼각형, 전기요금 계산 | [📖 읽기](notes/03_옴의_법칙과_전력.md) |
| 04 | 직렬과 병렬 | 한 줄 도로 vs 여러 갈래 도로 | [📖 읽기](notes/04_직렬과_병렬.md) |
| 05 | 직류와 교류 | 강물 vs 톱질, 충전기 속 변환 | [📖 읽기](notes/05_직류와_교류.md) |
| 06 | 전기와 자기 | 전자석, 발전기 | [📖 읽기](notes/06_전기와_자기.md) |
| 07 | 커패시터와 인덕터 | 물통(충·방전), 무거운 수레(관성) | [📖 읽기](notes/07_커패시터와_인덕터.md) |
| 08 | 반도체·다이오드·LED | 한쪽으로만 열리는 문 | [📖 읽기](notes/08_반도체_다이오드_LED.md) |
| 09 | 트랜지스터 | 수도꼭지 밸브 | [📖 읽기](notes/09_트랜지스터.md) |
| 10 | 디지털의 시작 | 2진수, AND·OR·NOT | [📖 읽기](notes/10_디지털의_시작.md) |

슬라이드(PPTX)는 [Releases](https://github.com/chaechaechae99/electronics-basics/releases)에서 받을 수 있습니다.

## 이렇게 만들었어요
- **일러스트** — Google Flow로 생성. 그림 안에는 글자를 넣지 않고, 라벨은 슬라이드에서 얹습니다.
- **애니메이션** — [manim](https://www.manim.community/)으로 만든 MP4 (노트에서는 GIF)
- **슬라이드** — `content/Lxx/lecture.yaml` 내용을 python-pptx로 자동 조립

직접 빌드하려면 [docs/BUILD.md](docs/BUILD.md)를 보세요.

## 폴더
```
notes/       강의 노트 (이 저장소의 본문)
content/     강의별 슬라이드 내용 (lecture.yaml)
visuals/     Flow 프롬프트와 선택된 일러스트
animations/  manim 장면 코드
build/       PPTX 빌드 스크립트
config/      강의 목록, 색·폰트 테마
```
