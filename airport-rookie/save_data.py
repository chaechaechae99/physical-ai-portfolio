# 다회차 기록 저장/불러오기
#  - tkinter 버전: 이 폴더의 save.json
#  - 웹 버전: 각자 브라우저(localStorage)에 저장하고, 서버에는 매번 보내준다
import json
import os

import config

SAVE_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "save.json")

DEFAULT = {
    "runs": 0,        # 시작한 판 수
    "clears": 0,      # 클리어 횟수 (보상 해금 기준)
    "best_rank": 0,   # 최고 직급 (RANKS 인덱스)
    "history": [],
}


def clean(data):
    """밖에서 들어온 기록을 안전한 값으로 정리"""
    if not isinstance(data, dict):
        data = {}

    def num(key, hi):
        v = data.get(key, 0)
        return max(0, min(hi, v)) if isinstance(v, int) and not isinstance(v, bool) else 0

    history = data.get("history", [])
    return {
        "runs": num("runs", 10 ** 6),
        "clears": num("clears", 1000),
        "best_rank": num("best_rank", len(config.RANKS) - 1),
        "history": [h for h in history if isinstance(h, dict)][-20:] if isinstance(history, list) else [],
    }


def load():
    data = dict(DEFAULT, history=[])
    if os.path.exists(SAVE_PATH):
        try:
            with open(SAVE_PATH, encoding="utf-8") as f:
                data = json.load(f)
        except (OSError, json.JSONDecodeError):
            pass   # 파일이 깨졌으면 새로 시작
    return clean(data)


def save(data):
    with open(SAVE_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def unlocked_zones(data):
    """클리어 횟수만큼 보상 시설 해금"""
    return config.UNLOCK_ORDER[:data["clears"]]


def speed_unlocked(data):
    """2회차부터 2배속 (runs는 이번 판을 포함한 값)"""
    return data["runs"] >= 2
