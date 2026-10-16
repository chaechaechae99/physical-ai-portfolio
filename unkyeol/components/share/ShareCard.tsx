"use client";

import { useEffect, useRef, useState } from "react";
import { CARD_SIZES, canvasToBlob, drawCard, type CardSize, type CardSpec } from "./drawCard";

const stamp = () => {
  const d = new Date();
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
};

/** 결과 카드 미리보기 + 이미지 저장 + 공유 */
export function ShareCard({ spec, name }: { spec: CardSpec; name: string }) {
  const [size, setSize] = useState<CardSize>("story");
  const [preview, setPreview] = useState<string | null>(null);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(true);
  const blobRef = useRef<Blob | null>(null);
  const specKey = JSON.stringify(spec);

  useEffect(() => {
    let alive = true;
    let url: string | null = null;
    setBusy(true);
    drawCard(JSON.parse(specKey) as CardSpec, size)
      .then(canvasToBlob)
      .then((blob) => {
        if (!alive) return;
        blobRef.current = blob;
        url = URL.createObjectURL(blob);
        setPreview(url);
        setBusy(false);
      })
      .catch((e: Error) => {
        if (alive) {
          setMsg(e.message);
          setBusy(false);
        }
      });
    return () => {
      alive = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [specKey, size]);

  const fileName = `운결_${name}_${stamp()}.png`;

  const save = () => {
    const blob = blobRef.current;
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setMsg("이미지를 저장했어요.");
  };

  const share = async () => {
    const blob = blobRef.current;
    if (!blob) return;
    const file = new File([blob], fileName, { type: "image/png" });
    try {
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: "운결", text: spec.title });
        setMsg("공유했어요.");
        return;
      }
    } catch (e) {
      if ((e as Error).name === "AbortError") return; // 사용자가 공유 창을 닫음
    }
    save();
    try {
      await navigator.clipboard.writeText(location.href);
      setMsg("이미지를 저장하고, 링크를 복사했어요.");
    } catch {
      setMsg("이미지를 저장했어요. 링크는 주소창에서 복사해 주세요.");
    }
  };

  return (
    <div className="panel">
      <h3 className="panel-h">결과 카드로 저장하기</h3>
      <div className="chips">
        {(Object.keys(CARD_SIZES) as CardSize[]).map((k) => (
          <button key={k} type="button" className="chip" aria-pressed={k === size} onClick={() => setSize(k)}>
            {CARD_SIZES[k].label}
          </button>
        ))}
      </div>
      <div style={{ display: "flex", gap: 16, alignItems: "flex-end", flexWrap: "wrap", marginTop: 14 }}>
        <div
          style={{
            width: size === "story" ? 135 : 180,
            aspectRatio: `${CARD_SIZES[size].w} / ${CARD_SIZES[size].h}`,
            maxWidth: "100%",
            border: "1px solid var(--line)",
            background: "var(--soft)",
            display: "grid",
            placeItems: "center",
            overflow: "hidden",
          }}
        >
          {preview && !busy ? (
            // blob: URL 미리보기라 next/image 최적화 대상이 아님
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="결과 카드 미리보기" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <small className="muted">만드는 중…</small>
          )}
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button type="button" className="btn" onClick={save} disabled={busy || !preview}>이미지 저장</button>
          <button type="button" className="btn ghost" onClick={share} disabled={busy || !preview}>공유하기</button>
        </div>
      </div>
      {msg && <p className="note" role="status" style={{ marginTop: 10 }}>{msg}</p>}
    </div>
  );
}
