# tkinter 화면: 시작 화면(난이도 선택) + 게임 화면(도트 맵, 정보 패널, 로그)
# 게임 계산은 game_state.py, 그림은 sprites.py를 웹 버전과 같이 쓴다.
import random
import tkinter as tk
from tkinter import messagebox

import config
import save_data
import sprites
from game_state import GameState, record_result, money_text

FONT = ("맑은 고딕", 10)
FONT_BOLD = ("맑은 고딕", 11, "bold")
FONT_TITLE = ("맑은 고딕", 20, "bold")
T = config.TILE_PX
N = config.GRID_SIZE
VIEW_W, VIEW_H = 832, 576
BG = "#1b2333"
PANEL = "#26314a"
TEXT = "#eef2ff"
GOLD = "#ffd166"

TOOL_ICON = {"road": "road5", "runway": "runway_h_w", "hangar_light": "hangar_light", "hangar": "hangar",
             "hangar_jumbo": "hangar_jumbo", "gate": "gate_n",
             "zone_terminal": "terminal2_0", "zone_shop": "shop2_0", "zone_shop_premium": "shop_premium2_0", "zone_parking": "parking2",
             "zone_parking_premium": "parking_premium2_0", "tower": "tower",
             "land": "tree0", "demolish": "construction"}
DIRS = ((1, 0), (-1, 0), (0, 1), (0, -1))


def make_image(rows, pal):
    """글자 격자 → tkinter 이미지 (투명 칸은 비워둔다)"""
    w, h = len(rows[0]), len(rows)
    img = tk.PhotoImage(width=w, height=h)
    for y, row in enumerate(rows):
        x = 0
        while x < w:
            if row[x] == ".":
                x += 1
                continue
            start = x
            while x < w and row[x] != ".":
                x += 1
            img.put("{" + " ".join(pal[ch] for ch in row[start:x]) + "}", to=(start, y))
    return img


