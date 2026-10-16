# 도트(픽셀아트) 그래픽 - 카이로소프트풍 3/4 시점, 1칸 = 32x32 픽셀
# 그림은 코드로 "찍어서" 만든다. 글자 하나 = 픽셀 하나, "." = 투명.
#  - 바닥(ground): 32x32, 칸을 꽉 채운다
#  - 물체(object): 가로 32, 세로 32 이상. 칸 아래쪽에 맞춰 그리고 위로 솟은 부분은 뒤 칸과 겹친다
# tkinter 버전과 웹 버전이 이 파일 하나를 같이 쓴다.
import math
import random

S = 32

PALETTE_DAY = {
    # 잔디 / 들판 / 나무 / 꽃
    "g": "#7ccf4a", "G": "#66b83a", "y": "#a4e36f",
    "f": "#5f9e47", "F": "#528b3d", "Y": "#72ad55",
    "T": "#48b04c", "t": "#2f8a3e", "j": "#7fd96f", "n": "#8a5a32", "N": "#6b4325",
    "1": "#ffffff", "2": "#ff9ec7", "3": "#ffe066", "4": "#ff7043",
    # 아스팔트 / 콘크리트 / 흙
    "a": "#5c5f6b", "A": "#4a4d58", "i": "#6c707d", "x": "#f4f4f4",
    "c": "#d3d6db", "C": "#b9bdc4", "d": "#e6e8ec", "l": "#f2c94c",
    "D": "#c8a26b", "L": "#a8844f",
    # 건물
    "e": "#fff4dc", "E": "#ead5ab", "K": "#cdb184", "k": "#2b2633",
    "m": "#5b8def", "M": "#3f6cc4", "z": "#a9c8ff",
    "b": "#5aa9e6", "s": "#c4e8ff", "B": "#2c4a7a",
    "q": "#a9b8c9", "Q": "#8193a9", "v": "#d5dee8",
    "p": "#ff8fb8", "P": "#ec407a", "Z": "#ffc107",
    # 색
    "w": "#ffffff", "W": "#d7dde5", "X": "#9aa3ad",
    "r": "#ef5350", "R": "#ff3b3b", "u": "#4f86f7", "U": "#24489c",
    "o": "#ffa726", "O": "#e07b00", "5": "#66bb6a", "6": "#9575cd",
    "S": "#8fd0f2",
    "H": "#26a69a", "J": "#00796b", "7": "#a5e4d9",               # 청록
    "V": "#8d6e63", "I": "#5d4037", "9": "#ffcc80", "8": "#2e7d32",   # 갈색 / 살구 / 짙은 초록
    "h": "#000000",   # 그림자
}

# 밤에도 밝게 빛나는 색 (창문 불빛, 유도등, 경고등)
NIGHT_GLOW = {"b": "#ffd86b", "s": "#fff1b8", "x": "#ffe066", "R": "#ff4d4d"}


def _night(color):
    """색을 어둡고 푸르게"""
    r, g, b = (int(color[i:i + 2], 16) for i in (1, 3, 5))
    r, g, b = int(r * 0.4 + 10), int(g * 0.4 + 12), int(b * 0.45 + 45)
    return f"#{min(r, 255):02x}{min(g, 255):02x}{min(b, 255):02x}"


PALETTE_NIGHT = {k: NIGHT_GLOW.get(k, _night(v)) for k, v in PALETTE_DAY.items()}


# ── 도트 찍기 도구 ─────────────────────────────────
class Pix:
    def __init__(self, w=S, h=S, fill="."):
        self.w, self.h = w, h
        self.g = [[fill] * w for _ in range(h)]

    @classmethod
    def from_rows(cls, rows):
        p = cls(len(rows[0]), len(rows))
        p.g = [list(r) for r in rows]
        return p

    def px(self, x, y, ch):
        if 0 <= x < self.w and 0 <= y < self.h:
            self.g[y][x] = ch

    def get(self, x, y):
        return self.g[y][x] if 0 <= x < self.w and 0 <= y < self.h else "."

    def rect(self, x, y, w, h, ch):
        for yy in range(y, y + h):
            for xx in range(x, x + w):
                self.px(xx, yy, ch)

    def box(self, x, y, w, h, ch):
        """테두리만"""
        self.rect(x, y, w, 1, ch)
        self.rect(x, y + h - 1, w, 1, ch)
        self.rect(x, y, 1, h, ch)
        self.rect(x + w - 1, y, 1, h, ch)

    def poly(self, pts, ch):
        for y in range(self.h):
            for x in range(self.w):
                if _inside(x + .5, y + .5, pts):
                    self.px(x, y, ch)

    def stamp(self, rows, x0, y0, table=None):
        for dy, row in enumerate(rows):
            for dx, ch in enumerate(row):
                if ch != ".":
                    self.px(x0 + dx, y0 + dy, (table or {}).get(ch, ch))

    def outline(self, ch="k"):
        """그림 둘레에 외곽선"""
        add = []
        for y in range(self.h):
            for x in range(self.w):
                if self.g[y][x] == "." and any(
                        self.get(x + dx, y + dy) not in (".", "h")
                        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))):
                    add.append((x, y))
        for x, y in add:
            self.g[y][x] = ch

    def rows(self):
        return ["".join(r) for r in self.g]


def _inside(px, py, pts):
    inside = False
    for i in range(len(pts)):
        (x1, y1), (x2, y2) = pts[i], pts[i - 1]
        if (y1 > py) != (y2 > py) and px < (x2 - x1) * (py - y1) / (y2 - y1) + x1:
            inside = not inside
    return inside


