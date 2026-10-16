# 게임 밸런스 상수 모음
# 숫자를 바꾸고 싶으면 이 파일만 수정하면 된다.
import os

# ── 시간 ──────────────────────────────────────────
# 개발/테스트 모드(기본): 1개월 = 30초 / 실제 플레이: 1개월 = 20분
# 환경변수 AIRPORT_DEV_MODE=0 으로 실행하면 실제 플레이 속도가 된다
DEV_MODE = os.environ.get("AIRPORT_DEV_MODE", "1") == "1"
MONTH_SECONDS = 30 if DEV_MODE else 1200   # 1개월 = 낮 절반 + 밤 절반
TICK_MS = 1000                             # 1틱 = 실제 1초 (2배속이면 0.5초)
MAX_YEARS = 10

# ── 맵 ────────────────────────────────────────────
GRID_SIZE = 40        # 40x40 공항 도시
START_W = 10          # 처음 가진 땅: 맵 아래쪽 가운데 10x8
START_H = 8
ENTRANCE_COL = GRID_SIZE // 2   # 맵 아래 정중앙 = 공항 입구 (차가 여기로 들어온다)
TILE_PX = 32

# ── 건설 도구 ─────────────────────────────────────
# kind: build = 바로 지어짐 / zone = 구역만 정하면 건물이 알아서 올라감
ZONES = {
    "road":          {"name": "도로",      "kind": "build", "color": "#5c5f6b", "cost": 10},
    "runway":        {"name": "활주로",    "kind": "build", "color": "#4a4d58", "cost": 30},
    "hangar_light":  {"name": "소형 격납고", "kind": "build", "color": "#a5e4d9", "cost": 50},   # 활주로 옆에만
    "hangar":        {"name": "중형 격납고", "kind": "build", "color": "#a9b8c9", "cost": 80},
    "hangar_jumbo":  {"name": "대형 격납고", "kind": "build", "color": "#5b8def", "cost": 250},
    "gate":          {"name": "탑승동",    "kind": "build", "color": "#d7dde5", "cost": 150},   # 활주로 옆에만
    "zone_terminal": {"name": "여객 터미널", "kind": "zone", "color": "#4f86f7", "cost": 20},   # 도로 옆, 차가 손님을 내려줌
    "tower":         {"name": "관제탑",    "kind": "build", "color": "#3f6cc4", "cost": 500},
    "zone_shop":     {"name": "상업 구역",  "kind": "zone", "color": "#ec407a", "cost": 20},
    "zone_parking":  {"name": "주차 구역",  "kind": "zone", "color": "#d7dde5", "cost": 15},
    "zone_shop_premium": {"name": "고급 상업 구역", "kind": "zone", "color": "#ffc107", "cost": 60},
    "zone_parking_premium": {"name": "주차 타워", "kind": "zone", "color": "#90a4ae", "cost": 50},
}
BASE_ZONES = ["road", "runway", "hangar_light", "hangar", "hangar_jumbo", "gate", "zone_terminal", "zone_shop", "zone_parking"]
# 격납고 종류 → 들어갈 수 있는 가장 큰 비행기 (큰 격납고엔 작은 비행기도 들어간다)
HANGARS = {"hangar_light": "light", "hangar": "mid", "hangar_jumbo": "jumbo"}
PLANE_SIZE = {"light": 0, "mid": 1, "jumbo": 2}
# 회차 클리어 보상: 1회 클리어 → 관제탑, 2회 → 고급 상업 구역, 3회 → 주차 타워
UNLOCK_ORDER = ["tower", "zone_shop_premium", "zone_parking_premium"]

# 구역 건물 성장
MAX_LEVEL = {"terminal": 3, "shop": 3, "shop_premium": 3, "parking": 2, "parking_premium": 2}
CONSTRUCT_MONTHS = 0.2      # 빈 구역 → Lv1 공사 기간
UPGRADE_MONTHS = 0.4        # Lv1 → Lv2 공사 기간 (Lv2 → Lv3는 2배)

# ── 경제 (게임 화폐 / 1개월) ──────────────────────
CURRENCY = "G"              # 화폐 단위 (골드)
LAND_BASE_PRICE = 15        # 땅 1칸 기본 가격 (입구에서 멀수록 비싸짐)
BUILDING_UPKEEP = 2         # 시설 1칸(건물 레벨 1당) 월 유지비

