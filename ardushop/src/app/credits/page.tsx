import type { Metadata } from "next";
import credits from "../../../public/images/credits.json";

export const metadata: Metadata = { title: "이미지 출처" };

type Credit = { file: string; source: string; author: string; license: string };

export default function CreditsPage() {
  const rows = Object.values(credits as Record<string, Credit>);
  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-bold">이미지 출처 및 라이선스</h1>
      <p className="mt-2 text-sm text-gray-500">
        상품·배너 사진은 Wikimedia Commons의 자유 라이선스 이미지를 축소해 사용한 참고 이미지입니다. 실제 판매 상품과
        외형이 다를 수 있습니다.
      </p>
      <div className="card mt-6 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-600">
            <tr>
              <th className="px-3 py-2">파일</th>
              <th className="px-3 py-2">저작자</th>
              <th className="px-3 py-2">라이선스</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.file} className="border-t border-gray-100">
                <td className="px-3 py-2">
                  <a href={c.source} target="_blank" rel="noreferrer" className="text-brand-700 underline">
                    {c.file.split("/").pop()}
                  </a>
                </td>
                <td className="px-3 py-2 text-gray-600">{c.author || "—"}</td>
                <td className="px-3 py-2">{c.license}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
