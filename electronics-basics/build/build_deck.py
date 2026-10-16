"""content/Lxx_*/lecture.yaml + 이미지/영상/차트 → output/NN강_제목.pptx

사용법: python build/build_deck.py [L01 ...]   (인자 없으면 전체)
빠진 이미지·영상은 '대기 중' 자리표시로 들어가므로 언제든 빌드 가능.
"""
import re
import sys
from pathlib import Path

import yaml
from pptx import Presentation
from pptx.util import Inches

sys.path.insert(0, str(Path(__file__).resolve().parent))
from layouts import LAYOUTS  # noqa: E402

ROOT = Path(__file__).resolve().parents[1]
ASSET_DIRS = {
    "image": (ROOT / "visuals" / "images", ".png"),
    "video": (ROOT / "generated" / "animations", ".mp4"),
    "chart": (ROOT / "generated" / "charts", ".png"),
}


def load(path: Path):
    return yaml.safe_load(path.read_text(encoding="utf-8"))


def asset(kind: str, ref: str) -> Path | None:
    base, ext = ASSET_DIRS[kind]
    p = base / f"{ref}{ext}"
    return p if p.exists() else None


def build(lec_meta: dict, theme: dict, course: dict) -> Path:
    lecture = load(ROOT / "content" / lec_meta["dir"] / "lecture.yaml")
    deck = Presentation()
    deck.slide_width = Inches(theme["slide"]["width_in"])
    deck.slide_height = Inches(theme["slide"]["height_in"])
    ctx = {"theme": theme, "course": course, "lecture": lecture, "asset": asset, "deck": deck}
    for spec in lecture["slides"]:
        LAYOUTS[spec["layout"]](deck, spec, ctx)
    out = ROOT / "output" / f"{lecture['number']:02d}강_{re.sub(r'[^\w가-힣]', '', lecture['title'])}.pptx"
    out.parent.mkdir(exist_ok=True)
    deck.save(out)
    return out


def main(argv: list[str]) -> None:
    theme = load(ROOT / "config" / "theme.yaml")
    course = load(ROOT / "config" / "course.yaml")
    for lec in course["lectures"]:
        if argv and lec["id"] not in argv:
            continue
        if not (ROOT / "content" / lec["dir"] / "lecture.yaml").exists():
            print(f"[skip] {lec['id']} — lecture.yaml 없음")
            continue
        print(f"[deck] {build(lec, theme, course).relative_to(ROOT)}")


if __name__ == "__main__":
    main(sys.argv[1:])
