"""수집한 제스처 데이터로 분류기 훈련

사용법:
    python train_gesture.py

data/gestures.csv 를 읽어 MLP 분류기를 학습하고
models/gesture_classifier.joblib 로 저장한다.
"""
import csv
import os
from collections import Counter

import joblib
import numpy as np
from sklearn.metrics import classification_report, confusion_matrix
from sklearn.model_selection import train_test_split
from sklearn.neural_network import MLPClassifier
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler

from gesture_common import CLASSIFIER_PATH, DATA_PATH, NUM_FEATURES


def load_data():
    X, y = [], []
    with open(DATA_PATH, newline="", encoding="utf-8") as f:
        for row in csv.reader(f):
            if len(row) != NUM_FEATURES + 1:
                continue
            y.append(row[0])
            X.append([float(v) for v in row[1:]])
    return np.array(X, dtype=np.float32), np.array(y)


def train_model(log=print):
    """학습 후 저장한 모델을 반환. 문제가 있으면 ValueError."""
    if not os.path.exists(DATA_PATH):
        raise ValueError(f"데이터가 없습니다: {DATA_PATH}\n먼저 제스처를 수집하세요.")

    X, y = load_data()
    counts = Counter(y)
    log("클래스별 샘플 수:")
    for label, n in sorted(counts.items()):
        log(f"  {label:15s} {n}")
    if len(counts) < 2:
        raise ValueError("제스처가 최소 2종류 필요합니다.")
    if min(counts.values()) < 10:
        raise ValueError("제스처마다 최소 10개 이상 수집하세요.")

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y)

    model = make_pipeline(
        StandardScaler(),
        MLPClassifier(hidden_layer_sizes=(128, 64), max_iter=500,
                      early_stopping=True, random_state=42),
    )
    model.fit(X_train, y_train)

    y_pred = model.predict(X_test)
    log("\n=== 테스트 결과 ===")
    log(classification_report(y_test, y_pred, digits=3))
    labels = model.classes_
    log(f"혼동 행렬 (행=정답, 열=예측): {[str(l) for l in labels]}")
    log(str(confusion_matrix(y_test, y_pred, labels=labels)))

    # 전체 데이터로 다시 학습해서 저장
    model.fit(X, y)
    os.makedirs(os.path.dirname(CLASSIFIER_PATH), exist_ok=True)
    joblib.dump(model, CLASSIFIER_PATH)
    log(f"\n모델 저장: {CLASSIFIER_PATH}")
    return model


def main():
    try:
        train_model()
    except ValueError as e:
        raise SystemExit(str(e))


if __name__ == "__main__":
    main()
