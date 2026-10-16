"""animations/Lxx/scene_<name>.py → generated/animations/Lxx/<name>.mp4 + <name>_poster.png

사용법: python build/render_animations.py [L01 ...] [--draft]
  --draft : 480p15 저품질로 빠르게 확인
"""
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

import av

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "animations"
OUT = ROOT / "generated" / "animations"


def last_frame_png(mp4: Path, png: Path) -> None:
    with av.open(str(mp4)) as c:
        frame = None
        for frame in c.decode(video=0):
            pass
        frame.to_image().save(png)


def render(scene_file: Path, draft: bool) -> Path:
    lec = scene_file.parent.name
    name = scene_file.stem.removeprefix("scene_")
    dest = OUT / lec
    dest.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory() as tmp:
        cmd = [sys.executable, "-m", "manim", "-ql" if draft else "-qh", "--fps", "15" if draft else "30",
               "--media_dir", tmp, "-o", name, str(scene_file), "Main"]
        subprocess.run(cmd, check=True, cwd=scene_file.parent)
        mp4 = next(Path(tmp).rglob(f"{name}.mp4"))
        shutil.copy(mp4, dest / f"{name}.mp4")
    last_frame_png(dest / f"{name}.mp4", dest / f"{name}_poster.png")
    return dest / f"{name}.mp4"


def main(argv: list[str]) -> None:
    draft = "--draft" in argv
    lectures = [a for a in argv if not a.startswith("--")] or sorted(p.name for p in SRC.glob("L*"))
    for lec in lectures:
        for f in sorted((SRC / lec).glob("scene_*.py")):
            print(f"[render] {f.relative_to(ROOT)}")
            print(f"   -> {render(f, draft).relative_to(ROOT)}")


if __name__ == "__main__":
    main(sys.argv[1:])
