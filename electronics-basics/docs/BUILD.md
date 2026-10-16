# 빌드 방법

비전공자용 10강 PPTX. 일러스트는 Google Flow, 움직이는 그래프는 manim, 고정 그래프는 matplotlib, 조립은 python-pptx.

## 폴더
| 폴더 | 내용 |
|---|---|
| `config/` | `course.yaml` 강의 목록, `theme.yaml` 색·폰트 (그림·영상·슬라이드 공유) |
| `content/Lxx_*/lecture.yaml` | 슬라이드 내용과 어떤 이미지/영상/차트를 쓸지 |
| `visuals/prompts/` | Flow 프롬프트 (`_style.yaml` 공통 스타일 + 강의별) |
| `visuals/candidates/Lxx/` | Flow에서 받은 후보 원본 |
| `visuals/images/Lxx/<id>.png` | 최종 선택본 — 빌드는 여기만 본다 |
| `visuals/refs/` | 마스코트 등 일관성용 참고 이미지 |
| `animations/Lxx/scene_<name>.py` | manim 장면 (`class Main(Scene)`) |
| `charts/` | matplotlib 고정 그래프 |
| `build/` | 빌드 스크립트 |
| `generated/` | 렌더 결과 (재생성 가능) |
| `output/` | 최종 pptx |

## 빌드
```bash
pip install -r requirements.txt
python build/render_animations.py L01          # --draft 로 저화질 빠른 확인
python build/build_deck.py L01                  # 인자 없으면 전체
python build/preview.py output/01강_전기란무엇인가.pptx   # 슬라이드 PNG + _sheet.png (LibreOffice 필요)
```
빠진 이미지·영상은 "대기 중" 자리표시로 들어가므로 언제든 빌드할 수 있다.

## lecture.yaml 레이아웃
`title` · `goals` · `big_figure` · `figure_text` · `video` · `quiz`(문제+정답 2장) · `summary`
- 이미지 위 글자는 `labels: [{text, x, y, color}]` (x, y는 원본 이미지 기준 0~1 비율)
- AI 이미지 안에는 글자를 넣지 않는다 → 라벨은 항상 PPT에서

## 주의
- Windows 스마트 앱 컨트롤 때문에 `manimpango==0.6.1` 고정. 새 패키지 import가 DLL 차단으로 실패하면 몇 번 재시도하면 통과하는 경우가 많다.