class App:
    def __init__(self, root):
        self.root = root
        root.title("신입사원 공항 키우기")
        root.configure(bg=BG)
        root.resizable(False, False)
        self.frame = None
        self.after_ids = []
        # 도트 그림 미리 만들기 (낮/밤)
        self.images = {mode: {name: make_image(rows, pal) for name, rows in sprites.SPRITES.items()}
                       for mode, pal in (("day", sprites.PALETTE_DAY), ("night", sprites.PALETTE_NIGHT))}
        self.show_start()

    def clear(self):
        for a in self.after_ids:
            self.root.after_cancel(a)
        self.after_ids = []
        if self.frame:
            self.frame.destroy()

    def label(self, parent, text="", font=FONT, fg=TEXT, **kw):
        return tk.Label(parent, text=text, font=font, fg=fg, bg=parent["bg"], **kw)

    # ── 시작 화면 ──────────────────────────────────
    def show_start(self):
        self.clear()
        data = save_data.load()
        f = self.frame = tk.Frame(self.root, padx=50, pady=24, bg=BG)
        f.pack()

        tk.Label(f, image=self.images["day"]["jumbo_rainbow_n"], bg=BG).pack()
        self.label(f, "신입사원 공항 키우기", FONT_TITLE, GOLD).pack(pady=(0, 5))
        self.label(f, "입구 앞 빈 땅에 공항을 지으며 10년 안에 회장까지!\n단, 회사 규칙은 언제든 바뀔 수 있다...",
                   fg="#9fb0d6").pack(pady=(0, 12))
        best = config.RANKS[data["best_rank"]][0]
        self.label(f, f"플레이 {data['runs']}회 · 클리어 {data['clears']}회 · 최고 직급 {best}").pack()
        unlocked = [config.ZONES[z]["name"] for z in save_data.unlocked_zones(data)]
        self.label(f, "해금 시설: " + (", ".join(unlocked) if unlocked else "없음")).pack()
        if data["clears"] < len(config.UNLOCK_ORDER):
            nxt = config.ZONES[config.UNLOCK_ORDER[data["clears"]]]["name"]
            self.label(f, f"다음 클리어 보상: {nxt}", fg="#d29bff").pack()

        self.label(f, "난이도 선택", FONT_BOLD).pack(pady=(16, 5))
        for name in config.DIFFICULTY:
            row = tk.Frame(f, bg=PANEL, padx=10, pady=8)
            row.pack(fill="x", pady=4)
            tk.Button(row, text=name, width=8, font=FONT_BOLD,
                      command=lambda n=name: self.start_game(n)).pack(side="left", padx=(0, 10))
            self.label(row, config.EVENT_NOTICE[name], fg="#9fb0d6", justify="left",
                       font=("맑은 고딕", 9)).pack(side="left")

    # ── 게임 화면 ──────────────────────────────────
    def start_game(self, difficulty):
        data = save_data.load()
        data["runs"] += 1
        save_data.save(data)

        self.state = GameState(difficulty, data)
        self.speed = 1
        self.speed_ok = save_data.speed_unlocked(data)
        self.paused = False
        self.last_cell = None
        self.shown = {}            # 칸마다 지금 그려진 그림 (바뀐 칸만 다시 그리기)
        self.mode = None           # day / night
        self.fleet = []
        self.lane_lock = {}
        self.gate_busy = {}
        self.popups = []
        self.income_pot = 0.0

        self.clear()
        self.build_game_ui()
        self.refresh()
        # 인트로 → 이벤트 규칙 공지 (창이 뜬 다음에)
        self.after_ids.append(self.root.after(200, lambda: self.show_intro(difficulty)))

    def show_intro(self, difficulty):
        self.paused = True
        messagebox.showinfo(config.INTRO_TITLE, config.INTRO_TEXT, parent=self.root)
        messagebox.showinfo(f"이벤트 규칙 안내 ({difficulty})",
                            config.EVENT_NOTICE[difficulty] + "\n\n" + config.TOWER_NOTICE, parent=self.root)
        self.paused = False
        self.after_ids.append(self.root.after(config.TICK_MS, self.loop))
        self.after_ids.append(self.root.after(50, self.animate))

    def build_game_ui(self):
        f = self.frame = tk.Frame(self.root, bg=BG)
        f.pack(padx=8, pady=8)

        # 왼쪽: 스크롤되는 맵
        mapf = tk.Frame(f, bg=BG)
        mapf.grid(row=0, column=0, sticky="n")
        self.canvas = tk.Canvas(mapf, width=VIEW_W, height=VIEW_H, bg="#4c7f3a", highlightthickness=0,
                                scrollregion=(-64, -64, N * T + 64, N * T + 64))
        sx = tk.Scrollbar(mapf, orient="horizontal", command=self.canvas.xview)
        sy = tk.Scrollbar(mapf, orient="vertical", command=self.canvas.yview)
        self.canvas.configure(xscrollcommand=sx.set, yscrollcommand=sy.set)
        self.canvas.grid(row=0, column=0)
        sy.grid(row=0, column=1, sticky="ns")
        sx.grid(row=1, column=0, sticky="ew")
        self.label(mapf, "✋ 이동 도구로 드래그 · 오른쪽 드래그 · 휠: 화면 이동", fg="#9fb0d6").grid(row=2, column=0)
        self.lbl_status = self.label(mapf, fg="#ff6b6b", font=FONT_BOLD)
        self.lbl_status.grid(row=3, column=0)

        # 바닥 → 물체 순서로 칸마다 그림 아이템 생성 (아래 줄 물체가 위 줄을 가린다)
        self.ground_items = [[self.canvas.create_image(c * T, r * T, anchor="nw") for c in range(N)] for r in range(N)]
        self.object_items = [[self.canvas.create_image(c * T, (r + 1) * T, anchor="sw") for c in range(N)] for r in range(N)]
        ec = config.ENTRANCE_COL
        self.canvas.create_rectangle(ec * T - 26, N * T + 4, ec * T + 58, N * T + 22, fill="#2b2633", outline="")
        self.canvas.create_text(ec * T + T / 2, N * T + 13, text="✈ 공항 입구", fill=GOLD, font=("맑은 고딕", 9, "bold"))
        self.hover_rect = self.canvas.create_rectangle(0, 0, 0, 0, outline="white", width=2, state="hidden")

        self.canvas.bind("<ButtonPress-1>", self.on_press)
        self.canvas.bind("<B1-Motion>", self.on_drag)
        self.canvas.bind("<Motion>", self.on_hover)
        self.canvas.bind("<ButtonPress-3>", lambda e: self.canvas.scan_mark(e.x, e.y))
        self.canvas.bind("<B3-Motion>", lambda e: self.canvas.scan_dragto(e.x, e.y, gain=1))
        self.canvas.bind("<MouseWheel>", lambda e: self.canvas.yview_scroll(-1 if e.delta > 0 else 1, "units"))
        self.canvas.bind("<Shift-MouseWheel>", lambda e: self.canvas.xview_scroll(-1 if e.delta > 0 else 1, "units"))
        # 처음엔 입구가 보이게
        self.canvas.xview_moveto((ec * T - VIEW_W / 2 + 64) / (N * T + 128))
        self.canvas.yview_moveto((N * T - VIEW_H + 120) / (N * T + 128))

        # 오른쪽: 정보 패널
        side = tk.Frame(f, width=340, bg=BG)
        side.grid(row=0, column=1, sticky="n", padx=(10, 0))
        info = tk.Frame(side, bg=PANEL, padx=10, pady=8)
        info.pack(fill="x")
        self.lbl_money = self.label(info, font=("맑은 고딕", 15, "bold"), fg=GOLD, anchor="w")
        self.lbl_money.pack(fill="x")
        self.lbl_date = self.label(info, font=FONT_BOLD, anchor="w")
        self.lbl_date.pack(fill="x")
        self.lbl_rank = self.label(info, anchor="w")
        self.lbl_rank.pack(fill="x")
        self.lbl_stats = self.label(info, anchor="w", justify="left")
        self.lbl_stats.pack(fill="x")

        # 도구 (도트 아이콘)
        tools = tk.LabelFrame(side, text=" 건설 도구 (▦ 구역 = 칠하면 건물이 알아서 올라감) ", font=FONT,
                              bg=PANEL, fg="#9fb0d6", padx=4, pady=4)
        tools.pack(fill="x", pady=6)
        self.tool = tk.StringVar(value="move")
        self.tool_buttons = {}
        self.icons = {}
        keys = ["move", "land"] + self.state.unlocked + ["demolish"]
        for i, k in enumerate(keys):
            kw = {}
            if k != "move":
                img = self.images["day"][TOOL_ICON[k]]
                icon = img.subsample(max(1, img.height() // 32)) if img.height() > 40 else img
                self.icons[k] = icon
                kw = {"image": icon, "compound": "top"}
            rb = tk.Radiobutton(tools, variable=self.tool, value=k, indicatoron=False, width=72, height=64,
                                font=("맑은 고딕", 8), bg="#2f3c5a", fg=TEXT, selectcolor="#3d3a2a",
                                activebackground="#2f3c5a", command=self.refresh, **kw)
            rb.grid(row=i // 4, column=i % 4, padx=2, pady=2)
            self.tool_buttons[k] = rb

        # 비행기 구매 (3종류)
        planes = tk.LabelFrame(side, text=" 비행기 구매 (격납고 1칸 = 1대) ", font=FONT, bg=PANEL, fg="#9fb0d6",
                               padx=4, pady=4)
        planes.pack(fill="x")
        self.plane_buttons = {}
        for i, kind in enumerate(config.PLANE_TYPES):
            icon = self.images["day"][f"{kind}_sky_n"]
            self.icons["plane_" + kind] = icon
            b = tk.Button(planes, image=icon, compound="top", width=96, font=("맑은 고딕", 8),
                          command=lambda k=kind: self.on_buy_plane(k))
            b.grid(row=0, column=i, padx=2)
            self.plane_buttons[kind] = b

        btns = tk.Frame(side, bg=BG)
        btns.pack(fill="x", pady=6)
        self.btn_pause = tk.Button(btns, font=FONT, width=10, command=self.toggle_pause)
        self.btn_pause.pack(side="left")
        self.btn_speed = tk.Button(btns, font=FONT, command=self.toggle_speed,
                                   state="normal" if self.speed_ok else "disabled")
        self.btn_speed.pack(side="left", padx=4)

        self.lbl_demand = self.label(side, anchor="w", fg="#9fb0d6")
        self.lbl_demand.pack(fill="x")
        self.lbl_hover = self.label(side, anchor="w", fg="#9fb0d6", justify="left", wraplength=330)
        self.lbl_hover.pack(fill="x")
        self.lbl_rule = self.label(side, anchor="w", justify="left", fg="#ff6b6b", wraplength=330)
        self.lbl_rule.pack(fill="x", pady=(2, 5))
        self.log_box = tk.Text(side, width=46, height=7, font=("맑은 고딕", 9), wrap="word", state="disabled",
                               bg=PANEL, fg=TEXT, relief="flat")
        self.log_box.pack(fill="both")

    # ── 입력 처리 ──────────────────────────────────
    def cell_at(self, event):
        x, y = self.canvas.canvasx(event.x), self.canvas.canvasy(event.y)
        r, c = int(y // T), int(x // T)
        if 0 <= r < N and 0 <= c < N:
            return r, c
        return None

    def on_press(self, event):
        if self.tool.get() == "move":              # 이동 도구: 드래그로 화면 이동
            self.canvas.scan_mark(event.x, event.y)
            return
        self.on_click(event, drag=False)

    def on_drag(self, event):
        if self.tool.get() == "move":
            self.canvas.scan_dragto(event.x, event.y, gain=1)
            return
        self.on_click(event, drag=True)

    def on_click(self, event, drag):
        cell = self.cell_at(event)
        if cell is None or (drag and cell == self.last_cell):
            return
        self.last_cell = cell
        r, c = cell
        tool = self.tool.get()
        if tool == "land":
            ok, msg = self.state.buy_land(r, c)
        elif tool == "demolish":
            ok, msg = self.state.demolish(r, c)
        else:
            ok, msg = self.state.build(r, c, tool)
        if not ok and msg and not drag:   # 드래그 중 실패 메시지는 도배되니까 생략
            self.state.log(msg)
        self.refresh()

    def on_hover(self, event):
        cell = self.cell_at(event)
        if cell is None:
            self.canvas.itemconfig(self.hover_rect, state="hidden")
            return
        r, c = cell
        self.canvas.coords(self.hover_rect, c * T + 1, r * T + 1, c * T + T - 1, r * T + T - 1)
        self.canvas.itemconfig(self.hover_rect, state="normal")
        self.canvas.tag_raise(self.hover_rect)
        s = self.state
        v = s.grid[r][c]
        if v is None:
            text = f"미구매 땅 · {money_text(s.land_price(r, c))}"
        elif v == "empty":
            text = "빈 땅"
        elif v.startswith("zone_"):
            lv = s.levels[r][c]
            name = config.ZONES[v]["name"]
            if not s.has_road(r, c):
                text = (f"{name} · ⚠ 도로와 연결되지 않았어요!\n"
                        "입구에서 이어진 도로 바로 옆에 있어야 건물이 올라와요.")
            elif lv <= 0:
                text = f"{name} · " + ("공사 중..." if s.timers[r][c] else "수요 대기 중")
            else:
                text = f"{name} · Lv{lv}" + (" (확장 공사 중)" if s.timers[r][c] else "")
        else:
            text = config.ZONES[v]["name"]
        self.lbl_hover.config(text=text)

    def on_buy_plane(self, kind):
        ok, msg = self.state.buy_plane(kind)
        if not ok:
            self.state.log(msg)
        self.refresh()

    def toggle_pause(self):
        self.paused = not self.paused
        self.refresh()

    def toggle_speed(self):
        self.speed = 2 if self.speed == 1 else 1
        self.refresh()

    # ── 화면 갱신 ──────────────────────────────────
    def refresh(self):
        s = self.state
        left = s.seconds_left()
        daynight = "낮 ☀" if s.is_day() else "밤 ☾"
        self.lbl_money.config(text=money_text(s.money))
        self.lbl_date.config(text=f"{s.date_text()} · {daynight} · 남은 {left // 60}:{left % 60:02d}"
                                  + ("  [일시정지]" if self.paused else ""))
        nxt = s.next_rank()
        goal = f" / {nxt[0]} {nxt[1]:,}" if nxt else ""
        self.lbl_rank.config(text=f"직급 {s.rank_name()} · 성과 {int(s.perf):,}{goal}")
        self.lbl_stats.config(text=f"✈ {s.planes}대 (운항 {s.effective_planes()}) · 만족도 {s.satisfaction()}\n"
                                   f"월 예상 순이익 {int(s.expected_net()):+,} {config.CURRENCY}")
        hint = s.status_hint()
        self.lbl_status.config(text=f"⚠ {hint}" if hint else "")
        d = s.demand()
        self.lbl_demand.config(text="건물 수요  " + "  ".join(
            f"{n} {'▲' if d[k] > 0 else '-'}" for k, n in (("terminal", "터미널"), ("shop", "상업"),
                                                          ("shop_premium", "고급"), ("parking", "주차"),
                                                          ("parking_premium", "타워"))
            if "zone_" + k in s.unlocked))
        self.lbl_rule.config(text="\n".join(f"⚠ {r['title']}: {r['desc']}" for r in s.active_rules)
                             if s.active_rules else "바뀐 규칙: 아직 없음")
        for k, rb in self.tool_buttons.items():
            if k == "move":
                text = "✋\n이동"
            elif k == "land":
                text = "땅 구매"
            elif k == "demolish":
                text = "철거"
            else:
                cost = s.build_cost(k)
                text = f"{'▦' if config.ZONES[k]['kind'] == 'zone' else ''}{config.ZONES[k]['name']}\n" \
                       f"{'무료 1개' if cost == 0 else money_text(cost)}"
            rb.config(text=text)
        for kind, b in self.plane_buttons.items():
            info = config.PLANE_TYPES[kind]
            if s.plane_unlocked(kind):
                b.config(state="normal", text=f"{info['name']}\n{money_text(info['price'])} · 보유 {s.fleet[kind]}")
            else:
                b.config(state="disabled", text=f"{info['name']}\n{info['unlock_month'] // 12 + 1}년 차부터")
        self.btn_pause.config(text="▶ 재개" if self.paused else "❚❚ 일시정지")
        self.btn_speed.config(text=f"{self.speed}배속" if self.speed_ok else "2배속(2회차~)")
        self.canvas.config(cursor="fleur" if self.tool.get() == "move" else "crosshair")
        self.draw_map()

        # 로그
        if s.messages:
            self.log_box.config(state="normal")
            for m in s.messages:
                self.log_box.insert("end", m + "\n")
            self.log_box.see("end")
            self.log_box.config(state="disabled")
            s.messages.clear()

        # 규칙 변경 팝업
        while s.popups:
            title, text = s.popups.pop(0)
            messagebox.showwarning(title, text, parent=self.root)

    def draw_map(self):
        s = self.state
        mode = "day" if s.is_day() else "night"
        imgs = self.images[mode]
        redraw_all = mode != self.mode
        self.mode = mode
        if redraw_all:
            self.canvas.config(bg="#4c7f3a" if mode == "day" else "#0d1426")
        for r in range(N):
            for c in range(N):
                layers = sprites.tile_layers(s.grid, s.levels, r, c)
                if redraw_all or self.shown.get((r, c)) != layers:
                    self.shown[(r, c)] = layers
                    self.canvas.itemconfig(self.ground_items[r][c], image=imgs[layers[0]])
                    self.canvas.itemconfig(self.object_items[r][c], image=imgs[layers[1]] if layers[1] else "")

        # 설치 안내: 격납고/탑승동은 활주로 옆 칸이 빛난다
        self.canvas.delete("guide")
        tool = self.tool.get()
        if tool == "gate" or tool in config.HANGARS:
            for r in range(N):
                for c in range(N):
                    if s.can_build_here(r, c, tool):
                        self.canvas.create_rectangle(c * T + 2, r * T + 2, c * T + T - 2, r * T + T - 2,
                                                     outline=GOLD, width=2, fill=GOLD, stipple="gray50", tags="guide")
        # 도로 연결 안 된 구역 경고
        for r in range(N):
            for c in range(N):
                v = s.grid[r][c]
                if v and v.startswith("zone_") and not s.has_road(r, c):
                    self.canvas.create_rectangle(c * T + 10, r * T - 4, c * T + 22, r * T + 10,
                                                 fill="#ff6b6b", outline="#2b2633", tags="guide")
                    self.canvas.create_text(c * T + 16, r * T + 3, text="!", fill="white",
                                            font=("맑은 고딕", 9, "bold"), tags="guide")

    # ── 비행기 / 수익 애니메이션 (50ms마다) ─────────
    def route_for(self, p):
        """격납고 옆 활주로, 같은 활주로의 탑승동, 차선 위치"""
        s = self.state
        valid = s.valid_strips()
        h = p["hangar"]
        for dr, dc in DIRS:
            rr, rc = h[0] + dr, h[1] + dc
            if not (0 <= rr < N and 0 <= rc < N) or s.grid[rr][rc] != "runway":
                continue
            for st in valid:
                r0, c0, r1, c1 = st
                if not (r0 <= rr <= r1 and c0 <= rc <= c1):
                    continue
                horiz = r0 == r1
                along = (lambda r, c: c * T + T / 2) if horiz else (lambda r, c: r * T + T / 2)
                gate = None
                for gr, gc in s.cells("gate"):
                    if self.gate_busy.get((gr, gc), p) is not p:     # 다른 비행기가 붙은 탑승동은 건너뜀
                        continue
                    for nr, nc in ((gr + a, gc + b) for a, b in DIRS):
                        if r0 <= nr <= r1 and c0 <= nc <= c1:
                            dist = abs(along(nr, nc) - along(rr, rc))
                            if gate is None or dist < gate[1]:
                                gate = (along(nr, nc), dist, (gr, gc))
                if gate is None:
                    return None
                ry, rx = rr * T + T / 2, rc * T + T / 2
                return {"id": st, "horiz": horiz, "len": s.strip_len(st),
                        "H": (h[1] * T + T / 2, h[0] * T + T / 2), "stop": along(rr, rc), "gate": gate[0],
                        "gate_cell": gate[2],
                        "lane0": ry - 7 if horiz else rx + 7, "lane1": ry + 7 if horiz else rx - 7,
                        "end": (c1 + 1) * T if horiz else (r1 + 1) * T}
        return None

    @staticmethod
    def lane_point(route, along, lane):
        return (along, route[lane]) if route["horiz"] else (route[lane], along)

    def sync_fleet(self):
        """엔진의 종류별 보유 대수와 화면의 비행기를 맞춘다 (비행기는 크기에 맞는 격납고에)"""
        s = self.state
        hangars = [(r, c, kind) for kind in config.HANGARS for r, c in s.cells(kind)]
        cells = {(r, c) for r, c, _ in hangars}
        for p in self.fleet[:]:
            if p["hangar"] not in cells and p["state"] != "away":
                self.remove_plane(p)
        for kind in ("jumbo", "mid", "light"):
            mine = [p for p in self.fleet if p["type"] == kind]
            while len(mine) > s.fleet[kind]:
                self.remove_plane(mine.pop())
            used = {p["hangar"] for p in self.fleet}
            free = sorted((config.PLANE_SIZE[config.HANGARS[hk]], (r, c), hk) for r, c, hk in hangars
                          if (r, c) not in used and config.PLANE_SIZE[config.HANGARS[hk]] >= config.PLANE_SIZE[kind])
            for _, cell, hk in free:
                if len(mine) >= s.fleet[kind]:
                    break
                p = {"type": kind, "hangar": cell, "hangar_kind": hk, "livery": random.choice(sprites.LIVERIES),
                     "state": "parked", "wait": random.uniform(1, 4), "segs": [], "t": 0, "dir": "e",
                     "x": 0, "y": 0, "alt": 0, "items": None}
                self.fleet.append(p)
                mine.append(p)

    def remove_plane(self, p):
        if p["items"]:
            for it in p["items"]:
                self.canvas.delete(it)
        self.fleet.remove(p)
        for table in (self.lane_lock, self.gate_busy):
            for k, v in list(table.items()):
                if v is p:
                    del table[k]

    def start_flight(self, p, route, kind):
        lane = "lane0" if kind == "takeoff" else "lane1"
        lock = (route["id"], lane)
        if kind == "landing":               # 착륙 차선엔 한 대씩만 (충돌 방지)
            if lock in self.lane_lock:
                return False
            self.lane_lock[lock] = p
        lp = lambda a: self.lane_point(route, a, lane)
        release = lambda: self.lane_lock.pop(lock, None)
        gk = route["gate_cell"]
        self.gate_busy[gk] = p
        leave_gate = lambda: self.gate_busy.pop(gk, None)
        taxi = abs(route["gate"] - route["stop"]) / 45 + .2
        roll = abs(route["end"] - route["gate"])
        if kind == "takeoff":   # 격납고 → 탑승동(탑승) → 가속 → 이륙
            p["segs"] = [(route["H"], lp(route["stop"]), 1.6, "lin", 0, 0, None),
                         (lp(route["stop"]), lp(route["gate"]), taxi, "lin", 0, 0, None),
                         (lp(route["gate"]), lp(route["gate"]), 2.2, "lin", 0, 0, leave_gate),
                         (lp(route["gate"]), lp(route["end"]), max(1.4, (roll / 40) ** .5), "in", 0, 0, release, lock),
                         (lp(route["end"]), lp(route["end"] + 700), 4, "lin", 0, 160, None)]
        else:                   # 착륙 → 탑승동(하차) → 격납고
            p["segs"] = [(lp(route["end"] + 650), lp(route["end"]), 4, "lin", 160, 0, None),
                         (lp(route["end"]), lp(route["gate"]), max(1.2, (roll / 30) ** .5), "out", 0, 0, None),
                         (lp(route["gate"]), lp(route["gate"]), 2.2, "lin", 0, 0, leave_gate),
                         (lp(route["gate"]), lp(route["stop"]), taxi, "lin", 0, 0, release),
                         (lp(route["stop"]), route["H"], 1.6, "lin", 0, 0, None)]
        p["state"], p["t"] = kind, 0
        return True

    def animate(self):
        self.after_ids.append(self.root.after(50, self.animate))
        if self.paused:
            return
        dt = 0.05 * self.speed
        s = self.state
        imgs = self.images[self.mode or "day"]
        self.sync_fleet()
        operating = s.operating()
        active = {k: 0 for k in config.PLANE_TYPES}
        for p in self.fleet:
            if p["state"] != "parked":
                active[p["type"]] += 1
        can_fly = s.effective_planes() > 0 and (s.is_day() or s.mods["night_mult"] > 0)
        self.canvas.delete("parked")
        for p in self.fleet:
            if p["state"] in ("parked", "away"):
                if p["state"] == "parked":
                    r, c = p["hangar"]
                    self.canvas.create_image(c * T, (r + 1) * T, anchor="sw", image=imgs[p["hangar_kind"] + "_closed"],
                                             tags="parked")
                self.hide_plane(p)
                p["wait"] -= dt
                if p["wait"] > 0:
                    continue
                route = self.route_for(p)
                long_ok = p["type"] != "jumbo" or (route and route["len"] >= config.JUMBO_RUNWAY_LEN)
                if p["state"] == "parked":
                    if (route and long_ok and can_fly and active[p["type"]] < operating[p["type"]]
                            and self.start_flight(p, route, "takeoff")):
                        active[p["type"]] += 1
                    else:
                        p["wait"] = random.uniform(1, 3)
                elif not route:
                    p["state"], p["wait"] = "parked", 3
                elif not self.start_flight(p, route, "landing"):
                    p["wait"] = random.uniform(1, 2)
                continue
            cur = p["segs"][0] if p["segs"] else None
            if cur and len(cur) > 7 and not p.get("got"):     # 이륙 활주는 차선이 빌 때까지 대기
                if self.lane_lock.get(cur[7], p) is not p:
                    continue
                self.lane_lock[cur[7]] = p
                p["got"] = True
            p["t"] += dt
            while p["segs"] and p["t"] >= p["segs"][0][2]:
                if len(p["segs"][0]) > 7:
                    p["got"] = False
                p["t"] -= p["segs"][0][2]
                if p["segs"][0][6]:
                    p["segs"][0][6]()
                p["segs"].pop(0)
            if not p["segs"]:
                p["state"], p["wait"] = ("away", random.uniform(6, 14)) if p["state"] == "takeoff" else ("parked", random.uniform(3, 8))
                continue
            a, b, dur, ease, alt0, alt1 = p["segs"][0][:6]
            u = p["t"] / dur
            u = u * u if ease == "in" else 1 - (1 - u) ** 2 if ease == "out" else u
            dx, dy = b[0] - a[0], b[1] - a[1]
            p["x"], p["y"], p["alt"] = a[0] + dx * u, a[1] + dy * u, alt0 + (alt1 - alt0) * u
            if abs(dx) + abs(dy) > 1:
                p["dir"] = ("e" if dx > 0 else "w") if abs(dx) > abs(dy) else ("s" if dy > 0 else "n")
            self.draw_plane(p, imgs)

        # 수익 팝업 (+12)
        self.income_pot += s.income_per_sec() * dt
        if random.random() < 0.04 and self.income_pot >= 1:
            earners = [(r, c) for r in range(N) for c in range(N)
                       if s.grid[r][c] in ("zone_terminal", "zone_shop") and s.levels[r][c] > 0]
            if earners:
                v = int(self.income_pot)
                self.income_pot -= v
                r, c = random.choice(earners)
                item = self.canvas.create_text(c * T + T / 2, r * T - 8, text=f"● +{v}", fill=GOLD,
                                               font=("맑은 고딕", 10, "bold"))
                self.popups.append([item, 0])
        for pop in self.popups[:]:
            pop[1] += 1
            self.canvas.move(pop[0], 0, -1)
            if pop[1] > 25:
                self.canvas.delete(pop[0])
                self.popups.remove(pop)

    def draw_plane(self, p, imgs):
        if not p["items"]:
            p["items"] = (self.canvas.create_image(0, 0, tags="plane"), self.canvas.create_image(0, 0, tags="plane"))
        shadow, plane = p["items"]
        alt = p["alt"]
        self.canvas.itemconfig(shadow, image=imgs[f"{p['type']}shadow_{p['dir']}"] if alt >= 1 else "")
        self.canvas.coords(shadow, p["x"] + alt * .25, p["y"] + alt * .15)
        self.canvas.itemconfig(plane, image=imgs[f"{p['type']}_{p['livery']}_{p['dir']}"])
        self.canvas.coords(plane, p["x"], p["y"] - alt * .5)
        self.canvas.tag_raise(shadow)
        self.canvas.tag_raise(plane)

    def hide_plane(self, p):
        if p["items"]:
            for it in p["items"]:
                self.canvas.itemconfig(it, image="")

    def loop(self):
        if not self.paused:
            self.state.tick()
        self.refresh()
        if self.state.finished:
            self.end_game()
            return
        self.after_ids.append(self.root.after(config.TICK_MS // self.speed, self.loop))

    def end_game(self):
        s = self.state
        data = save_data.load()
        new_unlock = record_result(data, s)
        save_data.save(data)

        text = s.ending_text()
        if new_unlock:
            text += f"\n\n회차 보상 해금: {new_unlock}! (다음 판에 1개 무료)"
        title = {"clear": "회장 취임!", "fired": "게임 오버", "timeout": "10년 결산"}[s.finished]
        messagebox.showinfo(title, text, parent=self.root)
        self.show_start()
