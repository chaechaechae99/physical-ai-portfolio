export const won = (n: number) => `${n.toLocaleString("ko-KR")}원`;

export const SHIPPING_FREE_OVER = 30000;
export const SHIPPING_FEE = 3000;
export const shippingFor = (subtotal: number) => (subtotal === 0 || subtotal >= SHIPPING_FREE_OVER ? 0 : SHIPPING_FEE);

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleString("ko-KR", { timeZone: "Asia/Seoul", dateStyle: "medium", timeStyle: "short" });

export const ORDER_STATUS: Record<string, { label: string; tone: string }> = {
  pending: { label: "결제대기", tone: "bg-gray-100 text-gray-700" },
  paid: { label: "결제완료", tone: "bg-blue-50 text-blue-700" },
  shipping: { label: "배송중", tone: "bg-amber-50 text-amber-700" },
  delivered: { label: "배송완료", tone: "bg-emerald-50 text-emerald-700" },
  cancelled: { label: "주문취소", tone: "bg-red-50 text-red-700" },
};
export const LOW_STOCK = 20;
