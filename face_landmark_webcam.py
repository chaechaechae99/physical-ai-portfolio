"""MediaPipe Face Landmarker - 웹캠 실시간 얼굴 랜드마크 검출

실행: python face_landmark_webcam.py
종료: q 또는 ESC
"""
import time
from pathlib import Path

import cv2
import mediapipe as mp
from mediapipe.tasks import python as mp_python
from mediapipe.tasks.python import vision

MODEL_PATH = Path(__file__).parent / "face_landmarker.task"
CAMERA_INDEX = 0
NUM_FACES = 2

conn = vision.FaceLandmarksConnections
DRAW_STYLES = [
    (conn.FACE_LANDMARKS_TESSELATION, (80, 80, 80), 1),
    (conn.FACE_LANDMARKS_FACE_OVAL, (224, 224, 224), 1),
    (conn.FACE_LANDMARKS_LIPS, (180, 180, 255), 1),
    (conn.FACE_LANDMARKS_LEFT_EYE, (48, 255, 48), 1),
    (conn.FACE_LANDMARKS_LEFT_EYEBROW, (48, 255, 48), 1),
    (conn.FACE_LANDMARKS_RIGHT_EYE, (48, 48, 255), 1),
    (conn.FACE_LANDMARKS_RIGHT_EYEBROW, (48, 48, 255), 1),
    (conn.FACE_LANDMARKS_LEFT_IRIS, (255, 255, 0), 1),
    (conn.FACE_LANDMARKS_RIGHT_IRIS, (255, 255, 0), 1),
]


def draw_landmarks(frame, result):
    h, w = frame.shape[:2]
    for face in result.face_landmarks:
        pts = [(int(lm.x * w), int(lm.y * h)) for lm in face]
        for connections, color, thickness in DRAW_STYLES:
            for c in connections:
                cv2.line(frame, pts[c.start], pts[c.end], color, thickness, cv2.LINE_AA)


def draw_blendshapes(frame, result, top_k=5):
    if not result.face_blendshapes:
        return
    top = sorted(result.face_blendshapes[0], key=lambda c: c.score, reverse=True)[:top_k]
    for i, cat in enumerate(top):
        y = 60 + i * 22
        cv2.rectangle(frame, (10, y - 12), (10 + int(cat.score * 150), y + 4), (0, 200, 255), -1)
        cv2.putText(frame, f"{cat.category_name} {cat.score:.2f}", (165, y + 2),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1, cv2.LINE_AA)


def main():
    if not MODEL_PATH.exists():
        raise FileNotFoundError(f"모델 파일이 없습니다: {MODEL_PATH}")

    options = vision.FaceLandmarkerOptions(
        # 경로에 한글이 있으면 C 라이브러리가 파일을 못 열기 때문에 바이트로 전달
        base_options=mp_python.BaseOptions(model_asset_buffer=MODEL_PATH.read_bytes()),
        running_mode=vision.RunningMode.VIDEO,
        num_faces=NUM_FACES,
        output_face_blendshapes=True,
        output_facial_transformation_matrixes=False,
    )

    cap = cv2.VideoCapture(CAMERA_INDEX, cv2.CAP_DSHOW)
    if not cap.isOpened():
        raise RuntimeError(f"웹캠({CAMERA_INDEX})을 열 수 없습니다.")

    start = time.monotonic()
    prev = start
    with vision.FaceLandmarker.create_from_options(options) as landmarker:
        while True:
            ok, frame = cap.read()
            if not ok:
                break
            frame = cv2.flip(frame, 1)  # 거울 모드

            rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)
            timestamp_ms = int((time.monotonic() - start) * 1000)
            result = landmarker.detect_for_video(mp_image, timestamp_ms)

            draw_landmarks(frame, result)
            draw_blendshapes(frame, result)

            now = time.monotonic()
            fps = 1.0 / max(now - prev, 1e-6)
            prev = now
            cv2.putText(frame, f"FPS {fps:.1f}  Faces {len(result.face_landmarks)}", (10, 30),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 0), 2, cv2.LINE_AA)

            cv2.imshow("MediaPipe Face Landmarker", frame)
            if cv2.waitKey(1) & 0xFF in (ord("q"), 27):
                break

    cap.release()
    cv2.destroyAllWindows()


if __name__ == "__main__":
    main()