# 비행기 종류 (income = 운항 중 월 수익, 만족도 50 기준 / load = 터미널 부담)
PLANE_TYPES = {
    "light": {"name": "경비행기",   "price": 100, "income": 35,  "upkeep": 6,  "load": 1, "unlock_month": 0},
    "mid":   {"name": "여객기",     "price": 220, "income": 85,  "upkeep": 15, "load": 2, "unlock_month": 0},
    "jumbo": {"name": "대형 여객기", "price": 900, "income": 300, "upkeep": 45, "load": 5, "unlock_month": 24},
}
RUNWAY_MIN_LEN = 8          # 활주로는 한 줄로 8칸 이상 이어져야 비행기가 뜬다
JUMBO_RUNWAY_LEN = 12       # 대형 여객기는 12칸 이상 활주로가 필요
PLANES_PER_GATE = 2         # 탑승동 1칸이 감당하는 비행기 수
TERMINAL_LOAD_PER_LV = 2    # 여객 터미널 레벨 1당 감당하는 손님(load)
SHOP_INCOME = 20            # 상점 레벨 1당 월 수익
PREMIUM_SHOP_INCOME = 50    # 고급 상점 레벨 1당 월 수익
TOWER_BONUS = 0.15          # 관제탑이 있으면 운항 수익 +15%
DAY_FACTOR = 1.5            # 낮에는 운항이 많다
NIGHT_FACTOR = 0.5          # 밤에는 운항이 적다

# ── 난이도 ────────────────────────────────────────
# rule_levels: 등장할 수 있는 돌발 규칙의 강도 (1 약함 ~ 3 강함)
DIFFICULTY = {
    "쉬움":   {"start_money": 1400, "land_mult": 0.8, "rule_levels": (1,)},
    "보통":   {"start_money": 1100, "land_mult": 1.0, "rule_levels": (1, 2)},
    "어려움": {"start_money": 950,  "land_mult": 1.3, "rule_levels": (2, 3)},
}

# 돌발 이벤트(규칙 변경) 일정 - 개월 수는 0부터 센다 (12 = 2년 차 1월)
#  fixed: 정해진 기간 안에 꼭 한 번씩 발생 / chance: 매달 이 확률로 발생 (from 개월부터)
EVENTS = {
    "쉬움":   {"fixed": [(12, 23), (24, 83)], "chance": 0, "from": 0},
    "보통":   {"fixed": [(12, 23), (24, 83)], "chance": 0, "from": 0},
    "어려움": {"fixed": [], "chance": 0.12, "from": 12},
}
EVENT_NOTICE = {
    "쉬움": "규칙 변경 이벤트는 총 2번!\n- 2년 차에 1번 (확정)\n- 3~7년 차 사이에 1번 (언제일지는 비밀)",
    "보통": "규칙 변경 이벤트는 총 2번!\n- 2년 차에 1번 (확정)\n- 3~7년 차 사이에 1번 (언제일지는 비밀)",
    "어려움": ("규칙 변경 이벤트는 2년 차부터 매달 확률로 터진다.\n"
             "10년 내내 한 번도 안 나올 수도, 매달 터질 수도 있다.\n"
             "규칙이 전부 바뀐 상태면 기존 규칙 하나가 풀리는 '규칙 완화'가 나온다."),
}
TOWER_NOTICE = "관제탑이 있으면 이벤트를 한 달 전에 미리 알려준다."

# ── 직급 (누적 성과 점수 기준) ─────────────────────
RANKS = [
    ("사원", 0),
    ("대리", 1500),
    ("과장", 6000),
    ("차장", 18000),
    ("부장", 40000),
    ("이사", 80000),
    ("사장", 120000),
    ("회장", 180000),  # 도달하면 클리어
]

# 게임 시작하자마자 뜨는 인트로
INTRO_TITLE = "입사를 축하합니다!"
INTRO_TEXT = (
    "오늘부터 당신은 대기업 공항사업부의 신입사원.\n\n"
    "첫 출근 날, 회장님이 창밖의 빈 땅을 가리키며 말했다.\n"
    "\"자네, 저 입구 앞에 공항 하나 지어보게.\"\n\n"
    "...신입사원인 내가 공항을 지으면서\n"
    "회장 자리까지 올라가라고?\n\n"
    "목표: 10년 안에 회장 취임!\n"
    "단, 2년 차에 회사 규칙 하나가 갑자기 바뀐다는 소문이..."
)

BOSS_LINES = [
    "팀장: 요즘 위에서 공항 얘기 많이 하더라. 잘하고 있지?",
    "팀장: 신입 때는 다 그래. 너무 무리하지 말고.",
    "선배: 격납고 없으면 비행기 사봤자 못 세워둔다? 대형기는 대형 격납고에만 들어가.",
    "선배: 구역은 꼭 도로랑 붙여야 건물이 올라와.",
    "팀장: 이번 달 보고서 기대할게~",
    "선배: 활주로는 8칸 넘게 쭉 이어야 비행기가 떠.",
    "선배: 탑승동(활주로 옆)이랑 여객 터미널(도로 옆) 둘 다 있어야 손님을 태워.",
    "선배: 3년 차부터는 대형 여객기도 살 수 있대. 활주로 12칸은 깔아둬.",
]
