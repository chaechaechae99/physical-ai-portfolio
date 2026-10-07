"""
YOLO26 웹캠 실시간 Object Tracking

설치:
    pip install -U ultralytics opencv-python

실행:
    python webcam_track.py
    python webcam_track.py --model yolo26s.pt --tracker botsort.yaml --conf 0.4 --camera 0

종료: 영상 창에서 'q' 또는 ESC
"""

import argparse
import time
from collections import defaultdict, deque

import cv2
from ultralytics import YOLO


def parse_args():
    parser = argparse.ArgumentParser(description="YOLO26 webcam object tracking")
    parser.add_argument("--model", default="yolo26n.pt",
                        help="YOLO26 모델 (yolo26n/s/m/l/x.pt, -seg 모델도 가능), 없으면 자동 다운로드")
    parser.add_argument("--tracker", default="bytetrack.yaml",
                        help="트래커 설정 (bytetrack.yaml 또는 botsort.yaml)")
    parser.add_argument("--camera", type=int, default=0, help="웹캠 인덱스")
    parser.add_argument("--conf", type=float, default=0.25, help="confidence threshold")
    parser.add_argument("--imgsz", type=int, default=640, help="추론 이미지 크기")
    parser.add_argument("--device", default=None, help="'cpu', '0'(GPU) 등. 기본값은 자동 선택")
    parser.add_argument("--trail", type=int, default=30, help="이동 경로로 남길 프레임 수 (0이면 표시 안 함)")
    return parser.parse_args()


def main():
    args = parse_args()

    model = YOLO(args.model)

    # Windows에서는 CAP_DSHOW가 웹캠을 더 빠르게 연다
    cap = cv2.VideoCapture(args.camera, cv2.CAP_DSHOW)
    if not cap.isOpened():
        cap = cv2.VideoCapture(args.camera)
    if not cap.isOpened():
        raise RuntimeError(f"웹캠({args.camera})을 열 수 없습니다.")

    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)

    window = "YOLO26 Webcam Tracking"
    # 트랙 ID별 박스 중심점 이동 경로
    trails = defaultdict(lambda: deque(maxlen=max(args.trail, 1)))
    prev_time = time.time()

    try:
        while True:
            ok, frame = cap.read()
            if not ok:
                print("프레임을 읽지 못했습니다.")
                break

            # persist=True: 이전 프레임의 트랙 정보를 유지해 같은 객체에 같은 ID 부여
            results = model.track(
                frame,
                persist=True,
                tracker=args.tracker,
                conf=args.conf,
                imgsz=args.imgsz,
                device=args.device,
                verbose=False,
            )
            result = results[0]

            # 박스 + 라벨 + 트랙 ID가 그려진 프레임
            annotated = result.plot()

            num_tracks = 0
            if result.boxes.id is not None:
                track_ids = result.boxes.id.int().tolist()
                centers = result.boxes.xywh[:, :2].tolist()
                num_tracks = len(track_ids)

                for track_id, (cx, cy) in zip(track_ids, centers):
                    trail = trails[track_id]
                    trail.append((int(cx), int(cy)))
                    if args.trail > 0 and len(trail) > 1:
                        for p1, p2 in zip(trail, list(trail)[1:]):
                            cv2.line(annotated, p1, p2, (0, 255, 255), 2)

                # 화면에서 사라진 트랙의 경로는 정리
                for track_id in list(trails):
                    if track_id not in track_ids:
                        del trails[track_id]

            now = time.time()
            fps = 1.0 / max(now - prev_time, 1e-6)
            prev_time = now

            cv2.putText(annotated, f"FPS: {fps:.1f}  Tracks: {num_tracks}",
                        (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2)

            cv2.imshow(window, annotated)
            key = cv2.waitKey(1) & 0xFF
            if key in (ord("q"), 27):
                break
    finally:
        cap.release()
        cv2.destroyAllWindows()


if __name__ == "__main__":
    main()
