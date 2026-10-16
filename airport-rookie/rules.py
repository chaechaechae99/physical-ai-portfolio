# 돌발상황: 한 판에 한 번, 2년 차에 랜덤으로 바뀌는 규칙
import random

import config


def default_mods():
    """규칙 변경 전의 기본 값. 규칙이 발동하면 이 값 중 하나가 바뀐다."""
    return {
        "profit_w": 1.0,     # 성과 평가에서 수익 비중
        "sat_w": 0.0,        # 성과 평가에서 만족도 비중
        "upkeep_mult": 1.0,  # 비행기 유지비 배율
        "land_mult": 1.0,    # 땅값 배율
        "runway_min_len": config.RUNWAY_MIN_LEN,   # 운항에 필요한 활주로 길이 (이어진 칸 수)
        "noise": False,      # 활주로 옆 터미널 금지
        "night_mult": 1.0,   # 밤 수익 배율
    }


def _kpi(m):
    m["profit_w"] = 0.2
    m["sat_w"] = 1.6


def _land(m):
    m["land_mult"] = 2.0


def _oil(m):
    m["upkeep_mult"] = 2.0


def _safety(m):
    m["runway_min_len"] = 12


def _noise(m):
    m["noise"] = True


def _night(m):
    m["night_mult"] = 0.0


RULES = [
    {
        "title": "신임 사장 취임 - 평가 기준 변경",
        "level": 1,
        "desc": "이제 수익보다 승객 만족도가 성과 평가에 크게 반영됩니다.",
        "boss": "팀장: 어... 우리 수익만 보고 달려왔는데...?",
        "apply": _kpi,
    },
    {
        "title": "부동산 규제 강화",
        "level": 1,
        "desc": "공항 부지 매입 가격이 2배로 오릅니다.",
        "boss": "팀장: 땅 미리 사둘 걸 그랬나...",
        "apply": _land,
    },
    {
        "title": "국제 유가 폭등",
        "level": 2,
        "desc": "비행기 유지비가 2배가 됩니다.",
        "boss": "팀장: 비행기 더 사는 건 신중하게 하자.",
        "apply": _oil,
    },
    {
        "title": "항공 안전 규정 강화",
        "level": 2,
        "desc": "활주로가 한 줄로 12칸 이상 이어져야 비행기가 뜰 수 있습니다.",
        "boss": "선배: 활주로 모자라면 비행기 전부 멈춘다!",
        "apply": _safety,
    },
    {
        "title": "소음 규제 시행",
        "level": 3,
        "desc": "활주로와 맞닿은 터미널은 운영이 중단되고, 활주로 옆에 새 터미널을 지을 수 없습니다.",
        "boss": "팀장: 터미널 위치를 다시 짜야겠는데...",
        "apply": _noise,
    },
    {
        "title": "야간 운항 전면 금지",
        "level": 3,
        "desc": "밤에는 비행기 수익이 0이 됩니다.",
        "boss": "선배: 밤에는 그냥 쉬는 거야. 낮에 벌어야 돼.",
        "apply": _night,
    },
]


def pick_rule(levels, exclude=()):
    """난이도에 맞는 규칙 중 아직 안 나온 것 하나를 랜덤으로 고른다. 없으면 None"""
    left = [r for r in RULES if r["level"] in levels and r not in exclude]
    return random.choice(left) if left else None


def build_mods(active):
    """지금 걸려 있는 규칙들을 모두 적용한 값"""
    mods = default_mods()
    for rule in active:
        rule["apply"](mods)
    return mods