def _flip(rows):
    return [row[::-1] for row in rows]


def _transpose(rows):
    return ["".join(rows[y][x] for y in range(len(rows))) for x in range(len(rows[0]))]


def _rot_ccw(rows):
    n = len(rows)
    return ["".join(rows[c][n - 1 - r] for c in range(n)) for r in range(n)]


def _rot_cw(rows):
    n = len(rows)
    return ["".join(rows[n - 1 - c][r] for c in range(n)) for r in range(n)]


def _recolor(rows, table):
    return ["".join(table.get(ch, ch) for ch in row) for row in rows]


# ── 바닥 ───────────────────────────────────────────
def _grass(seed, flowers):
    rnd = random.Random(seed)
    p = Pix(fill="g")
    for _ in range(14):                       # 풀잎
        x, y = rnd.randrange(1, 31), rnd.randrange(2, 31)
        p.px(x, y, "G")
        p.px(x, y - 1, "y" if rnd.random() < .5 else "G")
        if rnd.random() < .5:
            p.px(x + 1, y, "G")
    for _ in range(6):                        # 밝은 점
        p.px(rnd.randrange(32), rnd.randrange(32), "y")
    for _ in range(flowers):                  # 꽃
        x, y, col = rnd.randrange(3, 29), rnd.randrange(3, 29), rnd.choice("1234")
        for dx, dy in ((0, -1), (-1, 0), (1, 0), (0, 1)):
            p.px(x + dx, y + dy, col)
        p.px(x, y, "3" if col != "3" else "o")
        p.px(x, y + 2, "G")
    return p.rows()


WILD = {"g": "f", "G": "F", "y": "Y", "1": "Y", "2": "Y", "3": "Y", "4": "Y", "o": "Y"}


def _runway(end=False):
    """가로 활주로. 위/아래 2차선, 가운데 점선, 가장자리 유도등. end=True면 왼쪽 끝 표시"""
    rnd = random.Random(7)
    p = Pix(fill="a")
    for _ in range(40):
        p.px(rnd.randrange(32), rnd.randrange(3, 29), "i")
    p.rect(0, 0, 32, 2, "A")
    p.rect(0, 30, 32, 2, "A")
    p.rect(0, 2, 32, 1, "w")
    p.rect(0, 29, 32, 1, "w")
    for x in range(3, 32, 8):                 # 유도등
        p.rect(x, 4, 2, 1, "x")
        p.rect(x, 27, 2, 1, "x")
    for x in range(2, 32, 16):                # 가운데 점선 (차선 구분)
        p.rect(x, 15, 10, 2, "w")
    if end:                                   # 활주로 끝 줄무늬
        p.rect(0, 3, 14, 26, "a")
        for y in range(5, 27, 4):
            p.rect(2, y, 10, 2, "w")
        p.rect(13, 3, 1, 26, "w")
    return p.rows()


def _road(mask):
    """도로. mask 비트: 1=위, 2=오른쪽, 4=아래, 8=왼쪽 으로 이어짐"""
    rnd = random.Random(11)
    p = Pix(fill="a")
    for _ in range(30):
        p.px(rnd.randrange(32), rnd.randrange(32), "i")
    up, right, down, left = (mask & 1, mask & 2, mask & 4, mask & 8)
    # 이어지지 않은 쪽은 인도
    if not up:
        p.rect(0, 0, 32, 5, "c"); p.rect(0, 5, 32, 1, "C")
    if not down:
        p.rect(0, 27, 32, 5, "c"); p.rect(0, 26, 32, 1, "C")
    if not left:
        p.rect(0, 0, 5, 32, "c"); p.rect(5, 0 if up else 5, 1, 32 - (0 if up else 5) - (0 if down else 5), "C")
    if not right:
        p.rect(27, 0, 5, 32, "c"); p.rect(26, 0 if up else 5, 1, 32 - (0 if up else 5) - (0 if down else 5), "C")
    for x, y in ((0, 0), (27, 0), (0, 27), (27, 27)):   # 모서리 인도
        p.rect(x, y, 5, 5, "c")
    for x in range(1, 32, 6):                            # 인도 무늬
        for y in range(1, 32, 6):
            if p.get(x, y) == "c":
                p.px(x, y, "d")
    # 노란 중앙선 (이어진 쪽으로만)
    if up:
        for y in range(1, 12, 5): p.rect(15, y, 2, 3, "l")
    if down:
        for y in range(20, 31, 5): p.rect(15, y, 2, 3, "l")
    if left:
        for x in range(1, 12, 5): p.rect(x, 15, 3, 2, "l")
    if right:
        for x in range(20, 31, 5): p.rect(x, 15, 3, 2, "l")
    if mask in (5, 10):                                   # 직선 도로는 가운데도 이어서
        if mask == 5: p.rect(15, 15, 2, 3, "l")
        else: p.rect(15, 15, 3, 2, "l")
    return p.rows()


def _plaza():
    p = Pix(fill="c")
    for x in range(0, 32, 16):
        p.rect(x, 0, 1, 32, "C")
    for y in range(0, 32, 16):
        p.rect(0, y, 32, 1, "C")
    for x, y in ((3, 3), (19, 19), (20, 4), (5, 21)):
        p.px(x, y, "d")
    return p.rows()


