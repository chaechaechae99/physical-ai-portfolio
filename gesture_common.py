"""수집/훈련/추론 스크립트가 같이 쓰는 공통 코드"""
import os

import cv2
import numpy as np
from mediapipe.tasks import python as mp_python
from mediapipe.tasks.python import vision

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "hand_landmarker.task")
DATA_PATH = os.path.join(BASE_DIR, "data", "gestures.csv")
CLASSIFIER_PATH = os.path.join(BASE_DIR, "models", "gesture_classifier.joblib")

NUM_FEATURES = 21 * 3

HAND_CONNECTIONS = [
    (0, 1), (1, 2), (2, 3), (3, 4),
    (0, 5), (5, 6), (6, 7), (7, 8),
    (5, 9), (9, 10), (10, 11), (11, 12),
    (9, 13), (13, 14), (14, 15), (15, 16),
    (13, 17), (0, 17), (17, 18), (18, 19), (19, 20),
]


def create_landmarker(num_hands=1):
    # 경로에 한글이 있으면 mediapipe가 파일을 못 열어서 바이트로 직접 전달
    with open(MODEL_PATH, "rb") as f:
        model_data = f.read()
    options = vision.HandLandmarkerOptions(
        base_options=mp_python.BaseOptions(model_asset_buffer=model_data),
        running_mode=vision.RunningMode.VIDEO,
        num_hands=num_hands,
        min_hand_detection_confidence=0.5,
        min_hand_presence_confidence=0.5,
        min_tracking_confidence=0.5,
    )
    return vision.HandLandmarker.create_from_options(options)


def open_camera(cam_index=0):
    cap = cv2.VideoCapture(cam_index, cv2.CAP_DSHOW)
    if not cap.isOpened():
        raise RuntimeError(f"웹캠 {cam_index}번을 열 수 없습니다.")
    cap.set(cv2.CAP_PROP_FOURCC, cv2.VideoWriter_fourcc(*"YUY2"))
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
    for _ in range(10):  # 워밍업
        cap.read()
    return cap


def landmarks_to_features(landmarks, handedness_name):
    """21개 랜드마크 -> 63차원 특징 벡터.

    위치/크기/왼오른손에 상관없이 같은 손 모양이면 비슷한 값이 나오도록 정규화한다.
    1) 손목(0번)을 원점으로 이동
    2) 손목과 가장 먼 점까지의 거리로 나눠 크기 정규화
    3) 왼손이면 x를 뒤집어 오른손 기준으로 맞춤
    """
    pts = np.array([[lm.x, lm.y, lm.z] for lm in landmarks], dtype=np.float32)
    pts -= pts[0]
    scale = np.linalg.norm(pts[:, :2], axis=1).max()
    if scale > 0:
        pts /= scale
    if handedness_name == "Left":
        pts[:, 0] *= -1
    return pts.flatten()


def draw_hand(frame, landmarks):
    h, w = frame.shape[:2]
    pts = [(int(lm.x * w), int(lm.y * h)) for lm in landmarks]
    for a, b in HAND_CONNECTIONS:
        cv2.line(frame, pts[a], pts[b], (0, 255, 0), 2)
    for p in pts:
        cv2.circle(frame, p, 4, (0, 0, 255), -1)
    return pts


def put_text(frame, text, org, color=(255, 255, 255), scale=0.7):
    cv2.putText(frame, text, org, cv2.FONT_HERSHEY_SIMPLEX, scale, (0, 0, 0), 4)
    cv2.putText(frame, text, org, cv2.FONT_HERSHEY_SIMPLEX, scale, color, 2)
