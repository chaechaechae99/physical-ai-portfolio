"""theme.yaml → manim 공통 스타일.

장면 규칙: animations/Lxx/scene_<name>.py 에 `class Main(Scene)` 하나를 둔다.
build/render_animations.py 가 렌더해 generated/animations/Lxx/<name>.mp4 (+ _poster.png) 로 저장한다.
"""
from pathlib import Path

import yaml
from manim import ManimColor, Text, config

ROOT = Path(__file__).resolve().parents[2]
THEME = yaml.safe_load((ROOT / "config" / "theme.yaml").read_text(encoding="utf-8"))
FONT = THEME["font"]["family"]


def C(name: str) -> ManimColor:
    return ManimColor("#" + THEME["colors"][name])


config.background_color = C("bg")


def T(text: str, size: float = 36, color: str = "text", **kw) -> Text:
    """한글 텍스트 (LaTeX 없이 테마 폰트로)."""
    return Text(text, font=FONT, font_size=size, color=C(color), **kw)
