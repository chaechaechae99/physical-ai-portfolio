# MediaPipe Gesture Recognizer — 웹캠 실시간 손 제스처 인식

> 작업 기록 / 강의 노트 · 2026-10-07

웹캠 영상에서 손을 찾아 21개 관절 점(landmark)을 그리고, 어떤 제스처인지(👍, ✌️ 등) 실시간으로 표시하는 파이썬 프로그램.

- 참고 문서: [Gesture recognition task guide](https://developers.google.com/edge/mediapipe/solutions/vision/gesture_recognizer) · [Python 가이드](https://developers.google.com/edge/mediapipe/solutions/vision/gesture_recognizer/python)

---

## 1. 폴더 구조

```
Gesture Recognition/
├── gesture_webcam.py              # 실행 코드
├── models/
│   └── gesture_recognizer.task    # 학습된 모델 번들 (8.4MB)
└── README.md
```

## 2. 환경

| 항목 | 버전 |
|---|---|
| OS | Windows 11 Pro |
| Python | 3.14.8 |
| mediapipe | 1.1.0 |
| opencv-python | 5.0.0 |

## 3. 설치

### 3-1. 라이브러리

```bash
python -m pip install mediapipe opencv-python
```

- `mediapipe`: 제스처 인식 엔진 (Google)
- `opencv-python`: 웹캠 읽기, 화면 그리기

### 3-2. 모델 파일

MediaPipe는 라이브러리만으로는 동작하지 않고, **학습된 모델 파일(`.task`)** 이 따로 필요하다.

- 다운로드 위치: 공식 문서 Overview → *Models* 섹션 → `HandGestureClassifier` 의 **Latest** 링크
- 직접 URL:
  `https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/latest/gesture_recognizer.task`

```powershell
Invoke-WebRequest "<위 URL>" -OutFile "models\gesture_recognizer.task"
```

`.task` 파일 하나에 두 모델이 묶여 있다.
1. **Hand landmark 모델** — 손 위치와 21개 관절 좌표 검출
2. **Gesture classifier 모델** — 관절 좌표를 보고 제스처 분류

## 4. 실행

```bash
git clone https://github.com/chaechaechae99/gesture-recognition.git
cd gesture-recognition
pip install mediapipe opencv-python
python gesture_webcam.py
```

> 모델 파일(`models/gesture_recognizer.task`)은 저장소에 포함되어 있어 따로 받을 필요 없음.

- 종료: 창을 클릭한 뒤 `q` 또는 `ESC`
- 실행 시 터미널에 `WARNING`, `W0000 ...` 로그가 나오는데 MediaPipe의 정상 초기화 메시지이므로 무시해도 된다.

## 5. 인식 가능한 제스처 (기본 7종)

| 이름 | 의미 |
|---|---|
| `Closed_Fist` | ✊ 주먹 |
| `Open_Palm` | ✋ 손바닥 |
| `Pointing_Up` | ☝️ 검지 위로 |
| `Thumb_Down` | 👎 |
| `Thumb_Up` | 👍 |
| `Victory` | ✌️ |
| `ILoveYou` | 🤟 |
| `None` | 해당 없음 |

화면 표시 예: `Right: Thumb_Up (0.87)` → 오른손, 엄지척, 신뢰도 87%

---

## 6. 코드 설명

### 6-1. 실행 모드 (Running Mode)

MediaPipe에는 세 가지 모드가 있다.

| 모드 | 용도 | 호출 함수 | 특징 |
|---|---|---|---|
| `IMAGE` | 사진 한 장 | `recognize()` | 동기(결과를 바로 반환) |
| `VIDEO` | 동영상 파일 | `recognize_for_video()` | 동기 + 타임스탬프 필요 |
| `LIVE_STREAM` | **웹캠** | `recognize_async()` | **비동기**, 결과는 콜백으로 받음 |

웹캠이므로 `LIVE_STREAM` 사용. 이전 프레임을 처리 중이면 새 프레임은 버리기 때문에 화면이 밀리지 않는다.

### 6-2. 전체 흐름

```
웹캠 프레임(BGR)
  → 좌우 반전 (거울 모드)
  → BGR → RGB 변환
  → mp.Image 로 감싸기
  → recognize_async(image, timestamp_ms)   ← 비동기로 던짐
        └→ (별도 스레드) on_result 콜백 → latest_result 갱신
  → 최신 결과로 점·선·라벨 그리기
  → 화면 출력
```

### 6-3. 핵심 포인트

**① 옵션 설정**

```python
options = GestureRecognizerOptions(
    base_options=BaseOptions(model_asset_buffer=MODEL_PATH.read_bytes()),
    running_mode=VisionRunningMode.LIVE_STREAM,
    num_hands=2,                 # 최대 2손 인식 (기본값 1)
    result_callback=on_result,   # LIVE_STREAM 에서는 필수
)
```

**② 콜백과 스레드 안전**

콜백은 MediaPipe 내부 스레드에서 호출된다. 메인 루프와 같은 변수를 쓰므로 `threading.Lock` 으로 보호.

```python
def on_result(result, output_image, timestamp_ms):
    global latest_result
    with result_lock:
        latest_result = result
```

**③ 타임스탬프는 반드시 증가해야 함**

같은 값이나 이전 값이 들어오면 에러가 난다. `time.monotonic()` 기반 ms 값을 쓰고, 혹시 같으면 +1.

**④ OpenCV는 BGR, MediaPipe는 RGB**

```python
rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)
```

**⑤ 결과 객체 구조 (`GestureRecognizerResult`)**

손마다 하나씩 들어있는 리스트 4개:

| 필드 | 내용 |
|---|---|
| `handedness` | 왼손/오른손 + 점수 |
| `gestures` | 제스처 이름 + 점수 (점수 높은 순) |
| `hand_landmarks` | 21개 점, x·y는 0~1로 정규화된 이미지 좌표 |
| `hand_world_landmarks` | 21개 점, 손 중심 기준 실제 3D 좌표(m) |

정규화 좌표 → 픽셀 좌표: `int(lm.x * width)`, `int(lm.y * height)`

**⑥ 그리기**

mediapipe 1.x 에는 예전의 `mp.solutions.drawing_utils` 가 없어서, `HandLandmarksConnections.HAND_CONNECTIONS` (점 연결 정보)를 가져와 OpenCV로 직접 선과 원을 그렸다.

### 6-4. 손 관절 21개 번호

```
0 WRIST
1~4   엄지 (CMC, MCP, IP, TIP)
5~8   검지 (MCP, PIP, DIP, TIP)
9~12  중지
13~16 약지
17~20 새끼
```

---

## 7. 문제 해결 기록 (Troubleshooting)

### ❗ 한글 경로에서 모델 파일을 못 여는 문제

```
RuntimeError: Unable to open file at C:\Users\...\바탕 화면\Gesture Recognition\models\gesture_recognizer.task, errno=-1
```

- **원인**: 경로에 한글(`바탕 화면`)이 있으면 MediaPipe 내부 C++ 코드가 파일을 열지 못함
- **해결**: 경로 대신 파이썬에서 파일을 바이트로 읽어서 넘긴다

```python
# Before
BaseOptions(model_asset_path=str(MODEL_PATH))
# After
BaseOptions(model_asset_buffer=MODEL_PATH.read_bytes())
```

### ❗ Chrome 으로 모델 다운로드가 안 됨

- Claude in Chrome 으로 공식 페이지의 *Latest* 링크 클릭, URL 직접 열기 둘 다 시도했지만 `Downloads` 폴더에 파일이 생기지 않음 (다운로드 확인창 또는 차단 추정)
- 같은 공식 URL을 PowerShell `Invoke-WebRequest` 로 받아서 해결

### ❗ 웹캠이 안 열리거나 창이 바로 닫힘

- 다른 프로그램(Zoom, Teams, 카메라 앱 등)이 카메라를 쓰고 있지 않은지 확인
- 카메라가 여러 개면 코드 상단 `CAMERA_INDEX = 0` → `1` 로 변경
- Windows 에서는 `cv2.CAP_DSHOW` 백엔드를 써야 카메라가 빨리 열리는 경우가 많아 적용해 둠

---

## 8. 작업 진행 순서 요약

1. 공식 문서 확인 (Python 가이드, Overview의 Models 섹션)
2. `mediapipe`, `opencv-python` 설치 확인
3. 모델 `gesture_recognizer.task` 다운로드 → `models/`
4. mediapipe 1.1.0 API 확인 (`GestureRecognizer`, `HandLandmarksConnections` 존재 / `solutions` 없음)
5. `gesture_webcam.py` 작성 (LIVE_STREAM 모드)
6. 빈 이미지로 테스트 → 한글 경로 에러 발견 → `model_asset_buffer` 로 수정 → 통과
7. 웹캠 실행 → 창 정상 표시, 프레임 처리 확인

## 9. 다음에 해볼 것

- `num_hands`, `min_hand_detection_confidence` 등 옵션 바꿔 보기
- 특정 제스처가 나오면 동작 실행 (예: 👍 → 스크린샷, ✊ → 종료)
- [Model Maker](https://developers.google.com/edge/mediapipe/solutions/customization/gesture_recognizer) 로 나만의 제스처 학습 → `custom_gestures_classifier_options`
