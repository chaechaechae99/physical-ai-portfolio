"""학습한 나만의 제스처를 웹캠으로 실시간 추론

사용법:
    python infer_gesture.py [--cam 0] [--threshold 0.7]

신뢰도가 threshold 보다 낮으면 "?" 로 표시한다. 종료: q/ESC
"""
import argparse
import os
import time

import cv2
import joblib
import mediapipe as mp

from gesture_common import (CLASSIFIER_PATH, create_landmarker, draw_hand,
                            landmarks_to_features, open_camera, put_text)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--cam", type=int, default=0, help="카메라 번호")
    parser.add_argument("--threshold", type=float, default=0.7, help="최소 신뢰도")
    args = parser.parse_args()

    if not os.path.exists(CLASSIFIER_PATH):
        raise SystemExit("학습된 모델이 없습니다. 먼저 train_gesture.py 를 실행하세요.")
    clf = joblib.load(CLASSIFIER_PATH)
    print("제스처 목록:", [str(c) for c in clf.classes_])

    cap = open_camera(args.cam)
    start = time.monotonic()
    with create_landmarker(num_hands=2) as landmarker:
        while True:
            ok, frame = cap.read()
            if not ok:
                print("카메라 프레임을 읽지 못했습니다. (다른 프로그램이 카메라 사용 중인지 확인)")
                break
            frame = cv2.flip(frame, 1)

            rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)
            result = landmarker.detect_for_video(mp_image, int((time.monotonic() - start) * 1000))

            for landmarks, handedness in zip(result.hand_landmarks, result.handedness):
                handed = handedness[0].category_name
                pts = draw_hand(frame, landmarks)

                feats = landmarks_to_features(landmarks, handed)
                proba = clf.predict_proba([feats])[0]
                best = proba.argmax()
                label = clf.classes_[best] if proba[best] >= args.threshold else "?"

                x0 = min(p[0] for p in pts)
                y0 = max(min(p[1] for p in pts) - 10, 25)
                put_text(frame, f"{label} {proba[best]:.2f}", (x0, y0), (0, 255, 255), 0.9)

            cv2.imshow("My Gesture", frame)
            if cv2.waitKey(1) & 0xFF in (ord("q"), 27):
                break

    cap.release()
    cv2.destroyAllWindows()


if __name__ == "__main__":
    main()
