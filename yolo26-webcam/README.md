# YOLO26 웹캠 실시간 비전 — 강의노트

> 작성일: 2026-10-07
> 주제: Ultralytics YOLO26으로 웹캠 영상에 **Object Detection → Instance Segmentation → Object Tracking** 적용하기

---

## 목차

1. [학습 목표](#1-학습-목표)
2. [개발 환경 구성](#2-개발-환경-구성)
3. [트러블슈팅: PyTorch DLL 로드 오류](#3-트러블슈팅-pytorch-dll-로드-오류)
4. [공통 구조: 웹캠 + YOLO 루프](#4-공통-구조-웹캠--yolo-루프)
5. [실습 1 — Object Detection](#5-실습-1--object-detection)
6. [실습 2 — Instance Segmentation](#6-실습-2--instance-segmentation)
7. [실습 3 — Object Tracking](#7-실습-3--object-tracking)
8. [세 작업 비교 정리](#8-세-작업-비교-정리)
9. [GitHub에 올리기](#9-github에-올리기)
10. [요약 & 다음 단계](#10-요약--다음-단계)

---

## 1. 학습 목표

- Ultralytics 라이브러리로 **YOLO26** 모델을 불러와 추론할 수 있다.
- OpenCV로 **웹캠 영상**을 프레임 단위로 읽어 모델에 넣고 결과를 화면에 띄울 수 있다.
- **Detection / Segmentation / Tracking**의 차이를 이해하고 각각 코드로 구현할 수 있다.
- 작업한 코드를 **git + GitHub CLI**로 저장소에 올릴 수 있다.

---

## 2. 개발 환경 구성

### 실습 환경

| 항목 | 버전 |
|---|---|
| OS | Windows 11 |
| Python | 3.14.8 |
| ultralytics | 8.4.174 |
| torch | 2.14.1 (CPU) |
| opencv-python | 5.0.0.93 |
| lap | 0.5.13 (tracking용) |

### 설치

```bash
pip install -r requirements.txt
# 또는
pip install -U ultralytics opencv-python lap
```

- `ultralytics`를 설치하면 **PyTorch(torch, torchvision)** 가 함께 설치된다.
- YOLO26은 최신 모델이므로 `-U` 옵션으로 **최신 버전**의 ultralytics를 받아야 한다.
- `lap`은 tracking에서 쓰는 선형 할당(linear assignment) 라이브러리다. 없으면 `model.track()`을 처음 실행할 때 ultralytics가 자동으로 설치한다.
  - 자동 설치 직후에는 `Restart runtime or rerun command` 경고가 나온다. 다음 실행부터는 나오지 않는다.

### 모델 파일

| 모델 | 용도 | 크기 |
|---|---|---|
| `yolo26n.pt` | Detection / Tracking | 5.3 MB |
| `yolo26n-seg.pt` | Segmentation | 6.4 MB |

- `YOLO("yolo26n.pt")`처럼 이름만 지정하면 **첫 실행 때 GitHub releases에서 자동으로 다운로드**한다.
- 크기 접미사: `n`(nano) < `s` < `m` < `l` < `x`. 뒤로 갈수록 **정확하지만 느리다**.
- 가중치 파일은 다시 받을 수 있으므로 `.gitignore`로 저장소에서 제외했다.

---

## 3. 트러블슈팅: PyTorch DLL 로드 오류

### 증상

```
Microsoft Visual C++ Redistributable is not installed, this may lead to the DLL load failure.
OSError: [WinError 126] 지정된 모듈을 찾을 수 없습니다.
Error loading "...\torch\lib\c10.dll" or one of its dependencies.
```

### 원인

- Windows용 PyTorch는 **Microsoft Visual C++ 재배포 패키지**(런타임 DLL)에 의존한다.
- pip은 Python 패키지만 설치한다. 이 시스템 런타임은 설치하지 않는다.
- 그래서 `pip install`은 성공해도 `import torch` 단계에서 실패한다.

### 해결

```powershell
winget install Microsoft.VCRedist.2015+.x64
```

또는 https://aka.ms/vs/17/release/vc_redist.x64.exe 를 직접 받아 설치한다.

> 💡 **교훈**: "pip 설치 성공 ≠ 실행 가능". 네이티브 라이브러리(DLL)를 쓰는 패키지는 OS 런타임이 필요할 수 있다.

---

## 4. 공통 구조: 웹캠 + YOLO 루프

세 스크립트는 모두 같은 뼈대를 쓴다. 바뀌는 부분은 **모델**과 **호출 함수**뿐이다.

```python
model = YOLO("yolo26n.pt")                       # ① 모델 로드

cap = cv2.VideoCapture(0, cv2.CAP_DSHOW)          # ② 웹캠 열기
while True:
    ok, frame = cap.read()                        # ③ 프레임 읽기
    results = model.predict(frame, conf=0.25)     # ④ 추론
    annotated = results[0].plot()                 # ⑤ 결과 시각화
    cv2.imshow("window", annotated)               # ⑥ 화면 출력
    if cv2.waitKey(1) & 0xFF in (ord("q"), 27):   # ⑦ q / ESC로 종료
        break
cap.release(); cv2.destroyAllWindows()            # ⑧ 자원 해제
```

### 핵심 포인트

| 코드 | 설명 |
|---|---|
| `cv2.CAP_DSHOW` | Windows의 DirectShow 백엔드를 쓴다. 기본 백엔드(MSMF)보다 웹캠이 **빨리 열린다**. 실패하면 기본 방식으로 다시 시도한다. |
| `cap.set(CAP_PROP_FRAME_WIDTH, 1280)` | 웹캠 해상도를 요청한다. 지원하지 않는 해상도면 가까운 값으로 맞춰진다. |
| `results[0]` | 입력이 이미지 1장이므로 결과 리스트의 첫 번째 원소를 쓴다. |
| `result.plot()` | 박스·라벨·마스크를 그린 **BGR numpy 배열**을 돌려준다. OpenCV로 바로 출력할 수 있다. |
| `cv2.waitKey(1)` | 1ms 동안 키 입력을 기다린다. 이 함수를 호출해야 창이 갱신된다. |
| `try / finally` | 오류가 나도 웹캠과 창을 반드시 해제한다. 해제하지 않으면 다음 실행 때 웹캠이 "사용 중" 상태가 될 수 있다. |
| FPS 계산 | `1 / (현재 시각 - 이전 프레임 시각)` |

### 명령줄 옵션 (argparse)

| 옵션 | 기본값 | 설명 |
|---|---|---|
| `--model` | 스크립트별 상이 | 사용할 모델 파일 |
| `--camera` | `0` | 웹캠 번호. 카메라가 여러 대면 `1`, `2` … |
| `--conf` | `0.25` | 이 값보다 신뢰도가 낮은 결과는 버린다 |
| `--imgsz` | `640` | 추론 입력 크기. 작게 하면 빠르지만 정확도가 떨어진다 |
| `--device` | 자동 | `cpu`, `0`(첫 번째 GPU) 등 |

---

## 5. 실습 1 — Object Detection

📄 `webcam_detect.py`

```bash
python webcam_detect.py
python webcam_detect.py --model yolo26s.pt --conf 0.4
```

### 개념

- **"무엇이 어디에 있는가"** 를 **사각형 박스(bounding box)** 와 **클래스 이름**, **신뢰도**로 나타낸다.
- COCO 데이터셋으로 학습된 **80개 클래스**(person, car, cell phone, cup …)를 인식한다.

### 핵심 코드

```python
results = model.predict(frame, conf=args.conf, imgsz=args.imgsz,
                        device=args.device, verbose=False)
result = results[0]
annotated = result.plot()
```

- `verbose=False`: 매 프레임마다 콘솔에 로그가 찍히지 않게 한다.

### 결과 데이터 꺼내기

```python
for box in result.boxes:
    cls_id = int(box.cls[0])              # 클래스 번호
    name = model.names[cls_id]            # 클래스 이름
    conf = float(box.conf[0])             # 신뢰도
    x1, y1, x2, y2 = box.xyxy[0].tolist() # 좌상단, 우하단 좌표
```

| 속성 | 형태 | 의미 |
|---|---|---|
| `boxes.xyxy` | (N, 4) | 좌상단 x, y / 우하단 x, y |
| `boxes.xywh` | (N, 4) | 중심 x, y / 너비, 높이 |
| `boxes.conf` | (N,) | 신뢰도 |
| `boxes.cls` | (N,) | 클래스 번호 |

---

## 6. 실습 2 — Instance Segmentation

📄 `webcam_segment.py`

```bash
python webcam_segment.py
python webcam_segment.py --model yolo26s-seg.pt
```

### 개념

- Detection의 박스에 더해, 객체의 **실제 윤곽 영역을 픽셀 단위 마스크**로 구한다.
- **Instance** segmentation이므로 같은 클래스라도 **객체마다 마스크가 따로** 나온다. 예를 들어 사람이 2명이면 마스크도 2개다.
- 모델 이름에 `-seg`가 붙은 **세그멘테이션 전용 가중치**를 써야 한다.

### Detection 코드와 달라진 점

```python
model = YOLO("yolo26n-seg.pt")                # ① 모델만 교체

results = model.predict(frame, ...,
                        retina_masks=True)    # ② 고해상도 마스크
num_objects = 0 if result.masks is None else len(result.masks)  # ③ None 처리
```

- **`retina_masks=True`**: 모델은 입력보다 작은 크기로 마스크를 만든다. 이 옵션을 켜면 마스크를 **원본 해상도로** 만들어 경계가 매끄러워진다. 대신 연산이 조금 늘어난다.
- **`result.masks`** 는 객체가 하나도 없으면 `None`이다. 바로 `len()`을 부르면 오류가 나므로 먼저 확인한다.

### 마스크 데이터 꺼내기

```python
if result.masks is not None:
    polygons = result.masks.xy     # 객체별 윤곽선 좌표 리스트, 각 (K, 2)
    masks = result.masks.data      # (N, H, W) 0/1 텐서
```

| 속성 | 용도 |
|---|---|
| `masks.xy` | 윤곽선 폴리곤(픽셀 좌표). 외곽선 그리기, 면적 계산에 쓴다 |
| `masks.data` | 이진 마스크. 배경 제거, 픽셀 합성에 쓴다 |

---

## 7. 실습 3 — Object Tracking

📄 `webcam_track.py`

```bash
python webcam_track.py
python webcam_track.py --tracker botsort.yaml
python webcam_track.py --model yolo26n-seg.pt   # 마스크까지 그리면서 추적
python webcam_track.py --trail 0                # 이동 경로 끄기
```

### 개념

- Detection은 프레임마다 **독립적으로** 결과를 낸다. 그래서 "이전 프레임의 사람"과 "지금 프레임의 사람"이 같은 사람인지 알 수 없다.
- Tracking은 프레임 사이에서 객체를 **연결(association)** 하고 같은 객체에 **같은 ID**를 계속 붙인다.
- 원리: 탐지 결과를 이전 트랙의 **예측 위치**(칼만 필터)와 비교해 짝을 맞춘다. 짝을 맞출 때 `lap` 라이브러리의 선형 할당을 쓴다.

### 핵심 코드

```python
results = model.track(frame, persist=True, tracker="bytetrack.yaml", ...)
```

- **`model.track()`**: `predict()` 대신 호출한다. 탐지와 추적을 함께 수행한다.
- **`persist=True`** ⭐: 이전 프레임의 트랙 정보를 **유지**한다. 이 옵션이 없으면 매 프레임 트래커가 초기화되어 ID가 계속 새로 붙는다.
- **`result.boxes.id`**: 트랙 ID 텐서. 추적 중인 객체가 없으면 `None`이다.

### 트래커 비교

| 트래커 | 특징 |
|---|---|
| `bytetrack.yaml` (기본) | 빠르다. 신뢰도가 낮은 탐지도 매칭에 활용한다 |
| `botsort.yaml` | 카메라 움직임 보정과 외형(Re-ID) 정보를 쓴다. 가려졌다 다시 나타난 객체의 ID를 더 잘 유지하지만 느리다 |

### 이동 경로(trail) 그리기

```python
trails = defaultdict(lambda: deque(maxlen=30))   # ID별 최근 30개 중심점

track_ids = result.boxes.id.int().tolist()
centers = result.boxes.xywh[:, :2].tolist()      # 박스 중심 (cx, cy)

for track_id, (cx, cy) in zip(track_ids, centers):
    trails[track_id].append((int(cx), int(cy)))
    # 연속된 점들을 선으로 연결해 경로를 그림
```

- **`deque(maxlen=N)`**: 길이가 N을 넘으면 오래된 점이 자동으로 빠진다. 꼬리 길이를 일정하게 유지할 수 있다.
- **`defaultdict`**: 처음 등장한 ID에 대해 자동으로 빈 deque를 만든다.
- 화면에서 사라진 ID의 경로는 `del trails[track_id]`로 정리한다. 정리하지 않으면 메모리에 계속 쌓인다.

---

## 8. 세 작업 비교 정리

| 구분 | Detection | Segmentation | Tracking |
|---|---|---|---|
| 질문 | 무엇이 어디에? | 정확히 어떤 픽셀이? | 아까 그 객체가 지금 어디에? |
| 출력 | 박스 + 클래스 | 박스 + 클래스 + **마스크** | 박스 + 클래스 + **ID** |
| 모델 | `yolo26n.pt` | `yolo26n-seg.pt` | `yolo26n.pt` (seg도 가능) |
| 호출 | `model.predict()` | `model.predict(retina_masks=True)` | `model.track(persist=True)` |
| 결과 속성 | `result.boxes` | `result.masks` | `result.boxes.id` |
| 추가 패키지 | — | — | `lap` |
| 활용 예 | 물체 개수 세기, 경보 | 배경 제거, 면적 측정 | 출입 인원 세기, 동선 분석 |

---

## 9. GitHub에 올리기

### 저장소 구성

```
yolo26-webcam/
├── .gitignore          # *.pt, __pycache__/, runs/ 등 제외
├── README.md           # 이 강의노트
├── requirements.txt    # ultralytics, opencv-python, lap
├── webcam_detect.py
├── webcam_segment.py
└── webcam_track.py
```

### 사용한 명령어

```bash
git init -b main                        # main 브랜치로 저장소 초기화
git add .                               # 변경사항 스테이징 (.gitignore 대상 제외)
git commit -m "Add YOLO26 webcam ..."   # 커밋
gh repo create yolo26-webcam --private --source . --push
#   └ GitHub CLI로 원격 저장소 생성 + origin 연결 + push를 한 번에
```

| 명령 | 역할 |
|---|---|
| `gh auth status` | GitHub CLI 로그인 상태 확인 |
| `gh repo create ... --source . --push` | 현재 폴더를 새 GitHub 저장소로 올린다 |
| `gh repo view` | 원격 저장소 정보(공개 여부, 마지막 push 시각) 확인 |

### 이후 수정사항 반영

```bash
git add .
git commit -m "변경 내용"
git push
```

> 💡 `.pt` 가중치는 실행 시 자동으로 다운로드되므로 저장소에 올리지 않는다. 큰 바이너리 파일을 git에 넣으면 저장소가 무거워진다.

---

## 10. 요약 & 다음 단계

### 오늘 배운 것

1. `pip install ultralytics`만으로 YOLO26을 쓸 수 있다. 단, Windows에서는 **VC++ 런타임**이 필요하다.
2. 웹캠 실시간 처리는 **읽기 → 추론 → 그리기 → 출력** 루프로 이루어진다.
3. 작업을 바꿀 때는 **모델 파일**(`-seg`)과 **호출 함수**(`predict` / `track`)만 바꾸면 된다.
4. Tracking의 핵심은 **`persist=True`** 다.

### 다음에 해볼 것

- [ ] `classes=[0]` 옵션으로 **사람만** 탐지·추적하기
- [ ] `cv2.VideoWriter`로 결과 영상을 **파일로 저장**하기
- [ ] 화면에 가상의 선을 긋고 **지나간 객체 수 세기** (tracking ID 활용)
- [ ] 세그멘테이션 마스크로 **배경 블러 / 배경 교체** 만들기
- [ ] GPU(`--device 0`)에서 `s` / `m` 모델의 FPS 비교하기
- [ ] 직접 모은 데이터로 **커스텀 학습**(`model.train()`) 해보기
