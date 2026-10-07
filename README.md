# 📝 강의노트: MediaPipe Hand Landmarker로 나만의 제스처 만들기

> 실습일: 2026-10-07
> 주제: MediaPipe Hand Landmarker로 웹캠 손 인식 → 나만의 제스처 학습 → 웹 이펙트로 배포
> 참고 문서: [Hand landmarks detection guide (Google AI Edge)](https://developers.google.com/edge/mediapipe/solutions/vision/hand_landmarker)

### 🌐 데모: https://chaechaechae99.github.io/hand-landmark/web/

| 제스처 | 화면 효과 |
| --- | --- |
| **L** | 💗 `LOVE` 로고가 두근두근 |
| **V** | ✌️ 브이 이모지가 쏟아짐 |
| **E** | 🌈 `EEEEEEEEE` 글자가 화면을 가득 채움 |
| **none** | "아무것도 없습니다." 표시 |

> 카메라 권한을 허용해야 동작합니다. 영상은 브라우저 안에서만 처리되고 서버로 전송되지 않습니다.

---

## 0. 전체 흐름

```
[Part 1] 손 인식 기초
  모델 다운로드 → 웹캠 실시간 손 랜드마크 (hand_webcam.py)

[Part 2] 나만의 제스처
  ① 데이터 수집 → ② 학습 → ③ 실시간 추론     (gesture_app.py, GUI)
                         ↓
  ④ 모델을 JSON으로 변환 → ⑤ 웹 버전 → ⑥ GitHub Pages 배포
```

| 단계 | 내용 | 결과 |
| --- | --- | --- |
| 1 | 공식 문서에서 모델(`hand_landmarker.task`) 다운로드 | ✅ 약 7.8MB |
| 2 | 웹캠 실시간 손 인식 (`hand_webcam.py`) | ✅ |
| 3 | 트러블슈팅: 한글 경로 오류, 화면 노이즈 | 🔧 해결 |
| 4 | 나만의 제스처 수집/학습/추론 (CLI → GUI) | ✅ L, V, E, none 4종 각 300개 |
| 5 | 학습 모델을 웹으로 옮겨 제스처별 이펙트 | ✅ |
| 6 | GitHub Pages 배포 | ✅ |

---

# Part 1. 손 인식 기초

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

## 2. 환경 준비

- Windows 11, Python 3.14
- mediapipe 1.1.0, OpenCV 5.0.0, scikit-learn 1.9.1

```bash
pip install mediapipe opencv-python scikit-learn pillow
```

모델은 공식 문서 **Models** 섹션의 `HandLandmarker (full)` 링크에서 받는다 (이 저장소에 포함됨):

```
https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/latest/hand_landmarker.task
```

## 3. 웹캠 손 인식 코드 (`hand_webcam.py`)

```
모델 로드 → 웹캠 열기 → [프레임 읽기 → 좌우반전 → BGR→RGB 변환
→ mp.Image 생성 → detect_for_video → 점/선 그리기 → 화면 출력] 반복 → q/ESC로 종료
```

```python
rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)          # OpenCV는 BGR, MediaPipe는 RGB
mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)
timestamp_ms = int((time.monotonic() - start) * 1000)  # 증가하는 타임스탬프
result = landmarker.detect_for_video(mp_image, timestamp_ms)

# 정규화 좌표(0~1) → 픽셀 좌표
pts = [(int(lm.x * w), int(lm.y * h)) for lm in landmarks]
```

```bash
python hand_webcam.py        # 기본 카메라 (0번)
python hand_webcam.py 1      # 카메라 번호 지정
```

## 4. 🔧 트러블슈팅

### 문제 1. 모델 파일을 못 엶 (한글 경로)

```
RuntimeError: Unable to open file at C:\Users\...\바탕 화면\프로젝트1\hand_landmarker.task, errno=-1
```

- **원인**: MediaPipe 내부(C++)가 한글 등 비 ASCII 문자가 들어간 경로를 열지 못함
  - 처음 테스트 때는 상대 경로라서 문제가 안 보였고, 절대 경로로 바꾸자 드러남
- **해결**: 파이썬으로 파일을 직접 읽어서 **바이트로 전달**

```python
with open(MODEL_PATH, "rb") as f:
    model_data = f.read()
base_options = mp_python.BaseOptions(model_asset_buffer=model_data)  # model_asset_path 대신
```

> 📌 교훈: Windows에서 C++ 기반 라이브러리를 쓸 땐 **경로에 한글을 피하거나**, 파일을 파이썬으로 읽어서 넘기자.

### 문제 2. 화면이 지지직거리고 사람이 안 나옴

- 연결된 카메라: `HP HD Camera`, `HP IR Camera` → 번호별로 프레임을 찍어 비교

  | 번호 | 결과 |
  | --- | --- |
  | 0 | HP HD Camera, 640x480 → **정상 영상** |
  | 1 | 가상 카메라, 검은 화면에 로딩 아이콘 |
  | 2 | 열리지 않음 |

- **원인**: 확실히 특정하지 못함 (재확인 때 0번은 정상). 의심: 첫 프레임 깨짐, 포맷 협상, **Zoom과 카메라 동시 사용**
- **조치**: 포맷(`YUY2`)·해상도(640x480) 명시, 처음 10프레임 버리기, 카메라 번호를 인자로 선택

> 📌 교훈: 노트북엔 IR/가상 카메라가 같이 잡혀서 **0번이 항상 원하는 카메라가 아닐 수 있다.** 화상회의 중이면 비디오를 끄고 실행하자.

### 참고
- `inference_feedback_manager`, `landmark_projection_calculator` 경고 로그는 무시해도 됨
- mediapipe 설치 시 `opencv-contrib-python`이 같이 깔림. `cv2` 오류가 나면 `pip uninstall opencv-python`

---

# Part 2. 나만의 제스처 학습하기

## 5. 아이디어: 랜드마크 + 작은 분류기

MediaPipe에도 Gesture Recognizer 재학습 도구(Model Maker)가 있지만 **TensorFlow가 필요하고 Python 3.14를 지원하지 않는다.**
그래서 이미 잘 동작하는 Hand Landmarker를 **특징 추출기**로 쓰고, 그 위에 작은 분류기를 직접 학습했다.

```
웹캠 프레임 ─▶ Hand Landmarker ─▶ 21점 × (x,y,z) = 63개 숫자 ─▶ 정규화 ─▶ MLP 분류기 ─▶ "L" / "V" / "E" / "none"
```

- 이미지가 아니라 **숫자 63개**만 학습하므로 제스처당 수백 개 샘플로 **몇 초 만에** 학습된다.

### 특징 정규화 (가장 중요!)

같은 손 모양이면 **위치·크기·왼오른손에 상관없이** 비슷한 숫자가 나오게 만든다. (`gesture_common.py`)

```python
pts = np.array([[lm.x, lm.y, lm.z] for lm in landmarks])
pts -= pts[0]                                      # 1) 손목을 원점으로 → 위치 무관
pts /= np.linalg.norm(pts[:, :2], axis=1).max()    # 2) 가장 먼 점까지 거리로 나눔 → 크기 무관
if handedness == "Left":
    pts[:, 0] *= -1                                # 3) 왼손은 x 뒤집기 → 양손 공통
features = pts.flatten()                           # 63차원
```

### 분류기

```python
make_pipeline(
    StandardScaler(),                                         # 특징별 평균0, 표준편차1
    MLPClassifier(hidden_layer_sizes=(128, 64), early_stopping=True),
)
```

- 입력 63 → 은닉 128 → 은닉 64 → 출력(클래스 수), 활성화 함수 ReLU, 출력 softmax
- 80% 학습 / 20% 테스트로 정확도와 **혼동 행렬**을 확인한 뒤, 전체 데이터로 다시 학습해서 저장

## 6. GUI 앱 (`gesture_app.py`)

처음엔 수집/학습/추론을 CLI 스크립트로 만들었는데 불편해서 **tkinter GUI** 하나로 합쳤다.

```bash
python gesture_app.py
```

| 영역 | 기능 |
| --- | --- |
| 왼쪽 | 웹캠 영상 + 손 랜드마크 + 인식 결과 |
| ① 데이터 수집 | 제스처 이름 입력 → **[● 녹화 시작]** 또는 **Space** → 3초 카운트다운 후 자동 녹화. 목록에서 제스처별 샘플 수 확인/삭제 |
| ② 학습 | **[학습 시작]** → 정확도·혼동 행렬 로그 → 끝나면 자동으로 추론 켜짐 |
| ③ 실시간 추론 | 손 위에 제스처 이름 + 신뢰도, 최소 신뢰도 슬라이더 |

### 수집 꿀팁
- 녹화 중 손 모양은 유지하고 **거리·각도·양손을 조금씩 바꿔가며** 찍기 → 인식이 훨씬 잘 됨
- `none`(아무 손 모양) 클래스를 꼭 만들기 → 엉뚱한 손 모양을 억지로 L/V/E로 맞추는 오인식이 줄어듦
- 헷갈리는 제스처는 혼동 행렬을 보고 그 제스처만 더 수집

### CLI 버전 (참고)

```bash
python collect_gesture.py L --count 300   # 수집 (SPACE 녹화)
python train_gesture.py                   # 학습
python infer_gesture.py --threshold 0.7   # 추론
```

### 구현 포인트
- 학습은 **별도 스레드**에서 실행하고 로그는 `queue`로 UI에 전달 → 학습 중에도 영상이 멈추지 않음
- 영상 루프는 `root.after()`로 주기적으로 호출 (tkinter는 메인 스레드에서만 UI 갱신 가능)
- 영상 위 글씨는 OpenCV `putText`라 한글이 안 나옴 → 제스처 이름은 영어로

---

# Part 3. 웹 버전 & 배포

## 7. 파이썬 모델을 웹으로 옮기기

브라우저에선 scikit-learn을 쓸 수 없으므로 **가중치를 JSON으로 내보내고, 같은 계산을 JS로 직접 구현**했다.

```bash
python export_web_model.py    # models/gesture_classifier.joblib → web/gesture_model.json
```

```js
// StandardScaler
let h = feat.map((v, i) => (v - model.mean[i]) / model.scale[i]);
// MLP: 마지막 층 전까지 ReLU
for (const layer of model.layers) h = relu(h · W + b);
// 마지막 층: softmax → 클래스별 확률
```

- 검증: 같은 입력에 대해 **파이썬 `predict_proba`와 JS 결과 차이가 1e-17** → 완전히 동일

### 학습 때와 입력 조건 맞추기 ⚠️

웹에서도 파이썬과 **똑같은 조건의 영상**을 넣어야 정확도가 유지된다.

| 조건 | 파이썬 (학습 때) | 웹 |
| --- | --- | --- |
| 좌우반전 | `cv2.flip(frame, 1)` 후 검출 | 캔버스에 반전해서 그린 뒤 검출 |
| 화면 비율 | 640x480 (4:3) | 카메라 영상을 **가운데 4:3으로 크롭** |
| 손 랜드마크 | mediapipe Python | `@mediapipe/tasks-vision` (JS, 같은 모델 파일) |

> 📌 랜드마크 x, y는 각각 가로/세로로 나눈 비율이라 **화면 비율이 바뀌면 손 모양 숫자가 달라진다.**
> 16:9 영상을 그대로 넣으면 학습 때와 다른 숫자가 나와서 인식이 떨어진다.

## 8. 제스처별 이펙트 (`web/index.html`)

| 제스처 | 이펙트 | 구현 |
| --- | --- | --- |
| **L** | 흰 카드에 분홍 `LOVE` 로고, 두근두근 | CSS `transform` 팝업 + `@keyframes beat` |
| **V** | 큰 ✌️ 흔들기 + 작은 ✌️가 아래서 계속 솟아오름 | 90ms마다 이모지 요소 생성, 애니메이션 끝나면 삭제 |
| **E** | 무지개색 `EEEE…` 줄이 좌우로 흐르고 가운데 네온 `EEEEEEEEE`가 떨림 | 줄마다 반대 방향 `translateX` 무한 스크롤 |
| **none** | 하단에 "아무것도 없습니다." | |

- **흔들림 방지**: 최근 6프레임 확률을 평균 내서 판단 → 이펙트가 깜빡이지 않음
- **민감도 슬라이더**: 최고 확률이 이 값보다 낮으면 `?` (이펙트 없음)
- 처음 L은 고딕체(Fraktur) `LOVE`였는데 **O가 D처럼 보여 "LDVE"로 읽혀서** 둥근 필기체(Pacifico)로 변경

### 로컬 실행

카메라(`getUserMedia`)는 `file://`에선 안 되고 **localhost 또는 https** 에서만 동작한다.

```bash
python -m http.server 8000
# 브라우저에서 http://localhost:8000/web/
```

## 9. GitHub Pages 배포

- 저장소 **Settings → Pages → Source: `main` 브랜치 `/ (root)`**
- GitHub Pages는 **https** 라서 카메라 권한이 정상 동작
- 루트 `index.html`은 `web/`으로 이동시키는 리다이렉트
- `web/index.html`은 모델 파일을 `../hand_landmarker.task`로 불러오므로 저장소 루트에 모델이 있어야 함
- 다시 학습했다면: `python export_web_model.py` → `web/gesture_model.json` 커밋 → 자동 재배포

---

## 10. 다음에 해볼 것

- [ ] 양손 제스처 (두 손 랜드마크를 합쳐 126차원)
- [ ] 정지 자세가 아닌 **움직임 제스처** (최근 N프레임을 묶어 시퀀스로 학습)
- [ ] 웹에서 바로 수집·학습까지 (TensorFlow.js)
- [ ] 이펙트에 사운드 추가

---

## 파일 구성

```
.
├── hand_landmarker.task     # MediaPipe 손 랜드마크 모델 (float16)
├── hand_webcam.py           # [Part 1] 웹캠 손 인식
├── gesture_common.py        # [Part 2] 공통: 모델/카메라/특징 정규화/그리기
├── gesture_app.py           # [Part 2] GUI: 수집 → 학습 → 추론
├── collect_gesture.py       # [Part 2] CLI 수집
├── train_gesture.py         # [Part 2] 학습 (GUI도 이 함수 사용)
├── infer_gesture.py         # [Part 2] CLI 추론
├── export_web_model.py      # [Part 3] 학습 모델 → web/gesture_model.json
├── index.html               # GitHub Pages 루트 → web/ 리다이렉트
└── web/
    ├── index.html           # [Part 3] 제스처 이펙트 웹앱
    └── gesture_model.json   # 웹용 분류기 가중치
```

> `data/`(수집한 랜드마크 CSV)와 `models/`(로컬 학습 모델)는 `.gitignore`로 제외했다.
> 직접 해보려면 `gesture_app.py`로 수집·학습 후 `export_web_model.py`를 실행하면 된다.
