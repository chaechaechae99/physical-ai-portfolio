# MediaPipe Face Landmarker — 웹캠 실시간 얼굴 랜드마크

> 작성일: 2026-10-07
> 참고 문서: [Face landmark detection guide (Google AI Edge)](https://developers.google.com/edge/mediapipe/solutions/vision/face_landmarker)

---

## 1. 개요

MediaPipe **Face Landmarker**는 이미지나 영상에서 얼굴을 찾고 다음 세 가지를 출력합니다.

| 출력 | 설명 |
|---|---|
| **Face landmarks** | 얼굴 하나당 3D 좌표 **478개** (x, y는 0~1로 정규화, z는 깊이) |
| **Face blendshapes** | 표정 계수 **52개** (`eyeBlinkLeft`, `jawOpen`, `mouthSmileLeft` 등, 0~1 점수) |
| **Facial transformation matrix** | 얼굴의 3D 회전·이동 행렬 (AR 효과용) |

### 모델 번들 구성 (`face_landmarker.task`)

`.task` 파일 하나 안에 모델 세 개가 들어 있는 파이프라인입니다.

1. **Face detector** (입력 192×192): 얼굴 위치 검출
2. **Face mesh V2** (입력 256×256): 478개 랜드마크 추정
3. **Blendshape** (입력 1×146×2): 랜드마크 → 52개 표정 계수

- 데이터 타입: float16
- 크기: 약 3.7MB
- 다운로드 링크: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/latest/face_landmarker.task`

---

## 2. 환경

| 항목 | 버전 |
|---|---|
| OS | Windows 11 |
| Python | 3.14.8 |
| mediapipe | 1.1.0 |
| opencv-python | 5.0.0.93 |

설치:

```bash
pip install mediapipe opencv-python
```

### 폴더 구조

```
Face landmark/
├── face_landmarker.task      # 모델 파일
├── face_landmark_webcam.py   # 웹캠 실행 코드
└── README.md                 # 이 문서
```

---

## 3. 실행 방법

```bash
python face_landmark_webcam.py
```

- 종료: `q` 또는 `ESC`
- 화면 표시:
  - 얼굴 메쉬(회색), 윤곽(흰색), 입술(분홍), 왼눈·왼눈썹(초록), 오른눈·오른눈썹(빨강), 홍채(하늘색)
  - 왼쪽 위: FPS, 인식된 얼굴 수, blendshape 상위 5개 막대그래프

설정값 (파일 위쪽):

```python
CAMERA_INDEX = 0   # 웹캠 번호 (안 열리면 1, 2 ...)
NUM_FACES = 2      # 최대 인식 얼굴 수
```

---

## 4. 코드 설명

### 4-1. Running mode

MediaPipe Tasks는 실행 모드가 세 가지입니다.

| 모드 | 호출 함수 | 용도 |
|---|---|---|
| `IMAGE` | `detect(image)` | 단일 이미지 |
| `VIDEO` | `detect_for_video(image, timestamp_ms)` | 영상 프레임, 동기 처리 |
| `LIVE_STREAM` | `detect_async(image, timestamp_ms)` + 콜백 | 실시간, 비동기 처리 |

이 코드는 **`VIDEO` 모드**를 씁니다. 결과를 바로 받아서 그리면 되니까 구조가 단순합니다.
`VIDEO` 모드에서는 **timestamp가 계속 증가**해야 하므로 `time.monotonic()`으로 ms를 계산합니다.

### 4-2. 옵션 설정

```python
options = vision.FaceLandmarkerOptions(
    base_options=mp_python.BaseOptions(model_asset_buffer=MODEL_PATH.read_bytes()),
    running_mode=vision.RunningMode.VIDEO,
    num_faces=2,
    output_face_blendshapes=True,
    output_facial_transformation_matrixes=False,
)
```

그 밖의 옵션: `min_face_detection_confidence`, `min_face_presence_confidence`, `min_tracking_confidence` (기본값 0.5)

### 4-3. 프레임 처리 흐름

```
cv2.VideoCapture → frame(BGR)
   → cv2.flip (거울 모드)
   → BGR→RGB 변환
   → mp.Image(SRGB)
   → landmarker.detect_for_video(...)
   → result.face_landmarks / result.face_blendshapes
   → OpenCV로 그리기 → imshow
```

> OpenCV는 **BGR**, MediaPipe는 **RGB**를 씁니다. 변환을 빼먹으면 인식률이 떨어집니다.

### 4-4. 랜드마크 그리기

랜드마크 좌표는 0~1로 정규화되어 있으므로 픽셀로 바꿔야 합니다.

```python
pts = [(int(lm.x * w), int(lm.y * h)) for lm in face]
```

연결선 정보는 `vision.FaceLandmarksConnections`에 들어 있습니다.
각 원소는 `Connection(start, end)` 형태이고, 두 점을 선으로 이으면 됩니다.

| 상수 | 부위 |
|---|---|
| `FACE_LANDMARKS_TESSELATION` | 전체 메쉬 |
| `FACE_LANDMARKS_FACE_OVAL` | 얼굴 윤곽 |
| `FACE_LANDMARKS_LIPS` | 입술 |
| `FACE_LANDMARKS_LEFT_EYE` / `RIGHT_EYE` | 눈 |
| `FACE_LANDMARKS_LEFT_EYEBROW` / `RIGHT_EYEBROW` | 눈썹 |
| `FACE_LANDMARKS_LEFT_IRIS` / `RIGHT_IRIS` | 홍채 |

### 4-5. Blendshape

`result.face_blendshapes[0]`은 52개 `Category`(`category_name`, `score`)의 리스트입니다.
점수 순으로 정렬해서 상위 5개를 막대로 표시합니다. 눈 깜빡임, 입 벌림, 미소 등을 숫자로 확인할 수 있습니다.

---

## 5. 트러블슈팅 기록

### ① 한글 경로에서 모델 파일을 못 엶

```
RuntimeError: Unable to open file at C:\Users\...\바탕 화면\Face landmark\face_landmarker.task, errno=-1
```

- **원인**: MediaPipe 내부 C 라이브러리가 경로의 한글(non-ASCII)을 처리하지 못함
- **해결**: 경로(`model_asset_path`) 대신 파일을 바이트로 읽어 넘김(`model_asset_buffer`)

```python
BaseOptions(model_asset_buffer=MODEL_PATH.read_bytes())
```

### ② `mp.solutions`가 없음

- mediapipe 1.x에서는 예전 Solutions API(`mp.solutions.drawing_utils`, `mp.solutions.face_mesh`)가 **제거됨**
- **해결**: Tasks API(`mediapipe.tasks.python.vision`)만 사용하고, 그리기는 OpenCV `cv2.line`으로 직접 구현

### ③ 웹캠이 안 열리거나 화면이 검게 나옴

- `CAMERA_INDEX`를 `1`, `2`로 바꿔보기
- 다른 프로그램(Zoom, Teams 등)이 카메라를 쓰고 있는지 확인
- Windows에서는 `cv2.CAP_DSHOW` 백엔드를 쓰면 여는 속도가 빠름

### 참고: 실행 시 나오는 경고 로그

```
W0000 ... Sets FaceBlendshapesGraph acceleration to xnnpack by default.
W0000 ... Feedback manager requires a model with a single signature inference...
```

정상 동작 로그이므로 무시해도 됩니다.

---

## 6. 작업 기록

| 날짜 | 내용 |
|---|---|
| 2026-10-07 | 공식 가이드 페이지에서 `face_landmarker.task`(float16) 다운로드 |
| 2026-10-07 | `face_landmark_webcam.py` 작성 (VIDEO 모드, 메쉬·눈·입술·홍채 그리기, blendshape 표시) |
| 2026-10-07 | 한글 경로 문제를 `model_asset_buffer`로 해결 |
| 2026-10-07 | 웹캠 실행 확인 (창 정상 표시) |

---

## 7. 더 해볼 것

- `LIVE_STREAM` 모드(`detect_async`)로 바꿔서 FPS 비교
- blendshape로 눈 깜빡임 횟수 세기 (`eyeBlinkLeft/Right` > 0.5)
- `output_facial_transformation_matrixes=True`로 머리 회전 각도(yaw/pitch/roll) 계산
- 랜드마크 좌표를 CSV로 저장해서 분석
