import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatDate, LOW_STOCK, won } from "@/lib/utils/format";
import StatusBadge from "@/components/StatusBadge";
import type { Order } from "@/types/db";


export default async function AdminDashboard() {
  const supabase = await createClient();
  const [{ data: orders }, { count: productCount }, { count: lowStock }] = await Promise.all([
    supabase.from("orders").select("*").order("created_at", { ascending: false }).returns<Order[]>(),
    supabase.from("products").select("id", { count: "exact", head: true }),
    supabase.from("products").select("id", { count: "exact", head: true }).lte("stock", LOW_STOCK),
  ]);

  const valid = (orders ?? []).filter((o) => o.status !== "cancelled");
  const revenue = valid.reduce((n, o) => n + o.total, 0);
  const toShip = valid.filter((o) => o.status === "paid").length;

  const stats = [
    { label: "누적 매출", value: won(revenue) },
    { label: "주문 수", value: `${valid.length}건` },
    { label: "배송 대기", value: `${toShip}건`, href: "/admin/orders" },
    { label: `재고 ${LOW_STOCK}개 이하`, value: `${lowStock ?? 0} / ${productCount ?? 0}종`, href: "/admin/inventory" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => {
          const body = (
            <>
              <p className="text-sm text-gray-500">{s.label}</p>
              <p className="mt-1 text-2xl font-extrabold">{s.value}</p>
            </>
          );
          return s.href ? (
            <Link key={s.label} href={s.href} className="card p-5 hover:border-brand-500">
              {body}
            </Link>
          ) : (
            <div key={s.label} className="card p-5">
              {body}
            </div>
          );
        })}
      </div>

      <section className="card p-5">
        <h2 className="mb-3 font-bold">최근 주문</h2>
        {orders?.length ? (
          <ul className="divide-y divide-gray-100 text-sm">
            {orders.slice(0, 8).map((o) => (
              <li key={o.id} className="flex flex-wrap items-center gap-3 py-2.5">
                <span className="w-40 text-gray-400">{formatDate(o.created_at)}</span>
                <span className="flex-1">
                  {o.order_no} · {o.recipient ?? "체험 주문"}
                </span>
                <StatusBadge status={o.status} />
                <span className="w-24 text-right font-semibold">{won(o.total)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500">아직 주문이 없습니다.</p>
        )}
      </section>
    </div>
  );
}
