# 게임 엔진: 화면(tkinter / 웹)과 상관없이 게임 규칙과 계산만 담당한다.
import random
from collections import deque

import config
import rules
import save_data
import sprites

N = config.GRID_SIZE
ENTRANCE = (N - 1, config.ENTRANCE_COL)
DIRS = ((1, 0), (-1, 0), (0, 1), (0, -1))


def money_text(v):
    return f"{int(v):,} {config.CURRENCY}"


def topic(word):
    """받침에 맞춰 '은/는' 붙이기 (예: 격납고는, 여객기는, 탑승동은)"""
    code = ord(word[-1]) - 0xAC00
    return word + ("은" if 0 <= code < 11172 and code % 28 else "는")


class GameState:
    def __init__(self, difficulty, save):
        d = config.DIFFICULTY[difficulty]
        self.difficulty = difficulty
        self.money = float(d["start_money"])
        self.land_mult = d["land_mult"]

        self.month = 0        # 지난 개월 수 (0 = 1년 차 1월)
        self.second = 0       # 이번 달에 흐른 초
        self.month_net = 0.0  # 이번 달 누적 순이익

        # grid 값: None = 안 산 땅, "empty" = 빈 땅, 그 외 = 시설/구역 키
        self.grid = [[None] * N for _ in range(N)]
        self.levels = [[0] * N for _ in range(N)]   # 구역 건물 레벨 (0 = 빈 구역, -1 = 첫 공사 중)
        self.timers = [[0] * N for _ in range(N)]   # 공사 남은 초
        left = config.ENTRANCE_COL - config.START_W // 2
        for r in range(N - config.START_H, N):
            for c in range(left, left + config.START_W):
                self.grid[r][c] = "empty"
        for r in range(N - 3, N):                  # 입구에서 들어오는 기본 도로
            self.grid[r][config.ENTRANCE_COL] = "road"
        self._roads = None                         # 입구와 이어진 도로 (캐시)

        self.fleet = {k: 0 for k in config.PLANE_TYPES}   # 종류별 보유 대수
        self.perf = 0.0
        self.rank_index = 0

        # 회차 보상: 해금된 시설은 첫 1개 무료
        rewards = save_data.unlocked_zones(save)
        self.unlocked = list(config.BASE_ZONES) + rewards
        self.free_builds = set(rewards)

        # 돌발상황: 미리 뽑아두고 2년 차 랜덤 시점에 발동
        self.rule_levels = d["rule_levels"]
        self.event_cfg = config.EVENTS[difficulty]
        self.active_rules = []          # 지금 걸려 있는 규칙들
        self.mods = rules.build_mods(self.active_rules)
        self.scheduled = {}             # 개월 → 이벤트 (규칙 dict 또는 "random")
        taken = []
        for a, b in self.event_cfg["fixed"]:
            rule = rules.pick_rule(self.rule_levels, taken)
            if rule:
                taken.append(rule)
                self.scheduled[random.randint(a, b)] = rule

        self.finished = None   # "clear" / "fired" / "timeout"
        self.messages = []     # 화면이 가져가서 로그에 출력
        self.popups = []       # 화면이 가져가서 팝업으로 표시 (title, text)

        self.log("입사 첫날! 공항 입구 앞 부지를 맡게 되었습니다.")
        self.log("선배: 활주로를 한 줄로 8칸 이상 깔고, 그 옆에 격납고와 탑승동을 지어.")
        self.log("선배: 그리고 도로 옆에 여객 터미널 구역을 칠하면 건물이 알아서 올라가.")
        if self.free_builds:
            names = ", ".join(config.ZONES[z]["name"] for z in self.free_builds)
            self.log(f"회차 보상: {names} 1개 무료!")

    # ── 기본 정보 ──────────────────────────────────
    def log(self, msg):
        self.messages.append(msg)

    def date_text(self):
        return f"{self.month // 12 + 1}년 차 {self.month % 12 + 1}월"

    def is_day(self):
        return self.second < config.MONTH_SECONDS / 2

    def seconds_left(self):
        return config.MONTH_SECONDS - self.second

    def rank_name(self):
        return config.RANKS[self.rank_index][0]

    def next_rank(self):
        if self.rank_index + 1 < len(config.RANKS):
            return config.RANKS[self.rank_index + 1]
        return None

    def cells(self, value):
        return [(r, c) for r in range(N) for c in range(N) if self.grid[r][c] == value]

    def count(self, value):
        return sum(row.count(value) for row in self.grid)

    def is_next_to(self, r, c, value):
        return any(0 <= r + dr < N and 0 <= c + dc < N and self.grid[r + dr][c + dc] == value
                   for dr, dc in DIRS)

    # ── 도로 / 구역 ────────────────────────────────
    def connected_roads(self):
        """입구에서 이어진 도로 칸 집합"""
        if self._roads is None:
            seen = set()
            if self.grid[ENTRANCE[0]][ENTRANCE[1]] == "road":
                q = deque([ENTRANCE])
                seen.add(ENTRANCE)
                while q:
                    r, c = q.popleft()
                    for dr, dc in DIRS:
                        nr, nc = r + dr, c + dc
                        if 0 <= nr < N and 0 <= nc < N and (nr, nc) not in seen and self.grid[nr][nc] == "road":
                            seen.add((nr, nc))
                            q.append((nr, nc))
            self._roads = seen
        return self._roads

    def has_road(self, r, c):
        roads = self.connected_roads()
        return any((r + dr, c + dc) in roads for dr, dc in DIRS)

    def zone_operating(self, r, c):
        """구역 건물이 제대로 돌아가는지 (도로 연결 + 소음 규제)"""
        if not self.has_road(r, c):
            return False
        if self.grid[r][c] == "zone_terminal" and self.mods["noise"] and self.is_next_to(r, c, "runway"):
            return False
        return True

    def zone_level_sum(self, kind):
        return sum(max(0, self.levels[r][c]) for r, c in self.cells("zone_" + kind)
                   if self.zone_operating(r, c))

    # ── 운영 계산 ──────────────────────────────────
    @property
    def planes(self):
        return sum(self.fleet.values())

    def strip_len(self, strip):
        r0, c0, r1, c1 = strip
        return max(r1 - r0, c1 - c0) + 1

    def valid_strips(self):
        """비행기가 뜰 수 있는 활주로 (한 줄로 충분히 긴 것)"""
        return [st for st in self.runway_strips() if self.strip_len(st) >= self.mods["runway_min_len"]]

    def valid_runway_cells(self):
        cells = set()
        for r0, c0, r1, c1 in self.valid_strips():
            cells.update((r, c) for r in range(r0, r1 + 1) for c in range(c0, c1 + 1))
        return cells

    def beside_valid_runway(self, value):
        """제대로 된 활주로 옆에 있는 시설 수 (격납고/탑승동)"""
        ok = self.valid_runway_cells()
        return sum(1 for r, c in self.cells(value) if any((r + dr, c + dc) in ok for dr, dc in DIRS))

    def hangar_caps(self, valid_only=True):
        """크기별 격납고 수 [소형, 중형, 대형] (valid_only: 제대로 된 활주로 옆에 있는 것만)"""
        ok = self.valid_runway_cells() if valid_only else None
        caps = [0, 0, 0]
        for kind, plane in config.HANGARS.items():
            for r, c in self.cells(kind):
                if ok is None or any((r + dr, c + dc) in ok for dr, dc in DIRS):
                    caps[config.PLANE_SIZE[plane]] += 1
        return caps

    @staticmethod
    def park(fleet, caps):
        """비행기를 격납고에 배정 (큰 비행기부터, 맞는 것 중 가장 작은 격납고에) → 종류별 배정 대수"""
        caps = list(caps)
        out = {}
        for kind in ("jumbo", "mid", "light"):
            placed = 0
            for size in range(config.PLANE_SIZE[kind], 3):
                take = min(fleet[kind] - placed, caps[size])
                caps[size] -= take
                placed += take
            out[kind] = placed
        return out

    def all_parked(self, fleet, caps):
        return self.park(fleet, caps) == {k: fleet[k] for k in ("jumbo", "mid", "light")}

    def terminal_capacity(self):
        """여객 터미널이 감당하는 손님 수 (load)"""
        return self.zone_level_sum("terminal") * config.TERMINAL_LOAD_PER_LV

    def plane_slots(self):
        """활주로/격납고/탑승동 기준으로 동시에 띄울 수 있는 비행기 수"""
        strips = self.valid_strips()
        runway_cap = sum(self.strip_len(st) for st in strips)
        return min(runway_cap, self.beside_valid_runway("gate") * config.PLANES_PER_GATE)

    def operating(self, limit_terminal=True):
        """종류별로 실제 운항 중인 비행기 수 (큰 비행기부터 배정)"""
        slots = self.plane_slots()
        load_left = self.terminal_capacity() if limit_terminal else 10 ** 9
        long_ok = any(self.strip_len(st) >= max(config.JUMBO_RUNWAY_LEN, self.mods["runway_min_len"])
                      for st in self.valid_strips())
        parked = self.park(self.fleet, self.hangar_caps())     # 활주로 옆 격납고에 들어간 비행기만
        out = {k: 0 for k in config.PLANE_TYPES}
        for kind in ("jumbo", "mid", "light"):
            if kind == "jumbo" and not long_ok:
                continue
            load = config.PLANE_TYPES[kind]["load"]
            for _ in range(parked[kind]):
                if slots <= 0 or load_left < load:
                    break
                out[kind] += 1
                slots -= 1
                load_left -= load
        return out

    def base_load(self):
        """터미널 제한이 없을 때 생길 손님 수 (터미널 수요 계산용)"""
        op = self.operating(limit_terminal=False)
        return sum(n * config.PLANE_TYPES[k]["load"] for k, n in op.items())

    def base_planes(self):
        return sum(self.operating(limit_terminal=False).values())

    def effective_planes(self):
        return sum(self.operating().values())

    def satisfaction(self):
        crowd = max(0, self.base_load() - self.terminal_capacity()) / 2
        v = (40 + 2 * self.zone_level_sum("terminal") + 4 * self.zone_level_sum("parking")
             + 8 * self.zone_level_sum("parking_premium")
             + 2 * self.zone_level_sum("shop") + 3 * self.zone_level_sum("shop_premium") - 6 * crowd)
        return int(max(0, min(100, v)))

    def monthly_income(self):
        op = self.operating()
        income = sum(n * config.PLANE_TYPES[k]["income"] for k, n in op.items())
        income *= 0.5 + self.satisfaction() / 100
        if self.count("tower") > 0:
            income *= 1 + config.TOWER_BONUS
        room = self.zone_level_sum("terminal") * 2            # 손님 수만큼만 장사가 된다 (고급 상점 먼저)
        premium = min(self.zone_level_sum("shop_premium"), room)
        shops = min(self.zone_level_sum("shop"), room - premium)
        return income + premium * config.PREMIUM_SHOP_INCOME + shops * config.SHOP_INCOME

    def monthly_upkeep(self):
        structures = sum(1 for row in self.grid for v in row if v in ("gate", "tower") or v in config.HANGARS)
        buildings = sum(max(0, lv) for row in self.levels for lv in row)
        planes = sum(n * config.PLANE_TYPES[k]["upkeep"] for k, n in self.fleet.items())
        return planes * self.mods["upkeep_mult"] + (structures + buildings) * config.BUILDING_UPKEEP

    def expected_net(self):
        avg = (config.DAY_FACTOR + config.NIGHT_FACTOR * self.mods["night_mult"]) / 2
        return self.monthly_income() * avg - self.monthly_upkeep()

    def demand(self):
        """구역별로 건물이 더 필요한 정도 (0 이하면 성장 안 함)"""
        term = self.zone_level_sum("terminal")
        return {
            "terminal": (self.base_load() + 2 - self.terminal_capacity()) // 2,
            "shop": int(self.effective_planes() * 1.5) - self.zone_level_sum("shop"),
            "shop_premium": self.effective_planes() - self.zone_level_sum("shop_premium"),
            "parking": (term + 1) // 2 - self.zone_level_sum("parking") - 2 * self.zone_level_sum("parking_premium"),
            "parking_premium": (term + 1) // 2 - self.zone_level_sum("parking") - 2 * self.zone_level_sum("parking_premium"),
        }

    def grow(self):
        """구역 건물 자동 공사/성장 (1초마다)"""
        budget = self.demand()
        month = config.MONTH_SECONDS
        for r, c in [(r, c) for r in range(N) for c in range(N)
                     if self.grid[r][c] and self.grid[r][c].startswith("zone_")]:
            kind = self.grid[r][c][5:]
            lv = self.levels[r][c]
            if self.timers[r][c] > 0:
                self.timers[r][c] -= 1
                if self.timers[r][c] == 0:
                    self.levels[r][c] = 1 if lv == -1 else lv + 1
                continue
            if not self.zone_operating(r, c) or budget[kind] <= 0:
                continue
            if lv == 0:
                self.levels[r][c] = -1
                self.timers[r][c] = max(1, int(month * config.CONSTRUCT_MONTHS))
                budget[kind] -= 1
            elif 1 <= lv < config.MAX_LEVEL[kind] and random.random() < 0.1:
                self.timers[r][c] = max(1, int(month * config.UPGRADE_MONTHS * lv))
                budget[kind] -= 1

    # ── 플레이어 행동 ──────────────────────────────
    def land_price(self, r, c):
        dist = abs(r - ENTRANCE[0]) + abs(c - ENTRANCE[1])
        price = config.LAND_BASE_PRICE * (1 + dist / 8)
        return int(price * self.land_mult * self.mods["land_mult"])

    def buy_land(self, r, c):
        if self.grid[r][c] is not None:
            return False, ""
        if not any(0 <= r + dr < N and 0 <= c + dc < N and self.grid[r + dr][c + dc] is not None
                   for dr, dc in DIRS):
            return False, "이미 가진 땅과 붙어 있는 땅만 살 수 있습니다."
        price = self.land_price(r, c)
        if self.money < price:
            return False, f"자금이 부족합니다. (땅값 {money_text(price)})"
        self.money -= price
        self.grid[r][c] = "empty"
        return True, ""

    def build_cost(self, zone):
        return 0 if zone in self.free_builds else config.ZONES[zone]["cost"]

    def can_build_here(self, r, c, zone):
        """설치 가능한 칸인지 (화면에서 '여기에 설치하세요' 표시용)"""
        if self.grid[r][c] != "empty":
            return False
        if zone == "gate" or zone in config.HANGARS:
            return self.is_next_to(r, c, "runway")
        if zone == "zone_terminal" and self.mods["noise"]:
            return not self.is_next_to(r, c, "runway")
        return True

    def build(self, r, c, zone):
        cell = self.grid[r][c]
        if cell is None:
            return False, "아직 구매하지 않은 땅입니다."
        if cell == zone:
            return False, ""
        if cell != "empty":
            return False, "이미 무언가 있습니다. 먼저 철거하세요."
        if zone not in self.unlocked:
            return False, "아직 해금되지 않은 시설입니다."
        if (zone == "gate" or zone in config.HANGARS) and not self.is_next_to(r, c, "runway"):
            return False, f"{topic(config.ZONES[zone]['name'])} 활주로 바로 옆에만 지을 수 있습니다."
        if zone == "zone_terminal" and self.mods["noise"] and self.is_next_to(r, c, "runway"):
            return False, "소음 규제: 활주로 옆에는 터미널 구역을 정할 수 없습니다."
        cost = self.build_cost(zone)
        if self.money < cost:
            return False, f"자금이 부족합니다. ({money_text(cost)} 필요)"
        self.money -= cost
        self.free_builds.discard(zone)
        self.grid[r][c] = zone
        self.levels[r][c] = 0
        self.timers[r][c] = 0
        self._roads = None
        return True, ""

    def demolish(self, r, c):
        cell = self.grid[r][c]
        if cell in (None, "empty"):
            return False, ""
        if (r, c) == ENTRANCE:
            return False, "공항 입구 도로는 철거할 수 없습니다."
        if cell in config.HANGARS:
            caps = self.hangar_caps(valid_only=False)
            caps[config.PLANE_SIZE[config.HANGARS[cell]]] -= 1
            if not self.all_parked(self.fleet, caps):
                return False, "비행기를 세워둘 격납고가 모자라게 됩니다."
        self.grid[r][c] = "empty"
        self.levels[r][c] = 0
        self.timers[r][c] = 0
        self._roads = None
        return True, ""

    def plane_unlocked(self, kind):
        return self.month >= config.PLANE_TYPES[kind]["unlock_month"]

    def buy_plane(self, kind="mid"):
        info = config.PLANE_TYPES.get(kind)
        if not info:
            return False, "없는 비행기 종류입니다."
        if not self.plane_unlocked(kind):
            return False, f"{topic(info['name'])} {info['unlock_month'] // 12 + 1}년 차부터 살 수 있습니다."
        new = dict(self.fleet, **{kind: self.fleet[kind] + 1})
        if not self.all_parked(new, self.hangar_caps(valid_only=False)):
            fits = [config.ZONES[h]["name"] for h, p in config.HANGARS.items()
                    if config.PLANE_SIZE[p] >= config.PLANE_SIZE[kind]]
            return False, f"빈 격납고가 없습니다. {topic(info['name'])} {'/'.join(fits)}에 들어가요."
        if self.money < info["price"]:
            return False, f"자금이 부족합니다. ({info['name']} {money_text(info['price'])})"
        self.money -= info["price"]
        self.fleet[kind] += 1
        self.log(f"{info['name']} 구매! 현재 비행기 {self.planes}대")
        if kind == "jumbo" and not any(self.strip_len(st) >= config.JUMBO_RUNWAY_LEN for st in self.valid_strips()):
            self.log(f"선배: 대형 여객기는 활주로가 {config.JUMBO_RUNWAY_LEN}칸 이상이어야 떠!")
        return True, ""

    # ── 그래픽용 정보 ──────────────────────────────
    def income_per_sec(self):
        """지금 이 순간 1초에 들어오는 수입 (유지비 빼기 전)"""
        factor = config.DAY_FACTOR if self.is_day() else config.NIGHT_FACTOR * self.mods["night_mult"]
        return self.monthly_income() * factor / config.MONTH_SECONDS

    def runway_strips(self):
        """이어진 활주로 구간 목록 [(r0, c0, r1, c1), ...] - 비행기 이착륙 애니메이션용"""
        strips, used = [], set()
        for r in range(N):          # 가로로 2칸 이상 이어진 활주로
            c = 0
            while c < N:
                if self.grid[r][c] == "runway":
                    start = c
                    while c + 1 < N and self.grid[r][c + 1] == "runway":
                        c += 1
                    if c > start:
                        strips.append((r, start, r, c))
                        used.update((r, x) for x in range(start, c + 1))
                c += 1
        for c in range(N):          # 세로로 2칸 이상 이어진 활주로
            r = 0
            while r < N:
                if self.grid[r][c] == "runway":
                    start = r
                    while r + 1 < N and self.grid[r + 1][c] == "runway":
                        r += 1
                    if r > start:
                        strips.append((start, c, r, c))
                        used.update((y, c) for y in range(start, r + 1))
                r += 1
        for r in range(N):          # 혼자 있는 활주로 1칸
            for c in range(N):
                if self.grid[r][c] == "runway" and (r, c) not in used:
                    strips.append((r, c, r, c))
        return strips

    # ── 시간 흐름 ──────────────────────────────────
    def tick(self):
        """실제 1초마다 호출된다."""
        if self.finished:
            return
        delta = self.income_per_sec() - self.monthly_upkeep() / config.MONTH_SECONDS
        self.money += delta
        self.month_net += delta
        self.grow()
        self.second += 1
        if self.second >= config.MONTH_SECONDS:
            self.end_month()

    def end_month(self):
        sat = self.satisfaction()
        gain = max(0, self.month_net) * (self.mods["profit_w"] + self.mods["sat_w"] * sat / 100)
        self.perf += gain
        self.log(f"[{self.date_text()} 결산] 순이익 {self.month_net:+,.0f} {config.CURRENCY} / 성과 +{gain:,.0f}")

        self.month += 1
        self.second = 0
        self.month_net = 0.0

        if self.money < 0:
            self.finished = "fired"
            return
        if self.check_promotion():
            return
        if self.month >= config.MAX_YEARS * 12:
            self.finished = "timeout"
            return

        # 어려움: 다음 달 이벤트를 확률로 미리 정해둔다 (관제탑이 귀띔할 수 있게)
        nxt = self.month + 1
        if (self.event_cfg["chance"] and nxt >= self.event_cfg["from"] and nxt not in self.scheduled
                and random.random() < self.event_cfg["chance"]):
            self.scheduled[nxt] = "random"
        if self.month in self.scheduled:
            self.trigger_event(self.scheduled.pop(self.month))
        elif random.random() < 0.3:
            self.log(random.choice(config.BOSS_LINES))
        if nxt in self.scheduled and self.count("tower") > 0:
            self.log("관제탑 귀띔: 다음 달 회사 규칙이 바뀐다는 소식이 들려옵니다!")

    def trigger_event(self, event):
        """규칙 변경 이벤트 발생"""
        rule = event if isinstance(event, dict) else rules.pick_rule(self.rule_levels, self.active_rules)
        if rule is None:                  # 더 바뀔 규칙이 없으면 하나가 풀린다
            if not self.active_rules:
                return
            old = random.choice(self.active_rules)
            self.active_rules.remove(old)
            self.mods = rules.build_mods(self.active_rules)
            self.log(f"☆ 규칙 완화: '{old['title']}' 해제")
            self.popups.append(("공지 - 규칙 완화", f"'{old['title']}' 규칙이 풀렸습니다!\n\n팀장: 휴, 한숨 돌렸네."))
            return
        self.active_rules.append(rule)
        self.mods = rules.build_mods(self.active_rules)
        self.log(f"★ 규칙 변경: {rule['title']}")
        self.log(rule["boss"])
        self.popups.append(("긴급 공지 - 규칙 변경", f"{rule['title']}\n\n{rule['desc']}"))

    def check_promotion(self):
        """승진 처리. 회장이 되면 True (클리어)"""
        while self.next_rank() and self.perf >= self.next_rank()[1]:
            self.rank_index += 1
            self.log(f"승진! {self.rank_name()}(으)로 진급했습니다.")
        if self.rank_index == len(config.RANKS) - 1:
            self.finished = "clear"
            return True
        return False

    def ending_text(self):
        when = f"입사 {self.month // 12}년 {self.month % 12}개월"
        if self.finished == "clear":
            return f"{when} 만에 회장 취임!\n신입사원 시절 맨땅에 지은 공항이 그룹의 상징이 되었습니다."
        if self.finished == "fired":
            return f"{when}, 자금이 바닥났습니다...\n인사팀에서 면담 요청이 왔습니다. (해고 엔딩)"
        return f"10년이 흘렀습니다.\n최종 직급: {self.rank_name()}"

    def status_hint(self):
        """비행기가 안 뜨는 이유 (화면 안내용)"""
        if not self.valid_strips():
            return f"활주로를 한 줄로 {self.mods['runway_min_len']}칸 이상 이어서 깔아주세요"
        if sum(self.hangar_caps()) == 0:
            return "활주로 옆에 격납고를 지어주세요"
        if self.beside_valid_runway("gate") == 0:
            return "활주로 옆에 탑승동을 지어주세요 (손님이 비행기를 타는 곳)"
        if self.planes == 0:
            return "비행기를 사주세요"
        if self.zone_level_sum("terminal") == 0:
            return "도로 옆에 여객 터미널 구역을 칠해주세요"
        return ""

    def to_dict(self):
        """웹 버전에 보낼 화면 정보"""
        nxt = self.next_rank()
        zones = [(r, c) for r in range(N) for c in range(N)
                 if self.grid[r][c] and self.grid[r][c].startswith("zone_")]
        return {
            "date": self.date_text(),
            "is_day": self.is_day(),
            "seconds_left": self.seconds_left(),
            "money": int(self.money),
            "rank": self.rank_name(),
            "perf": int(self.perf),
            "next_rank": [nxt[0], nxt[1]] if nxt else None,
            "planes": self.planes,
            "effective_planes": self.effective_planes(),
            "satisfaction": self.satisfaction(),
            "expected_net": int(self.expected_net()),
            "demand": self.demand(),
            "rules": [{"title": r["title"], "desc": r["desc"]} for r in self.active_rules],
            "event_notice": config.EVENT_NOTICE[self.difficulty],
            "grid": self.grid,
            "levels": self.levels,
            "building": [[r, c] for r, c in zones if self.timers[r][c] > 0],
            "no_road": [[r, c] for r, c in zones if not self.has_road(r, c)],
            "tiles": [[sprites.tile_layers(self.grid, self.levels, r, c) for c in range(N)] for r in range(N)],
            "runways": self.runway_strips(),
            "entrance": list(ENTRANCE),
            "income_per_sec": self.income_per_sec(),
            "fleet": self.fleet,
            "operating": self.operating(),
            "valid_runways": self.valid_strips(),
            "plane_types": [{"key": k, "name": v["name"], "price": v["price"], "unlocked": self.plane_unlocked(k),
                             "unlock_year": v["unlock_month"] // 12 + 1} for k, v in config.PLANE_TYPES.items()],
            "status": self.status_hint(),
            "can_fly": self.effective_planes() > 0 and (self.is_day() or self.mods["night_mult"] > 0),
            "currency": config.CURRENCY,
            "land_prices": [[self.land_price(r, c) if self.grid[r][c] is None else None
                             for c in range(N)] for r in range(N)],
            "tools": [
                {"key": z, "name": config.ZONES[z]["name"], "kind": config.ZONES[z]["kind"],
                 "color": config.ZONES[z]["color"], "cost": self.build_cost(z)}
                for z in self.unlocked
            ],
            "build_ok": {z: [[r, c] for r in range(N) for c in range(N) if self.can_build_here(r, c, z)]
                         for z in ("gate", *config.HANGARS)},
            "hangar_kinds": config.HANGARS,
            "finished": self.finished,
            "ending": self.ending_text() if self.finished else None,
        }


def record_result(save, state):
    """판이 끝났을 때 다회차 기록을 갱신한다. 새로 해금된 시설 이름을 돌려준다."""
    new_unlock = None
    if state.finished == "clear":
        if save["clears"] < len(config.UNLOCK_ORDER):
            new_unlock = config.ZONES[config.UNLOCK_ORDER[save["clears"]]]["name"]
        save["clears"] += 1
    save["best_rank"] = max(save["best_rank"], state.rank_index)
    save["history"].append({
        "difficulty": state.difficulty,
        "result": state.finished,
        "rank": state.rank_name(),
        "months": state.month,
    })
    return new_unlock
