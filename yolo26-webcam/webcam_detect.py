"""
YOLO26 웹캠 실시간 Object Detection

설치:
    pip install -U ultralytics opencv-python

실행:
    python webcam_detect.py
    python webcam_detect.py --model yolo26s.pt --conf 0.4 --camera 0

종료: 영상 창에서 'q' 또는 ESC
"""

import argparse
import time

import cv2
from ultralytics import YOLO


def parse_args():
    parser = argparse.ArgumentParser(description="YOLO26 webcam object detection")
    parser.add_argument("--model", default="yolo26n.pt",
                        help="YOLO26 모델 (yolo26n/s/m/l/x.pt), 없으면 자동 다운로드")
    parser.add_argument("--camera", type=int, default=0, help="웹캠 인덱스")
    parser.add_argument("--conf", type=float, default=0.25, help="confidence threshold")
    parser.add_argument("--imgsz", type=int, default=640, help="추론 이미지 크기")
    parser.add_argument("--device", default=None, help="'cpu', '0'(GPU) 등. 기본값은 자동 선택")
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

    window = "YOLO26 Webcam Detection"
    prev_time = time.time()

    try:
        while True:
            ok, frame = cap.read()
            if not ok:
                print("프레임을 읽지 못했습니다.")
                break

            results = model.predict(
                frame,
                conf=args.conf,
                imgsz=args.imgsz,
                device=args.device,
                verbose=False,
            )
            result = results[0]

            # 박스/라벨이 그려진 프레임
            annotated = result.plot()

            # 탐지 결과 콘솔 출력이 필요하면 아래 사용
            # for box in result.boxes:
            #     cls_id = int(box.cls[0])
            #     x1, y1, x2, y2 = box.xyxy[0].tolist()
            #     print(model.names[cls_id], float(box.conf[0]), (x1, y1, x2, y2))

            now = time.time()
            fps = 1.0 / max(now - prev_time, 1e-6)
            prev_time = now

            cv2.putText(annotated, f"FPS: {fps:.1f}  Objects: {len(result.boxes)}",
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
