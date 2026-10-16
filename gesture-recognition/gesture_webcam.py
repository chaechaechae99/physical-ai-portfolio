"""MediaPipe Gesture Recognizer - 웹캠 실시간 제스처 인식 (LIVE_STREAM 모드)

실행: python gesture_webcam.py
종료: q 또는 ESC
"""
import threading
import time
from pathlib import Path

import cv2
import mediapipe as mp

MODEL_PATH = Path(__file__).parent / "models" / "gesture_recognizer.task"
CAMERA_INDEX = 0
NUM_HANDS = 2

BaseOptions = mp.tasks.BaseOptions
GestureRecognizer = mp.tasks.vision.GestureRecognizer
GestureRecognizerOptions = mp.tasks.vision.GestureRecognizerOptions
GestureRecognizerResult = mp.tasks.vision.GestureRecognizerResult
VisionRunningMode = mp.tasks.vision.RunningMode
HAND_CONNECTIONS = mp.tasks.vision.HandLandmarksConnections.HAND_CONNECTIONS

# 콜백(별도 스레드)에서 받은 최신 결과를 메인 루프와 공유
latest_result = None
result_lock = threading.Lock()


def on_result(result: GestureRecognizerResult, output_image: mp.Image, timestamp_ms: int):
    global latest_result
    with result_lock:
        latest_result = result


def draw_result(frame, result):
    h, w = frame.shape[:2]
    for i, landmarks in enumerate(result.hand_landmarks):
        points = [(int(lm.x * w), int(lm.y * h)) for lm in landmarks]

        for conn in HAND_CONNECTIONS:
            cv2.line(frame, points[conn.start], points[conn.end], (0, 255, 0), 2)
        for p in points:
            cv2.circle(frame, p, 4, (0, 0, 255), -1)

        handedness = result.handedness[i][0].category_name if result.handedness else ""
        if result.gestures and result.gestures[i]:
            g = result.gestures[i][0]
            label = f"{handedness}: {g.category_name} ({g.score:.2f})"
        else:
            label = handedness

        x = min(p[0] for p in points)
        y = max(min(p[1] for p in points) - 10, 20)
        cv2.putText(frame, label, (x, y), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 4)
        cv2.putText(frame, label, (x, y), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 0, 0), 2)


def main():
    if not MODEL_PATH.exists():
        raise FileNotFoundError(f"모델 파일이 없습니다: {MODEL_PATH}")

    options = GestureRecognizerOptions(
        # 경로에 한글이 있으면 C++ 쪽에서 파일을 못 열어서 바이트로 직접 전달
        base_options=BaseOptions(model_asset_buffer=MODEL_PATH.read_bytes()),
        running_mode=VisionRunningMode.LIVE_STREAM,
        num_hands=NUM_HANDS,
        result_callback=on_result,
    )

    cap = cv2.VideoCapture(CAMERA_INDEX, cv2.CAP_DSHOW)
    if not cap.isOpened():
        raise RuntimeError(f"웹캠을 열 수 없습니다 (index={CAMERA_INDEX})")

    with GestureRecognizer.create_from_options(options) as recognizer:
        start = time.monotonic()
        last_ts = -1
        prev_time = time.monotonic()

        while True:
            ok, frame = cap.read()
            if not ok:
                break
            frame = cv2.flip(frame, 1)  # 거울 모드

            rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)

            # 타임스탬프는 단조 증가해야 함
            ts = int((time.monotonic() - start) * 1000)
            if ts <= last_ts:
                ts = last_ts + 1
            last_ts = ts
            recognizer.recognize_async(mp_image, ts)

            with result_lock:
                result = latest_result
            if result is not None:
                draw_result(frame, result)

            now = time.monotonic()
            fps = 1.0 / max(now - prev_time, 1e-6)
            prev_time = now
            cv2.putText(frame, f"FPS: {fps:.1f}", (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 255), 2)

            cv2.imshow("MediaPipe Gesture Recognizer", frame)
            if cv2.waitKey(1) & 0xFF in (ord("q"), 27):
                break

    cap.release()
    cv2.destroyAllWindows()


if __name__ == "__main__":
    main()
