/**
 * 결과 카드 이미지를 Canvas 2D로 직접 그린다 (외부 의존성 없음).
 * 스토리(1080×1920) / 피드(1080×1080) 두 가지 크기.
 */

export type CardSize = "story" | "feed";

export type CardImage = { src: string; reversed?: boolean; label?: string };

export type CardSpec = {
  /** 상단 작은 글씨 (예: "丙寅일주 · 뱀띠 · 전생 결과") */
  eyebrow: string;
  title: string;
  subtitle?: string;
  chips?: string[];
  /** 가운데 이미지 줄 (타로 카드 등) */
  images?: CardImage[];
  /** 이미지 아래 한 줄 (예: "↗ 흐름 상승") */
  marker?: string;
  rows?: { label: string; text: string }[];
  /** 하단 강조 한 줄 (예: 희귀도, 오늘의 조언) */
  highlight?: string;
};

export const CARD_SIZES: Record<CardSize, { w: number; h: number; label: string }> = {
  story: { w: 1080, h: 1920, label: "스토리 9:16" },
  feed: { w: 1080, h: 1080, label: "피드 1:1" },
};

const NAVY = "#1B3A5C";
const GOLD = "#C9A24B";
const WHITE = "#FFFFFF";
const SOFT = "rgba(255,255,255,0.78)";
const LINE = "rgba(255,255,255,0.18)";

/** next/font가 만든 실제 폰트 이름을 CSS 변수에서 읽는다 */
function fontStack(varName: string, fallback: string) {
  if (typeof document === "undefined") return fallback;
  const v = getComputedStyle(document.body).getPropertyValue(varName).trim();
  return v ? `${v}, ${fallback}` : fallback;
}

const imgCache = new Map<string, Promise<HTMLImageElement>>();
function loadImage(src: string) {
  let p = imgCache.get(src);
  if (!p) {
    p = new Promise<HTMLImageElement>((resolve, reject) => {
      const im = new Image();
      im.onload = () => resolve(im);
      im.onerror = () => reject(new Error(`이미지를 불러오지 못했어요: ${src}`));
      im.src = src;
    });
    imgCache.set(src, p);
  }
  return p;
}

/** 공백 단위로 줄바꿈, 한 단어가 너무 길면 글자 단위로 자른다 */
function wrap(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const lines: string[] = [];
  for (const para of text.split("\n")) {
    let line = "";
    for (const word of para.split(/\s+/).filter(Boolean)) {
      const tryLine = line ? `${line} ${word}` : word;
      if (ctx.measureText(tryLine).width <= maxW) {
        line = tryLine;
        continue;
      }
      if (line) lines.push(line);
      if (ctx.measureText(word).width <= maxW) {
        line = word;
      } else {
        let chunk = "";
        for (const ch of word) {
          if (ctx.measureText(chunk + ch).width > maxW && chunk) {
            lines.push(chunk);
            chunk = ch;
          } else chunk += ch;
        }
        line = chunk;
      }
    }
    if (line) lines.push(line);
  }
  return lines;
}

type Ctx = {
  ctx: CanvasRenderingContext2D;
  draw: boolean;
  x: number;
  w: number;
  display: string;
  body: string;
};

function text(c: Ctx, s: string, y: number, size: number, opts: { font?: "display" | "body"; weight?: number; color?: string; lh?: number; align?: CanvasTextAlign } = {}) {
  const { ctx } = c;
  ctx.font = `${opts.weight ?? 400} ${size}px ${opts.font === "display" ? c.display : c.body}`;
  const lines = wrap(ctx, s, c.w);
  const lh = size * (opts.lh ?? 1.45);
  if (c.draw) {
    ctx.fillStyle = opts.color ?? WHITE;
    ctx.textAlign = opts.align ?? "left";
    ctx.textBaseline = "top";
    const tx = opts.align === "center" ? c.x + c.w / 2 : c.x;
    lines.forEach((l, i) => ctx.fillText(l, tx, y + i * lh));
  }
  return y + lines.length * lh;
}

function chipsRow(c: Ctx, chips: string[], y: number, size: number) {
  const { ctx } = c;
  ctx.font = `600 ${size}px ${c.body}`;
  const padX = size * 0.8, h = size * 2, gap = size * 0.5;
  let cx = c.x, cy = y;
  for (const t of chips) {
    const w = ctx.measureText(t).width + padX * 2;
    if (cx + w > c.x + c.w && cx > c.x) {
      cx = c.x;
      cy += h + gap;
    }
    if (c.draw) {
      ctx.strokeStyle = GOLD;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(cx, cy, w, h, h / 2);
      ctx.stroke();
      ctx.fillStyle = GOLD;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(t, cx + padX, cy + h / 2 + 1);
    }
    cx += w + gap;
  }
  return cy + h;
}

