"""theme.yaml을 읽어 matplotlib 공통 스타일을 적용한다.

그림 스크립트 규칙: figures/Lxx/fig_<name>.py 는 `draw() -> Figure` 를 정의한다.
build/build_figures.py 가 이를 실행해 generated/figures/Lxx/<name>.png 로 저장한다.
"""
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import yaml

ROOT = Path(__file__).resolve().parents[2]
THEME = yaml.safe_load((ROOT / "config" / "theme.yaml").read_text(encoding="utf-8"))


def C(name: str) -> str:
    """테마 색 이름 → matplotlib용 '#RRGGBB'."""
    return "#" + THEME["colors"][name]


plt.rcParams.update({
    "font.family": THEME["font"]["family"],
    "axes.unicode_minus": False,      # 한글 폰트에서 '−' 깨짐 방지
    "font.size": 16,
    "text.color": C("text"),
    "axes.edgecolor": C("muted"),
    "axes.labelcolor": C("text"),
    "xtick.color": C("muted"),
    "ytick.color": C("muted"),
    "savefig.transparent": True,
    "savefig.bbox": "tight",
    "savefig.pad_inches": 0.05,
})


def canvas(w: float, h: float, xlim=None, ylim=None):
    """일러스트용 빈 캔버스. 좌표는 데이터 단위(기본 0~w, 0~h), 축 숨김, 비율 1:1."""
    fig, ax = plt.subplots(figsize=(w, h))
    ax.set_xlim(*(xlim or (0, w)))
    ax.set_ylim(*(ylim or (0, h)))
    ax.set_aspect("equal")
    ax.axis("off")
    return fig, ax


def chart(w: float, h: float):
    """그래프용 캔버스. 위·오른쪽 테두리 제거."""
    fig, ax = plt.subplots(figsize=(w, h))
    ax.spines[["top", "right"]].set_visible(False)
    return fig, ax
