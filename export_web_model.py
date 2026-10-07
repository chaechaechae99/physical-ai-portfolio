"""학습한 제스처 분류기를 웹에서 쓸 수 있게 JSON으로 내보내기

사용법:
    python export_web_model.py

models/gesture_classifier.joblib -> web/gesture_model.json
(StandardScaler 평균/표준편차 + MLP 가중치. 웹에서 같은 계산을 JS로 수행)
다시 학습하면 이 스크립트도 다시 실행해야 웹에 반영된다.
"""
import json
import os

import joblib

from gesture_common import BASE_DIR, CLASSIFIER_PATH

OUT_PATH = os.path.join(BASE_DIR, "web", "gesture_model.json")


def main():
    model = joblib.load(CLASSIFIER_PATH)
    scaler = model.named_steps["standardscaler"]
    mlp = model.named_steps["mlpclassifier"]
    if mlp.activation != "relu" or mlp.out_activation_ != "softmax":
        raise SystemExit(f"지원하지 않는 활성화 함수: {mlp.activation}/{mlp.out_activation_}")

    data = {
        "classes": [str(c) for c in mlp.classes_],
        "mean": scaler.mean_.tolist(),
        "scale": scaler.scale_.tolist(),
        "layers": [
            {"W": W.tolist(), "b": b.tolist()}
            for W, b in zip(mlp.coefs_, mlp.intercepts_)
        ],
    }
    os.makedirs(os.path.dirname(OUT_PATH), exist_ok=True)
    with open(OUT_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f)
    print(f"클래스: {data['classes']}")
    print(f"저장: {OUT_PATH}")


if __name__ == "__main__":
    main()
