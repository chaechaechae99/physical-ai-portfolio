"""pptx → 슬라이드별 PNG + 한 장짜리 모아보기(contact sheet). 검수용.

LibreOffice로 PDF 변환 후 pypdfium2로 렌더한다. (PowerPoint 없이 동작)
사용법: python build/preview.py output/01강_….pptx [출력폴더]
"""
import subprocess
import sys
import tempfile
from pathlib import Path

import pypdfium2 as pdfium
from PIL import Image

SOFFICE = r"C:\Program Files\LibreOffice\program\soffice.exe"


def preview(pptx: Path, out_dir: Path, width: int = 1600) -> Path:
    out_dir.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory() as tmp:
        subprocess.run([SOFFICE, "--headless", "--convert-to", "pdf", "--outdir", tmp, str(pptx)],
                       check=True, capture_output=True)
        pdf = pdfium.PdfDocument(next(Path(tmp).glob("*.pdf")))
        pages = []
        for i, page in enumerate(pdf, 1):
            img = page.render(scale=width / page.get_width()).to_pil()
            img.save(out_dir / f"slide{i:02d}.png")
            pages.append(img)
        pdf.close()

    cols = 3
    tw = 520
    th = int(tw * pages[0].height / pages[0].width)
    rows = (len(pages) + cols - 1) // cols
    sheet = Image.new("RGB", (cols * (tw + 10) + 10, rows * (th + 10) + 10), "#9CA3AF")
    for i, p in enumerate(pages):
        sheet.paste(p.resize((tw, th)), (10 + (i % cols) * (tw + 10), 10 + (i // cols) * (th + 10)))
    sheet.save(out_dir / "_sheet.png")
    return out_dir


if __name__ == "__main__":
    src = Path(sys.argv[1]).resolve()
    dst = Path(sys.argv[2]) if len(sys.argv) > 2 else src.with_name("preview_" + src.stem)
    print(preview(src, dst))