def _zone(color):
    """구역만 지정된 빈 땅: 잔디 위에 구역 색 점선 테두리"""
    p = Pix.from_rows(_grass(99, 0))
    for i in range(2, 30):
        if (i // 3) % 2 == 0:
            for x, y in ((i, 2), (i, 29), (2, i), (29, i)):
                p.px(x, y, color)
    return p.rows()


CAR = [
    ".kkkk.",
    "kXXXXk",
    "kBssBk",
    "kXXXXk",
    "kXXXXk",
    "kXwwXk",
    "kXXXXk",
    ".kkkk.",
]


def _parking(level):
    p = Pix(fill="a")
    rnd = random.Random(level)
    for _ in range(25):
        p.px(rnd.randrange(32), rnd.randrange(32), "i")
    for x in range(0, 33, 8):                 # 주차선
        p.rect(x, 0, 1, 11, "w")
        p.rect(x, 21, 1, 11, "w")
    for x in range(2, 32, 6):
        p.rect(x, 15, 3, 1, "W")              # 통로 점선
    # 차는 화면에서 실제로 들어와 주차한다 (Lv1 = 위 4칸, Lv2 = 8칸)
    if level == 1:
        p.rect(0, 20, 32, 12, "c")             # 아래쪽은 아직 공사 전 인도
        p.rect(0, 20, 32, 1, "C")
    else:
        for x in (0, 31):                      # 가로등
            p.rect(x, 12, 1, 8, "X")
        p.px(1, 12, "3")
        p.px(30, 12, "3")
    return p.rows()


# ── 물체: 나무 / 공사장 ─────────────────────────────
def _tree(kind):
    p = Pix(32, 40)
    if kind == 0:                              # 동글동글 나무
        p.poly([(16 + 12 * math.cos(a / 10 * math.tau), 15 + 11 * math.sin(a / 10 * math.tau)) for a in range(10)], "T")
        p.poly([(16 + 12 * math.cos(a / 10 * math.tau), 17 + 9 * math.sin(a / 10 * math.tau)) for a in range(5, 11)] + [(28, 17)], "t")
        for x, y in ((10, 9), (11, 8), (12, 8), (9, 10), (10, 10), (14, 6), (15, 6)):
            p.px(x, y, "j")
        p.rect(14, 26, 4, 9, "n")
        p.rect(16, 26, 2, 9, "N")
    else:                                      # 뾰족 나무
        for i, top in enumerate((4, 11, 18)):
            w = 7 + i * 3
            p.poly([(16, top), (16 + w, top + 11), (16 - w, top + 11)], "T")
            p.poly([(16, top + 4), (16 + w, top + 11), (16, top + 11)], "t")
            p.px(14, top + 3, "j")
        p.rect(14, 29, 4, 6, "n")
        p.rect(16, 29, 2, 6, "N")
    p.outline()
    for x in range(8, 25):                     # 바닥 그림자 (체크무늬)
        if x % 2 == 0:
            p.px(x, 36, "h")
    return p.rows()


def _construction():
    p = Pix(32, 48)
    p.rect(0, 16, 32, 32, "D")
    rnd = random.Random(3)
    for _ in range(30):
        p.px(rnd.randrange(32), rnd.randrange(16, 48), "L")
    p.rect(6, 30, 20, 12, "q")                  # 쌓아둔 자재
    p.rect(6, 30, 20, 2, "v")
    p.box(6, 30, 20, 12, "k")
    for x in range(8, 24, 4):
        p.rect(x, 33, 1, 8, "Q")
    p.rect(4, 4, 2, 28, "Z")                    # 크레인
    for y in range(6, 30, 4):
        p.px(5, y, "O")
    p.rect(4, 4, 24, 2, "Z")
    p.rect(26, 6, 1, 10, "X")
    p.rect(24, 16, 5, 3, "X")
    p.box(3, 3, 4, 30, "k")
    for x in range(0, 32):                     # 공사 펜스
        p.px(x, 44, "o" if (x // 3) % 2 == 0 else "w")
        p.px(x, 45, "k")
    p.rect(0, 43, 32, 1, "k")
    return p.rows()


# ── 물체: 건물 ─────────────────────────────────────
def _glass(p, x0, y0, w, h, mullion=4):
    """유리창 (밤에 불이 켜진다)"""
    p.rect(x0, y0, w, h, "b")
    for x in range(x0, x0 + w, mullion):
        p.rect(x, y0, 1, h, "B")
    p.rect(x0, y0, w, 1, "B")
    for i in range(0, w, mullion):             # 반사광
        p.px(x0 + i + 1, y0 + 1, "s")
        p.px(x0 + i + 2, y0 + 1, "s")
        p.px(x0 + i + 1, y0 + 2, "s")


def _building(height, wall_top, roof, roof_dark, roof_hi, wall="e", wall_dark="E"):
    """3/4 시점 기본 건물: 위는 지붕, 아래는 벽, 맨 아래 6줄은 앞마당"""
    p = Pix(32, height)
    base = height - 6
    p.rect(0, base, 32, 6, "c")                 # 앞마당
    p.rect(0, base, 32, 1, "C")
    p.rect(1, 2, 30, wall_top - 2, roof)        # 지붕
    p.rect(1, 2, 30, 1, roof_hi)
    p.rect(1, wall_top - 2, 30, 2, roof_dark)
    p.rect(1, wall_top, 30, base - wall_top, wall)   # 벽
    p.rect(27, wall_top, 4, base - wall_top, wall_dark)
    p.box(0, 1, 32, base, "k")
    p.rect(0, wall_top - 1, 32, 1, "k")
    return p, base


TERMINAL_SCHEMES = [   # (지붕, 지붕 그늘, 지붕 하이라이트, 포인트색, 벽, 벽 그늘)
    ("m", "M", "z", "U", "e", "E"),     # 파랑
    ("H", "J", "7", "8", "w", "W"),     # 청록
    ("o", "O", "9", "I", "e", "E"),     # 주황
]


def _terminal(level, v=0):
    roof, roof_d, roof_h, accent, wall, wall_d = TERMINAL_SCHEMES[v]
    if level == 1:
        p, base = _building(44, 14, roof, roof_d, roof_h, wall, wall_d)
        _glass(p, 3, 17, 26, 8, 4 + v)
        p.rect(11, 28, 10, base - 28, "B")      # 자동문
        p.rect(12, 29, 8, base - 29, "s")
        p.rect(16, 29, 1, base - 29, "B")
        p.rect(1, 26, 30, 1, accent)
        if v == 1:                               # 지붕 위 화단
            for x in range(4, 28, 6):
                p.rect(x, 5, 4, 3, "T")
                p.px(x + 1, 5, "j")
        elif v == 2:                             # 시계
            p.rect(14, 4, 5, 5, "w")
            p.box(14, 4, 5, 5, "k")
            p.px(16, 6, "k")
            p.px(16, 5, "k")
    elif level == 2:
        p, base = _building(56, 14, roof, roof_d, roof_h, wall, wall_d)
        if v == 0:                               # 옥상 실외기
            for x in (5, 20):
                p.rect(x, 5, 6, 4, "v")
                p.box(x, 5, 6, 4, "Q")
        elif v == 1:                             # 태양광 패널
            for x in range(4, 26, 8):
                p.rect(x, 4, 6, 6, "B")
                for y in range(4, 10, 2):
                    p.rect(x, y, 6, 1, "U")
        else:                                    # 옥상 헬리패드
            p.rect(9, 3, 14, 9, "X")
            p.box(9, 3, 14, 9, "w")
            p.rect(14, 5, 1, 5, "w")
            p.rect(18, 5, 1, 5, "w")
            p.rect(14, 7, 5, 1, "w")
        _glass(p, 3, 16, 26, 10, 4 + v)
        p.rect(1, 27, 30, 2, accent)
        _glass(p, 3, 30, 26, 9, 4 + v)
        p.rect(10, 41, 12, base - 41, "B")
        p.rect(11, 42, 10, base - 42, "s")
        p.rect(16, 42, 1, base - 42, "B")
    else:
        p = Pix(32, 66)
        base = 60
        p.rect(0, base, 32, 6, "c")
        p.rect(0, base, 32, 1, "C")
        for x in range(1, 31):                   # 지붕 모양이 디자인마다 다르다
            if v == 0:                           # 물결 지붕
                top = round(4 + 3 * math.cos((x - 2) / 28 * math.pi * 2))
            elif v == 1:                         # 둥근 돔 지붕
                t = (x - 15.5) / 15
                top = round(2 + 9 * (1 - math.sqrt(max(0, 1 - t * t))))
            else:                                # 톱니 지붕
                top = 3 + (x % 8) // 2
            p.rect(x, top, 1, 16 - top, roof)
            p.px(x, top, roof_h)
            p.px(x, top + 1, roof_h)
            p.rect(x, 14, 1, 2, roof_d)
            p.px(x, top - 1, "k")
        p.rect(1, 16, 30, base - 16, wall)
        for y in (18, 31, 44):
            _glass(p, 2, y, 28, 10, 3 + v)
            p.rect(1, y + 10, 30, 2, accent if y == 31 else wall_d)
        p.rect(9, 52, 14, base - 52, "B")
        p.rect(10, 53, 12, base - 53, "s")
        p.rect(16, 53, 1, base - 53, "B")
        p.rect(0, 15, 1, base - 14, "k")
        p.rect(31, 15, 1, base - 14, "k")
        p.rect(0, base - 1, 32, 1, "k")
    return p.rows()


SHOP_STYLES = [
    # (종류, 차양색 1, 차양색 2, 간판 바탕, 간판 그림)
    ("cafe", "V", "e", "I", "cup"),
    ("mart", "5", "w", "u", "stripe"),
    ("bakery", "r", "w", "9", "bread"),
]


def _sign_icon(p, x, y, kind):
    if kind == "cup":                            # 커피잔
        p.rect(x, y + 1, 4, 3, "w")
        p.px(x + 4, y + 2, "w")
        p.px(x + 1, y, "W")
        p.px(x + 2, y - 1, "W")
    elif kind == "bread":                        # 빵
        p.rect(x, y + 1, 6, 3, "o")
        p.rect(x + 1, y, 4, 1, "o")
        for dx, dy in ((1, 2), (3, 1), (5, 2)):
            p.px(x + dx, y + dy, "O")
    else:                                        # 편의점 줄무늬
        p.rect(x - 2, y + 1, 10, 1, "w")
        p.rect(x - 2, y + 3, 10, 1, "5")


def _awning(p, y, h, c1, c2):
    for x in range(1, 31):
        col = c1 if (x // 3) % 2 == 0 else c2
        p.rect(x, y, 1, h, col)
        if x % 3 == 1:
            p.px(x, y + h, col)
    p.rect(0, y + h, 32, 1, "k")


def _shop(level, v=0):
    kind, a1, a2, sign, icon = SHOP_STYLES[v]
    if level == 1:                             # 작은 매점
        p, base = _building(42, 14, a1, a1, a2)
        _sign_icon(p, 13, 6, icon)
        _awning(p, 14, 4, a1, a2)
        _glass(p, 3, 21, 14, 9)
        p.rect(20, 21, 8, base - 21, "B")
        p.rect(21, 22, 6, base - 22, "s")
        goods = {"cafe": "VnV", "mart": "r3u", "bakery": "oOo"}[kind]
        for x, c in zip((5, 9, 13), goods):
            p.rect(x, 26, 2, 3, c)
        if kind == "cafe":                     # 바깥 테이블
            p.rect(21, base + 1, 6, 2, "w")
            p.rect(23, base + 3, 2, 2, "X")
    elif level == 2:                           # 가게
        p, base = _building(50, 12, a2 if a2 != "w" else "e", a1, "w")
        p.rect(3, 13, 26, 7, sign)              # 간판
        p.box(3, 13, 26, 7, "k")
        _sign_icon(p, 13, 14, icon)
        _awning(p, 21, 4, a1, a2)
        _glass(p, 3, 28, 15, 12)
        goods = {"cafe": "VnI", "mart": "o35", "bakery": "o9O"}[kind]
        for x, c in zip((5, 9, 13), goods):
            p.rect(x, 34, 3, 4, c)
        p.rect(21, 28, 8, base - 28, "B")
        p.rect(22, 29, 6, base - 29, "s")
        for x in (1, 28):                       # 화분
            p.rect(x, base + 1, 3, 3, "V")
            p.rect(x, base - 1, 3, 2, "T")
    else:                                      # 큰 상업 시설
        roof, roof_d, roof_h, board, letters = [("6", "U", "z", "U", "3"),     # 면세점
                                                 ("H", "J", "7", "8", "w"),     # 백화점
                                                 ("o", "O", "9", "r", "3")][v]  # 푸드코트
        p, base = _building(62, 10, roof, roof_d, roof_h, "w", "W")
        p.rect(2, 11, 28, 8, board)             # 큰 간판
        p.box(2, 11, 28, 8, "k")
        for x in range(5, 27, 3):
            p.rect(x, 13, 2, 4, letters)
        _glass(p, 3, 21, 26, 11, 3 + v)
        p.rect(1, 33, 30, 2, roof)
        _glass(p, 3, 37, 26, 9, 3 + v)
        p.rect(10, 48, 12, base - 48, "B")
        p.rect(11, 49, 10, base - 49, "s")
        p.rect(16, 49, 1, base - 49, "B")
        deco = [("r", "3", "P", "u"), ("8", "w", "8", "w"), ("o", "r", "3", "o")][v]
        for x, c in zip((4, 6, 25, 27), deco):
            p.rect(x, 40, 2, 3, c)
    return p.rows()


PREMIUM_STYLES = [   # (지붕, 지붕 그늘, 지붕 하이라이트, 금장식, 벽, 벽 그늘) - 명품관 / 보석상 / 호텔
    ("I", "k", "V", "Z", "k", "B"),
    ("w", "W", "e", "Z", "w", "W"),
    ("6", "U", "z", "3", "e", "E"),
]


def _premium(level, v=0):
    """고급 상업 건물: 레벨이 오를수록 높아지고 금장식이 늘어난다"""
    roof, roof_d, roof_h, gold, wall, wall_d = PREMIUM_STYLES[v]
    height = [50, 62, 76][level - 1]
    p, base = _building(height, 12, roof, roof_d, roof_h, wall, wall_d)
    p.rect(1, 2, 30, 1, gold)                     # 지붕 금테
    p.rect(3, 13, 26, 6, gold)                    # 금색 간판
    p.box(3, 13, 26, 6, "k")
    for x in range(6, 27, 4):
        p.rect(x, 15, 2, 2, "k")
    floors = level
    y = 21
    for _ in range(floors):                       # 층마다 큰 유리창 + 금색 띠
        _glass(p, 3, y, 26, 9, 5)
        p.rect(1, y + 9, 30, 1, gold)
        y += 11
    p.rect(11, y, 10, base - y, "B")              # 회전문 입구
    p.rect(12, y + 1, 8, base - y - 1, "s")
    p.rect(16, y + 1, 1, base - y - 1, gold)
    p.rect(13, base, 6, 6, "r")                   # 레드카펫
    for x in (5, 25):                             # 입구 화분
        p.rect(x, base - 4, 3, 4, "V")
        p.rect(x, base - 7, 3, 3, "T")
    if level == 3:                                # 꼭대기 첨탑
        p.rect(15, 0, 2, 3, gold)
    return p.rows()


def _garage(level):
    """주차 타워: 층마다 차가 보이는 여러 층 주차 건물"""
    height = [52, 68][level - 1]
    p, base = _building(height, 10, "X", "Q", "v", "c", "C")
    p.rect(11, 1, 10, 9, "u")                     # 파란 P 간판
    p.box(11, 1, 10, 9, "k")
    p.rect(14, 3, 1, 5, "w")
    p.rect(14, 3, 4, 1, "w")
    p.rect(17, 3, 1, 3, "w")
    p.rect(14, 5, 4, 1, "w")
    y = 12
    colors = "ru3w5Su"
    for floor in range(level + 1):                # 층마다 뚫린 주차층 + 차
        p.rect(2, y, 28, 9, "A")
        for i, x in enumerate(range(4, 28, 6)):
            col = colors[(i + floor * 2) % len(colors)]
            p.rect(x, y + 4, 4, 3, col)
            p.rect(x, y + 4, 4, 1, "k")
        p.rect(1, y + 9, 30, 2, "C")
        y += 11
    p.rect(10, y, 12, base - y, "k")              # 차 들어가는 입구
    p.rect(11, y + 1, 10, base - y - 1, "A")
    p.rect(10, y, 12, 1, "l")
    return p.rows()


def _gate(side):
    """탑승동: 활주로 쪽(side)으로 탑승교가 뻗어 있다"""
    tall = 16 if side == "n" else 8
    p = Pix(32, 32 + tall)
    base = 32 + tall - 4
    p.rect(0, base, 32, 4, "c")
    x0, x1 = 1, 31
    if side == "e":
        x1 = 22
    if side == "w":
        x0 = 10
    top = tall + 2 if side == "n" else 4
    bottom = base - (12 if side == "s" else 0)
    w = x1 - x0
    p.rect(x0, top, w, 7, "q")                   # 평평한 지붕
    p.rect(x0, top, w, 1, "v")
    p.rect(x0, top + 6, w, 1, "Q")
    p.rect(x0, top + 7, w, bottom - top - 7, "W")    # 벽
    _glass(p, x0 + 2, top + 9, w - 4, 7, 3)          # 대합실 유리
    p.rect(x0 + 2, top + 17, w - 4, 1, "Q")
    sx = x0 + w // 2 - 4                              # 노란 게이트 간판
    p.rect(sx, top + 2, 8, 4, "l")
    p.rect(sx + 2, top + 3, 1, 2, "k")
    p.rect(sx + 3, top + 3, 2, 1, "k")
    p.px(sx + 4, top + 4, "k")
    p.box(x0 - 1, top - 1, w + 2, bottom - top + 1, "k")
    # 탑승교 (창문 달린 통로)
    if side == "n":
        p.rect(13, 0, 6, top - 1, "W")
        p.box(12, 0, 8, top, "k")
        for y in range(2, top - 2, 3):
            p.rect(14, y, 4, 1, "b")
    elif side == "s":
        p.rect(13, bottom, 6, base - bottom + 4, "W")
        p.box(12, bottom, 8, base - bottom + 4, "k")
        for y in range(bottom + 2, base + 3, 3):
            p.rect(14, y, 4, 1, "b")
    elif side == "e":
        p.rect(x1, top + 10, 32 - x1, 6, "W")
        p.box(x1, top + 9, 32 - x1, 8, "k")
        for x in range(x1 + 2, 31, 3):
            p.rect(x, top + 11, 1, 4, "b")
    else:
        p.rect(0, top + 10, x0, 6, "W")
        p.box(0, top + 9, x0, 8, "k")
        for x in range(1, x0 - 1, 3):
            p.rect(x, top + 11, 1, 4, "b")
    return p.rows()


def _hangar(open_, size=1):
    """격납고. size 0 = 소형(경비행기), 1 = 중형(여객기), 2 = 대형(대형 여객기)"""
    arch, height, door_x, (roof, roof_d, roof_h) = [
        (6, 38, 9, ("7", "H", "w")),
        (10, 46, 4, ("q", "Q", "v")),
        (14, 56, 2, ("m", "M", "z")),
    ][size]
    p = Pix(32, height)
    base = height - 4
    top_wall = 6 + arch
    p.rect(0, base, 32, 4, "c")
    for x in range(1, 31):                      # 둥근 지붕 (클수록 높다)
        t = (x - 15.5) / 15
        top = round(3 + arch * (1 - math.sqrt(max(0, 1 - t * t))))
        p.rect(x, top, 1, top_wall - top, roof)
        p.px(x, top, roof_h)
        p.px(x, top - 1, "k")
        if x % 4 == 0:
            p.rect(x, top + 1, 1, top_wall - 1 - top, roof_d)
    p.rect(1, top_wall, 30, base - top_wall, "W")          # 벽
    p.rect(27, top_wall, 4, base - top_wall, "X")
    p.rect(0, top_wall - 1, 32, 1, "k")
    p.rect(0, top_wall - 1, 1, base - top_wall + 2, "k")
    p.rect(31, top_wall - 1, 1, base - top_wall + 2, "k")
    p.rect(0, base - 1, 32, 1, "k")
    if size == 2:                               # 대형 격납고 빨간 띠
        p.rect(1, top_wall, 30, 2, "r")
    dw, dy = 32 - door_x * 2, top_wall + 3       # 문 (클수록 넓다)
    p.rect(door_x, dy, dw, base - dy - 1, "k")
    if open_:
        p.rect(door_x + 1, dy + 1, dw - 2, base - dy - 2, "A")
        p.rect(door_x + 1, dy + 1, dw - 2, 2, "B")
    else:
        p.rect(door_x + 1, dy + 1, dw - 2, base - dy - 2, "v")
        for x in range(door_x + 2, door_x + dw - 1, 2):
            p.rect(x, dy + 1, 1, base - dy - 2, "q")
        p.rect(15, dy + 1, 2, base - dy - 2, "Q")
    p.rect(door_x + 2, top_wall + 1, dw - 4, 1, "l")       # 노란 경고선
    return p.rows()


def _tower():
    p = Pix(32, 90)
    base = 86
    p.rect(0, base, 32, 4, "g")
    p.px(16, 0, "R")
    p.px(15, 0, "R")
    p.rect(15, 1, 2, 5, "X")                   # 안테나
    p.poly([(4, 10), (28, 10), (26, 6), (6, 6)], "M")   # 지붕
    p.rect(6, 6, 20, 1, "z")
    p.rect(3, 10, 26, 10, "b")                 # 관제실 유리
    for x in range(3, 29, 4):
        p.rect(x, 10, 1, 10, "B")
    for x in range(4, 28, 4):
        p.px(x + 1, 11, "s")
        p.px(x + 2, 11, "s")
    p.rect(2, 20, 28, 3, "W")
    p.rect(5, 23, 22, 2, "X")
    p.rect(11, 25, 10, base - 25 - 10, "e")    # 기둥
    p.rect(18, 25, 3, base - 35, "E")
    for y in range(30, base - 12, 8):
        p.rect(14, y, 4, 2, "b")
    p.rect(5, base - 10, 22, 10, "e")          # 1층
    p.rect(22, base - 10, 5, 10, "E")
    p.rect(13, base - 6, 6, 6, "B")
    p.rect(7, base - 8, 4, 3, "b")
    p.rect(21, base - 8, 4, 3, "b")
    p.outline()
    return p.rows()


# ── 비행기 3종 (위에서 본 모습, 오른쪽을 향함) ─────
LIVERIES = ["sky", "rainbow", "red"]   # 하늘색 항공 / 색동 항공 / 우리 회사


def _tail(p, livery, x0, x1, y0, y1):
    """꼬리 도장"""
    if livery == "sky":
        p.rect(x0, y0, x1 - x0, y1 - y0, "U")
        p.px((x0 + x1) // 2, y0, "w")
    elif livery == "rainbow":
        for i, x in enumerate(range(x0, x1)):
            p.rect(x, y0, 1, y1 - y0, "ro35u6"[i % 6])
    else:
        p.rect(x0, y0, x1 - x0, y1 - y0, "r")


def _plane(kind, livery):
    body = "S" if livery == "sky" else "w"
    if kind == "light":                          # 경비행기: 곧은 날개 + 프로펠러
        n = 28
        p = Pix(n, n)
        p.rect(10, 2, 6, 24, "W")                 # 곧은 날개
        p.rect(10, 2, 6, 1, "w")
        p.rect(10, 2, 2, 3, "r" if livery == "red" else "u")
        p.rect(10, 23, 2, 3, "r" if livery == "red" else "u")
        p.rect(2, 9, 4, 10, "W")                  # 꼬리날개
        p.poly([(3, 12.5), (23, 12), (25, 13), (25, 15), (23, 16), (3, 15.5), (1, 14)], body)  # 동체
        p.rect(18, 13, 3, 2, "B")                 # 조종석
        _tail(p, livery, 1, 6, 13, 15)
        p.rect(26, 9, 1, 10, "X")                 # 프로펠러
        p.rect(25, 13, 2, 2, "k")
    elif kind == "jumbo":                        # 대형 여객기: 엔진 4개 + 2층 객실
        n = 52
        p = Pix(n, n)
        mirror = lambda pts: [(x, n - y) for x, y in pts]
        wing = [(33, 24), (18, 3), (14, 3), (22, 24)]
        p.poly(wing, "W")
        p.poly(mirror(wing), "W")
        stab = [(11, 24), (5, 15), (2, 15), (5, 24)]
        p.poly(stab, "W")
        p.poly(mirror(stab), "W")
        for x0, y0 in ((25, 13), (20, 7)):        # 엔진 4개
            for yy in (y0, n - 1 - y0 - 2):
                p.rect(x0, yy, 6, 3, "q")
                p.rect(x0 + 5, yy, 1, 3, "B")
                p.rect(x0, yy, 6, 1, "v")
        p.poly([(3, 23), (44, 23), (48, 24), (50, 26), (48, 28), (44, 29), (3, 29), (1, 26)], body)
        p.poly([(33, 22.5), (44, 22.5), (47, 26), (44, 29.5), (33, 29.5)], "w" if body != "w" else "W")  # 2층 객실
        p.rect(3, 23, 41, 1, "w")
        p.rect(3, 28, 41, 1, "W")
        p.rect(45, 25, 2, 2, "B")
        _tail(p, livery, 1, 11, 25, 27)
        for y in range(7, 23):                    # 날개 플랩 선
            x = round(14 + (y - 3) * 8 / 21) + 1
            p.px(x, y, "X")
            p.px(x, n - 1 - y, "X")
    else:                                        # 여객기
        n = 40
        p = Pix(n, n)
        mirror = lambda pts: [(x, n - y) for x, y in pts]
        wing = [(25, 19), (14, 3), (11, 3), (17, 19)]
        p.poly(wing, "W")
        p.poly(mirror(wing), "W")
        stab = [(9, 19), (4, 12), (2, 12), (4, 19)]
        p.poly(stab, "W")
        p.poly(mirror(stab), "W")
        for y0 in (11, 26):                       # 엔진 2개
            p.rect(19, y0, 6, 3, "q")
            p.rect(24, y0, 1, 3, "B")
            p.rect(19, y0, 6, 1, "v")
        for y in range(6, 18):                    # 날개 플랩 선
            x = round(11 + (y - 3) * 6 / 16) + 1
            p.px(x, y, "X")
            p.px(x, n - 1 - y, "X")
        p.poly([(3, 18), (34, 18), (37, 19), (38, 20), (37, 21), (34, 22), (3, 22), (1, 20)], body)
        p.rect(3, 18, 31, 1, "w")
        p.rect(3, 21, 31, 1, "W")
        p.rect(34, 19, 2, 2, "B")
        _tail(p, livery, 1, 9, 19, 21)
        if livery == "red":                       # 날개 끝
            p.poly([(14, 3), (11, 3), (12, 5), (15, 5)], "r")
            p.poly(mirror([(14, 3), (11, 3), (12, 5), (15, 5)]), "r")
    p.outline()
    return p.rows()


def _shadow(rows):
    """비행기 그림자. 체크무늬로 찍어서 반투명처럼 보이게 한다."""
    return ["".join("h" if ch not in ".k" and (r + c) % 2 == 0 else "."
                    for c, ch in enumerate(row)) for r, row in enumerate(rows)]


# ── 그림 목록 ──────────────────────────────────────
SPRITES = {
    "grass0": _grass(1, 0), "grass1": _grass(2, 0), "grass2": _grass(3, 2), "grass3": _grass(4, 1),
    "wild0": _recolor(_grass(5, 0), WILD), "wild1": _recolor(_grass(6, 1), WILD),
    "wild2": _recolor(_grass(7, 2), WILD),
    "runway_h": _runway(), "runway_h_w": _runway(end=True), "runway_h_e": _flip(_runway(end=True)),
    "plaza": _plaza(),
    "zone_terminal": _zone("u"), "zone_shop": _zone("P"), "zone_parking": _zone("w"),
    "zone_shop_premium": _zone("Z"),
    "zone_parking_premium": _zone("Q"),
    "parking1": _parking(1), "parking2": _parking(2),
    "tree0": _tree(0), "tree1": _tree(1),
    "construction": _construction(),
    **{f"terminal{lv}_{v}": _terminal(lv, v) for lv in (1, 2, 3) for v in range(3)},
    **{f"shop{lv}_{v}": _shop(lv, v) for lv in (1, 2, 3) for v in range(3)},
    **{f"gate_{d}": _gate(d) for d in "nsew"},
    **{f"shop_premium{lv}_{v}": _premium(lv, v) for lv in (1, 2, 3) for v in range(3)},
    **{f"parking_premium{lv}_{v}": _garage(lv) for lv in (1, 2) for v in range(3)},
    "hangar_light": _hangar(True, 0), "hangar_light_closed": _hangar(False, 0),
    "hangar": _hangar(True, 1), "hangar_closed": _hangar(False, 1),
    "hangar_jumbo": _hangar(True, 2), "hangar_jumbo_closed": _hangar(False, 2),
    "tower": _tower(),
}
for _k in ("runway_h", "runway_h_w", "runway_h_e"):          # 세로 활주로 = 가로를 뒤집어서
    SPRITES[_k.replace("_h", "_v").replace("_v_w", "_v_n").replace("_v_e", "_v_s")] = _transpose(SPRITES[_k])
for _m in range(16):
    SPRITES[f"road{_m}"] = _road(_m)
for _kind in ("light", "mid", "jumbo"):            # 비행기 종류 x 도장 x 방향
    for _liv in LIVERIES:
        _e = _plane(_kind, _liv)
        for _d, _rows_ in (("e", _e), ("w", _flip(_e)), ("n", _rot_ccw(_e)), ("s", _rot_cw(_e))):
            SPRITES[f"{_kind}_{_liv}_{_d}"] = _rows_
            if _liv == "sky":
                SPRITES[f"{_kind}shadow_{_d}"] = _shadow(_rows_)

# 그림 크기/색이 잘못되면 바로 알 수 있게 검사
for _name, _rows_ in SPRITES.items():
    assert all(len(r) == len(_rows_[0]) for r in _rows_), f"{_name} 크기 오류"
    assert all(ch == "." or ch in PALETTE_DAY for r in _rows_ for ch in r), f"{_name} 색 오류"


# ── 칸마다 어떤 그림을 쓸지 ────────────────────────
def tile_layers(grid, levels, r, c):
    """(바닥 그림, 물체 그림 또는 None)"""
    v = grid[r][c]
    n = len(grid)
    h = (r * 73856093 ^ c * 19349663) % 100     # 칸마다 고정된 랜덤 값
    same = lambda rr, cc: 0 <= rr < n and 0 <= cc < n and grid[rr][cc] == v
    if v is None:
        return f"wild{h % 3}", (f"tree{h % 2}" if h < 28 else None)
    if v == "empty":
        return f"grass{h % 4}", None
    if v == "road":
        mask = ((1 if same(r - 1, c) else 0) | (2 if same(r, c + 1) else 0)
                | (4 if same(r + 1, c) or r == n - 1 else 0) | (8 if same(r, c - 1) else 0))
        return f"road{mask}", None
    if v == "runway":
        if same(r, c - 1) or same(r, c + 1) or not (same(r - 1, c) or same(r + 1, c)):
            end = "_w" if not same(r, c - 1) and same(r, c + 1) else "_e" if same(r, c - 1) and not same(r, c + 1) else ""
            return "runway_h" + end, None
        end = "_n" if not same(r - 1, c) else "_s" if not same(r + 1, c) else ""
        return "runway_v" + end, None
    if v in ("hangar_light", "hangar", "hangar_jumbo"):
        return "plaza", v
    if v == "gate":                               # 탑승교가 활주로 쪽을 향하게
        for side, (dr, dc) in (("n", (-1, 0)), ("s", (1, 0)), ("e", (0, 1)), ("w", (0, -1))):
            if 0 <= r + dr < n and 0 <= c + dc < n and grid[r + dr][c + dc] == "runway":
                return "plaza", f"gate_{side}"
        return "plaza", "gate_n"
    if v == "tower":
        return "grass0", "tower"
    if v.startswith("zone_"):
        lv = levels[r][c]
        kind = v[5:]
        if lv == 0:
            return v, None
        if lv < 0:
            return "plaza", "construction"
        if kind == "parking":
            return f"parking{lv}", None
        return "plaza", f"{kind}{lv}_{h % 3}"
    return v, None


def as_dict():
    """웹 버전에 보낼 그림 데이터"""
    return {"size": S, "day": PALETTE_DAY, "night": PALETTE_NIGHT, "sprites": SPRITES}
