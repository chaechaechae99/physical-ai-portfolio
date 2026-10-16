import Link from "next/link";

export default function NotFound() {
  return (
    <div className="panel" style={{ textAlign: "center", padding: "48px 22px" }}>
      <h1 className="pagetitle">페이지를 찾을 수 없어요</h1>
      <p className="muted">주소가 바뀌었거나 없는 페이지예요.</p>
      <Link href="/" className="btn" style={{ display: "inline-block", marginTop: 12, textDecoration: "none" }}>홈으로</Link>
    </div>
  );
}