function imagesRow(c: Ctx, imgs: { im: HTMLImageElement; spec: CardImage }[], y: number, s: number) {
  const { ctx } = c;
  const n = imgs.length, gap = 28 * s;
  const iw = Math.min((c.w - gap * (n - 1)) / n, 260 * s);
  const ih = iw * (imgs[0].im.naturalHeight / imgs[0].im.naturalWidth || 1.7);
  const total = iw * n + gap * (n - 1);
  let ix = c.x + (c.w - total) / 2;
  const labelSize = 26 * s;
  for (const { im, spec } of imgs) {
    if (c.draw) {
      ctx.save();
      if (spec.reversed) {
        ctx.translate(ix + iw / 2, y + ih / 2);
        ctx.rotate(Math.PI);
        ctx.drawImage(im, -iw / 2, -ih / 2, iw, ih);
      } else {
        ctx.drawImage(im, ix, y, iw, ih);
      }
      ctx.restore();
      ctx.strokeStyle = GOLD;
      ctx.lineWidth = 3;
      ctx.strokeRect(ix, y, iw, ih);
      if (spec.label) {
        ctx.font = `500 ${labelSize}px ${c.body}`;
        ctx.fillStyle = SOFT;
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.fillText(spec.label, ix + iw / 2, y + ih + 14 * s, iw + gap);
      }
    }
    ix += iw + gap;
  }
  return y + ih + (imgs.some((i) => i.spec.label) ? labelSize + 22 * s : 0);
}

/** 내용을 그리고 끝난 y좌표를 돌려준다 (draw=false면 측정만) */
function layout(c: Ctx, spec: CardSpec, imgs: { im: HTMLImageElement; spec: CardImage }[], top: number, s: number) {
  let y = top;
  y = text(c, spec.eyebrow, y, 30 * s, { weight: 500, color: GOLD, lh: 1.3 });
  y += 26 * s;
  y = text(c, spec.title, y, 76 * s, { font: "display", weight: 700, lh: 1.25 });
  if (spec.subtitle) {
    y += 22 * s;
    y = text(c, spec.subtitle, y, 36 * s, { color: SOFT });
  }
  if (spec.chips?.length) {
    y += 34 * s;
    y = chipsRow(c, spec.chips, y, 28 * s);
  }
  if (imgs.length) {
    y += 48 * s;
    y = imagesRow(c, imgs, y, s);
  }
  if (spec.marker) {
    y += 22 * s;
    y = text(c, spec.marker, y, 34 * s, { weight: 600, color: GOLD, align: "center" });
  }
  for (const r of spec.rows ?? []) {
    y += 40 * s;
    if (c.draw) {
      c.ctx.fillStyle = LINE;
      c.ctx.fillRect(c.x, y - 20 * s, c.w, 2);
    }
    y = text(c, r.label, y, 28 * s, { weight: 600, color: GOLD, lh: 1.3 });
    y += 10 * s;
    y = text(c, r.text, y, 34 * s, { lh: 1.5 });
  }
  if (spec.highlight) {
    y += 48 * s;
    y = text(c, spec.highlight, y, 40 * s, { font: "display", weight: 700, color: GOLD, align: "center", lh: 1.35 });
  }
  return y;
}

export async function drawCard(spec: CardSpec, size: CardSize): Promise<HTMLCanvasElement> {
  if (typeof document !== "undefined" && document.fonts) await document.fonts.ready;
  const { w, h } = CARD_SIZES[size];
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("이 브라우저는 이미지 만들기를 지원하지 않아요.");

  const imgs = await Promise.all(
    (spec.images ?? []).map(async (sp) => ({ im: await loadImage(sp.src), spec: sp })),
  );

  const pad = size === "story" ? 96 : 80;
  const display = fontStack("--font-display", "'Gowun Batang', serif");
  const body = fontStack("--font-body", "'IBM Plex Sans KR', 'Malgun Gothic', sans-serif");

  // 배경 + 테두리
  ctx.fillStyle = NAVY;
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 4;
  ctx.strokeRect(36, 36, w - 72, h - 72);

  // 머리: 로고
  ctx.font = `700 ${size === "story" ? 52 : 44}px ${display}`;
  ctx.fillStyle = GOLD;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText("운결", pad, pad);
  const headH = size === "story" ? 52 : 44;

  // 꼬리
  const footSize = size === "story" ? 26 : 22;
  ctx.font = `400 ${footSize}px ${body}`;
  ctx.fillStyle = SOFT;
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";
  ctx.fillText("unkyeol · 재미로 봐주세요", w / 2, h - pad + 20);

  // 본문: 넘치면 글자 크기를 줄여서 맞춘다
  const top = pad + headH + (size === "story" ? 120 : 56);
  const bottom = h - pad - footSize - 40;
  const c: Ctx = { ctx, draw: false, x: pad, w: w - pad * 2, display, body };
  let s = size === "story" ? 1.1 : 0.9;
  while (s > 0.5 && layout(c, spec, imgs, top, s) > bottom) s *= 0.93;

  // 스토리는 세로 가운데 정렬
  const used = layout(c, spec, imgs, top, s) - top;
  const start = size === "story" ? top + Math.max(0, (bottom - top - used) / 2) : top;
  c.draw = true;
  layout(c, spec, imgs, start, s);
  return canvas;
}

export function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("이미지를 만들지 못했어요."))), "image/png"),
  );
}
