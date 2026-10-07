# 📝 강의노트: MediaPipe Hand Landmarker로 웹캠 손 인식하기

> 실습일: 2026-10-07
> 주제: Google MediaPipe Hand Landmarker 모델을 받아 Python + 웹캠으로 손 랜드마크를 실시간 검출
> 참고 문서: [Hand landmarks detection guide (Google AI Edge)](https://developers.google.com/edge/mediapipe/solutions/vision/hand_landmarker)

---

## 0. 오늘 한 일 요약

| 단계 | 내용 | 결과 |
| --- | --- | --- |
| 1 | 공식 문서에서 모델(`hand_landmarker.task`) 다운로드 | ✅ 약 7.8MB |
| 2 | `mediapipe` 라이브러리 설치 | ✅ mediapipe 1.1.0 |
| 3 | 웹캠 실시간 손 인식 코드 작성 (`hand_webcam.py`) | ✅ |
| 4 | 실행 → **한글 경로 오류** 발생 | 🔧 해결 |
| 5 | 실행 → **화면 노이즈(지지직)** 발생 | 🔧 카메라 설정 보강 |

---

## 1. 개념 정리: Hand Landmarker란?

- 이미지/영상에서 **손을 찾고**, 손마다 **21개 관절 위치(랜드마크)** 를 알려주는 모델
- 내부적으로 2개의 모델이 묶여 있음 (model bundle)
  1. **Palm detection model**: 이미지에서 손바닥 위치를 찾음
  2. **Hand landmarks detection model**: 찾은 손 영역에서 21개 점의 좌표를 예측
- 출력값
  - `hand_landmarks`: 각 점의 `x`, `y` (0~1로 정규화된 이미지 좌표), `z` (깊이)
  - `hand_world_landmarks`: 실제 3D 좌표 (미터 단위)
  - `handedness`: 왼손/오른손 구분 + 신뢰도

### 21개 랜드마크 번호

```
0      WRIST (손목)
1~4    THUMB  엄지   (CMC, MCP, IP, TIP)
5~8    INDEX  검지   (MCP, PIP, DIP, TIP)
9~12   MIDDLE 중지   (MCP, PIP, DIP, TIP)
13~16  RING   약지   (MCP, PIP, DIP, TIP)
17~20  PINKY  새끼   (MCP, PIP, DIP, TIP)
```

> 💡 TIP(손가락 끝) 번호인 **4, 8, 12, 16, 20** 을 기억해두면 제스처 판별(예: 손가락 몇 개 폈는지)에 바로 쓸 수 있다.

### 실행 모드 (Running mode)

| 모드 | 용도 | 호출 함수 |
| --- | --- | --- |
| `IMAGE` | 사진 한 장 | `detect()` |
| `VIDEO` | 동영상/웹캠 프레임을 순서대로 | `detect_for_video(image, timestamp_ms)` |
| `LIVE_STREAM` | 실시간 비동기 처리 (콜백) | `detect_async()` + `result_callback` |

→ 이번 실습은 코드가 단순한 **`VIDEO` 모드**를 사용. 타임스탬프(ms)는 반드시 **계속 증가**해야 한다.

### 주요 옵션

| 옵션 | 의미 | 사용값 |
| --- | --- | --- |
| `num_hands` | 최대 검출 손 개수 | 2 |
| `min_hand_detection_confidence` | 손바닥 검출 최소 신뢰도 | 0.5 |
| `min_hand_presence_confidence` | 손이 있다고 판단할 최소 점수 | 0.5 |
| `min_tracking_confidence` | 추적 유지 최소 신뢰도 | 0.5 |

---

## 2. 환경 준비

### 실습 환경
- Windows 11, Python 3.14
- mediapipe 1.1.0, OpenCV 5.0.0

### 라이브러리 설치

```bash
pip install mediapipe opencv-python
```

### 모델 다운로드

공식 문서 **Models** 섹션의 `HandLandmarker (full)` 링크 (float16):

```
https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/latest/hand_landmarker.task
```

→ 받은 `hand_landmarker.task` 파일을 `hand_webcam.py`와 **같은 폴더**에 둔다.

---

## 3. 코드 흐름 (`hand_webcam.py`)

```
모델 로드 → 웹캠 열기 → [프레임 읽기 → 좌우반전 → BGR→RGB 변환
→ mp.Image 생성 → detect_for_video → 점/선 그리기 → 화면 출력] 반복 → q/ESC로 종료
```

### 핵심 코드

**① 모델 옵션 설정 & 생성**

```python
options = vision.HandLandmarkerOptions(
    base_options=mp_python.BaseOptions(model_asset_buffer=model_data),
    running_mode=vision.RunningMode.VIDEO,
    num_hands=2,
)
with vision.HandLandmarker.create_from_options(options) as landmarker:
    ...
```

**② 프레임마다 검출**

```python
rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)          # OpenCV는 BGR, MediaPipe는 RGB
mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)
timestamp_ms = int((time.monotonic() - start) * 1000)  # 증가하는 타임스탬프
result = landmarker.detect_for_video(mp_image, timestamp_ms)
```

**③ 정규화 좌표 → 픽셀 좌표로 바꿔 그리기**

```python
h, w = frame.shape[:2]
pts = [(int(lm.x * w), int(lm.y * h)) for lm in landmarks]
for a, b in HAND_CONNECTIONS:
    cv2.line(frame, pts[a], pts[b], (0, 255, 0), 2)
```

### 화면에 표시되는 것
- 손 21개 점(빨강) + 연결선(초록)
- 왼손/오른손 라벨 + 신뢰도
- 좌상단 FPS

---

## 4. 실행 방법

```bash
python hand_webcam.py        # 기본 카메라 (0번)
python hand_webcam.py 1      # 카메라 번호 지정
```

종료: 창 클릭 후 `q` 또는 `ESC`

---

## 5. 🔧 트러블슈팅 기록

### 문제 1. 모델 파일을 못 엶 (한글 경로)

```
RuntimeError: Unable to open file at C:\Users\...\바탕 화면\프로젝트1\hand_landmarker.task, errno=-1
```

- **원인**: MediaPipe 내부(C++)가 한글 등 비 ASCII 문자가 들어간 경로를 제대로 열지 못함
  - 처음 테스트 때는 상대 경로(`hand_landmarker.task`)라서 문제가 안 보였고, 절대 경로로 바꾸자 드러남
- **해결**: 파이썬으로 파일을 직접 읽어서 **바이트로 전달** (`model_asset_path` → `model_asset_buffer`)

```python
with open(MODEL_PATH, "rb") as f:
    model_data = f.read()
base_options = mp_python.BaseOptions(model_asset_buffer=model_data)
```

> 📌 교훈: Windows에서 MediaPipe/OpenCV 등 C++ 기반 라이브러리를 쓸 땐 **경로에 한글을 피하거나**, 파일을 파이썬으로 읽어서 넘기자.

### 문제 2. 화면이 지지직거리고 사람이 안 나옴

- **확인한 것**
  - 연결된 카메라 장치: `HP HD Camera`, `HP IR Camera`
  - 카메라 번호별로 프레임을 하나씩 찍어서 비교

    | 번호 | 결과 |
    | --- | --- |
    | 0 | HP HD Camera, 640x480 → **정상 영상** |
    | 1 | 가상 카메라, 검은 화면에 로딩 아이콘 |
    | 2 | 열리지 않음 |

- **원인**: 확실히 특정하지 못함 (재확인 때 0번은 정상이었음)
  - 의심: 처음 몇 프레임 깨짐, 포맷 협상 문제, **Zoom 등 다른 프로그램과 카메라 동시 사용**
- **조치**
  - 카메라 포맷(`YUY2`)과 해상도(640x480) 명시
  - 처음 10프레임 버리기 (워밍업)
  - 실행 인자로 카메라 번호 선택 가능하게 변경

```python
cap = cv2.VideoCapture(cam_index, cv2.CAP_DSHOW)
cap.set(cv2.CAP_PROP_FOURCC, cv2.VideoWriter_fourcc(*"YUY2"))
cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
for _ in range(10):
    cap.read()
```

> 📌 교훈: 노트북엔 IR 카메라, 가상 카메라 등이 같이 잡혀서 **0번이 항상 원하는 카메라가 아닐 수 있다.** 번호별로 찍어보고 확인하자. 화상회의 중이면 비디오를 끄고 실행하자.

### 참고: 무시해도 되는 로그

```
W0000 ... inference_feedback_manager.cc:121] Feedback manager requires a model with a single signature inference...
W0000 ... landmark_projection_calculator.cc:81] Using NORM_RECT without IMAGE_DIMENSIONS...
```

→ 경고일 뿐 동작에는 문제 없음.

### 참고: OpenCV 패키지 중복

mediapipe 설치 시 `opencv-contrib-python`이 같이 설치되어 `opencv-python`과 공존하게 됨. `cv2` import 오류가 나면 둘 중 하나를 제거:

```bash
pip uninstall opencv-python
```

---

## 6. 다음에 해볼 것

- [ ] 손가락 끝(4, 8, 12, 16, 20) 좌표로 **펼친 손가락 개수 세기**
- [ ] 엄지-검지 거리로 **핀치 제스처** 인식
- [ ] `LIVE_STREAM` 모드(비동기 콜백)로 바꿔서 FPS 비교
- [ ] Gesture Recognizer와 결과 비교

---

## 파일 구성

```
.
├── hand_webcam.py         # 웹캠 실시간 손 인식 코드
├── hand_landmarker.task   # Hand Landmarker 모델 (float16)
└── README.md              # 강의노트 (이 문서)
```
