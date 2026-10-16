import { createClient } from "@/lib/supabase/server";
import { formatDate, won } from "@/lib/utils/format";
import OrderStatusSelect from "@/components/admin/OrderStatusSelect";
import type { Order, OrderItem } from "@/types/db";

export default async function AdminOrdersPage() {
  const supabase = await createClient();
  const { data: orders } = await supabase
    .from("orders")
    .select("*, order_items(product_name, quantity)")
    .order("created_at", { ascending: false })
    .returns<(Order & { order_items: Pick<OrderItem, "product_name" | "quantity">[] })[]>();

  if (!orders?.length) return <p className="card p-10 text-center text-gray-500">주문이 없습니다.</p>;

  return (
    <div className="card overflow-x-auto">
      <table className="w-full min-w-[820px] text-sm">
        <thead className="bg-gray-50 text-left text-gray-600">
          <tr>
            <th className="px-3 py-2">주문일시 / 번호</th>
            <th className="px-3 py-2">상품</th>
            <th className="px-3 py-2">배송지</th>
            <th className="px-3 py-2 text-right">금액</th>
            <th className="px-3 py-2">상태</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id} className="border-t border-gray-100 align-top">
              <td className="px-3 py-2.5">
                <p className="text-gray-400">{formatDate(o.created_at)}</p>
                <p className="font-medium">{o.order_no}</p>
              </td>
              <td className="px-3 py-2.5">
                {o.order_items.map((i, idx) => (
                  <p key={idx}>
                    {i.product_name} <span className="text-gray-400">× {i.quantity}</span>
                  </p>
                ))}
              </td>
              <td className="px-3 py-2.5">
                {o.recipient ? (
                  <>
                    <p>
                      {o.recipient} · {o.phone}
                    </p>
                    <p className="text-gray-500">{o.address}</p>
                  </>
                ) : (
                  <span className="text-gray-400">체험 주문 (배송정보 없음)</span>
                )}
              </td>
              <td className="px-3 py-2.5 text-right font-semibold">{won(o.total)}</td>
              <td className="px-3 py-2.5">
                <OrderStatusSelect orderId={o.id} status={o.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
