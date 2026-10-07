# YOLO26 Webcam

[Ultralytics YOLO26](https://docs.ultralytics.com/) 모델로 웹캠 영상을 실시간 처리하는 Python 예제 모음입니다.

| 스크립트 | 작업 | 기본 모델 |
|---|---|---|
| `webcam_detect.py` | Object Detection (박스 + 라벨) | `yolo26n.pt` |
| `webcam_segment.py` | Instance Segmentation (마스크 + 박스 + 라벨) | `yolo26n-seg.pt` |
| `webcam_track.py` | Object Tracking (트랙 ID + 이동 경로) | `yolo26n.pt` |

모델 파일(`.pt`)은 처음 실행할 때 자동으로 다운로드됩니다.

## 설치

```bash
pip install -r requirements.txt
```

> Windows에서 `c10.dll` 로드 오류(`WinError 126`)가 나면 [Microsoft Visual C++ 재배포 패키지](https://aka.ms/vs/17/release/vc_redist.x64.exe)를 설치하세요.
> `winget install Microsoft.VCRedist.2015+.x64`

## 실행

```bash
python webcam_detect.py
python webcam_segment.py
python webcam_track.py
```

영상 창에서 `q` 또는 `ESC`를 누르면 종료됩니다.

### 공통 옵션

| 옵션 | 기본값 | 설명 |
|---|---|---|
| `--model` | 스크립트별 상이 | 모델 크기 변경 (`n` / `s` / `m` / `l` / `x`) |
| `--camera` | `0` | 웹캠 인덱스 |
| `--conf` | `0.25` | confidence threshold |
| `--imgsz` | `640` | 추론 이미지 크기 |
| `--device` | 자동 | `cpu`, `0`(GPU) 등 |

### Tracking 전용 옵션

| 옵션 | 기본값 | 설명 |
|---|---|---|
| `--tracker` | `bytetrack.yaml` | `bytetrack.yaml`(빠름) 또는 `botsort.yaml`(가림에 강함) |
| `--trail` | `30` | 이동 경로로 남길 프레임 수 (`0`이면 끔) |

### 예시

```bash
python webcam_detect.py --model yolo26s.pt --conf 0.4
python webcam_segment.py --model yolo26m-seg.pt --device 0
python webcam_track.py --tracker botsort.yaml --model yolo26n-seg.pt
```
