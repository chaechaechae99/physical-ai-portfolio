"""나만의 제스처 데이터 수집

사용법:
    python collect_gesture.py <제스처이름> [--count 300] [--cam 0]

    예) python collect_gesture.py rock
        python collect_gesture.py v_sign --count 500

조작:
    SPACE : 녹화 시작/일시정지 (손 모양을 유지한 채 조금씩 움직이기)
    q/ESC : 종료

손 하나의 랜드마크를 프레임마다 data/gestures.csv 에 한 줄씩 추가한다.
(첫 칸 = 라벨, 나머지 63칸 = 정규화된 x,y,z)
"""
import argparse
import csv
import os
import time

import cv2
import mediapipe as mp

from gesture_common import (DATA_PATH, create_landmarker, draw_hand,
                            landmarks_to_features, open_camera, put_text)


def count_existing(label):
    if not os.path.exists(DATA_PATH):
        return 0
    with open(DATA_PATH, newline="", encoding="utf-8") as f:
        return sum(1 for row in csv.reader(f) if row and row[0] == label)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("label", help="제스처 이름 (영어 권장, 예: rock, v_sign)")
    parser.add_argument("--count", type=int, default=300, help="이번에 수집할 샘플 수")
    parser.add_argument("--cam", type=int, default=0, help="카메라 번호")
    args = parser.parse_args()

    os.makedirs(os.path.dirname(DATA_PATH), exist_ok=True)
    existing = count_existing(args.label)
    print(f"[{args.label}] 기존 샘플 {existing}개, 이번에 {args.count}개 수집")

    cap = open_camera(args.cam)
    recording = False
    saved = 0
    start = time.monotonic()

    with create_landmarker(num_hands=1) as landmarker, \
            open(DATA_PATH, "a", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        while saved < args.count:
            ok, frame = cap.read()
            if not ok:
                print("카메라 프레임을 읽지 못했습니다. (다른 프로그램이 카메라 사용 중인지 확인)")
                break
            frame = cv2.flip(frame, 1)

            rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)
            result = landmarker.detect_for_video(mp_image, int((time.monotonic() - start) * 1000))

            if result.hand_landmarks:
                landmarks = result.hand_landmarks[0]
                handed = result.handedness[0][0].category_name
                draw_hand(frame, landmarks)
                if recording:
                    feats = landmarks_to_features(landmarks, handed)
                    writer.writerow([args.label] + [f"{v:.6f}" for v in feats])
                    saved += 1

            status = "REC" if recording else "PAUSED (SPACE)"
            color = (0, 0, 255) if recording else (200, 200, 200)
            put_text(frame, f"{args.label}: {saved}/{args.count}  {status}", (10, 30), color)
            if not result.hand_landmarks:
                put_text(frame, "no hand", (10, 60), (0, 165, 255))
            if recording:
                cv2.circle(frame, (620, 20), 10, (0, 0, 255), -1)

            cv2.imshow("Collect Gesture", frame)
            key = cv2.waitKey(1) & 0xFF
            if key == ord(" "):
                recording = not recording
            elif key in (ord("q"), 27):
                break

    cap.release()
    cv2.destroyAllWindows()
    print(f"[{args.label}] {saved}개 저장 -> 총 {existing + saved}개 ({DATA_PATH})")


if __name__ == "__main__":
    main()
