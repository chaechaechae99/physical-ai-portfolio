import { ORDER_STATUS } from "@/lib/utils/format";

export default function StatusBadge({ status }: { status: string }) {
  const s = ORDER_STATUS[status] ?? { label: status, tone: "bg-gray-100 text-gray-700" };
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${s.tone}`}>{s.label}</span>;
}
