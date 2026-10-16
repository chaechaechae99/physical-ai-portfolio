"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { placeDemoOrder, type DemoOrderReceipt } from "@/actions/order";
import { cartSubtotal, useCart } from "@/stores/cart";
import { shippingFor, won } from "@/lib/utils/format";

function Receipt({ receipt }: { receipt: DemoOrderReceipt }) {
  return (
    <div className="mx-auto max-w-xl space-y-4">
      <div className="card border-brand-500 bg-brand-50 p-6 text-center">
        <p className="text-lg font-bold text-brand-900">체험 주문이 완료되었습니다!</p>
        <p className="mt-1 text-sm text-brand-700">주문번호 {receipt.order_no}</p>
      </div>
      <section className="card p-5">
        <ul className="divide-y divide-gray-100 text-sm">
          {receipt.items.map((i) => (
            <li key={i.name} className="flex justify-between gap-4 py-2.5">
              <span>
                {i.name} <span className="text-gray-400">× {i.quantity}</span>
              </span>
              <span className="shrink-0">{won(i.unit_price * i.quantity)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-4 space-y-1.5 border-t border-gray-200 pt-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-gray-500">상품금액</dt>
            <dd>{won(receipt.subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">배송비</dt>
            <dd>{receipt.shipping_fee === 0 ? "무료" : won(receipt.shipping_fee)}</dd>
          </div>
          <div className="flex justify-between text-base font-extrabold">
            <dt>결제금액 (체험)</dt>
            <dd>{won(receipt.total)}</dd>
          </div>
        </dl>
      </section>
      <p className="text-center text-sm text-gray-500">실제 결제·배송은 이루어지지 않습니다.</p>
      <div className="text-center">
        <Link href="/products" className="btn-primary">
          계속 둘러보기
        </Link>
      </div>
    </div>
  );
}

export default function CheckoutForm() {
  const { items, clear } = useCart();
  const [mounted, setMounted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<DemoOrderReceipt | null>(null);
  const [pending, startTransition] = useTransition();
  useEffect(() => setMounted(true), []);

  if (!mounted) return <div className="card h-64 animate-pulse" />;
  if (receipt) return <Receipt receipt={receipt} />;

  if (items.length === 0) {
    return (
      <div className="card p-12 text-center">
        <p className="text-gray-500">주문할 상품이 없습니다.</p>
        <Link href="/products" className="btn-primary mt-6">
          쇼핑하러 가기
        </Link>
      </div>
    );
  }

  const subtotal = cartSubtotal(items);
  const shipping = shippingFor(subtotal);

  const submit = () => {
    setError(null);
    startTransition(async () => {
      const res = await placeDemoOrder(items.map((i) => ({ product_id: i.productId, quantity: i.quantity })));
      if (res.error || !res.receipt) {
        setError(res.error ?? "주문에 실패했습니다.");
        return;
      }
      clear();
      setReceipt(res.receipt);
    });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <div className="space-y-6">
        <section className="card p-5">
          <h2 className="mb-3 font-bold">주문 상품 {items.length}종</h2>
          <ul className="divide-y divide-gray-100 text-sm">
            {items.map((i) => (
              <li key={i.productId} className="flex justify-between gap-4 py-2">
                <span className="line-clamp-1">
                  {i.name} <span className="text-gray-400">× {i.quantity}</span>
                </span>
                <span className="shrink-0">{won(i.price * i.quantity)}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="card p-5 text-sm text-gray-600">
          <h2 className="mb-2 font-bold text-gray-900">체험 주문 안내</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>교육용 데모 사이트라 이름·연락처·주소를 받지 않습니다.</li>
            <li>실제 결제와 배송은 이루어지지 않으며, 재고도 줄어들지 않습니다.</li>
            <li>주문 기록은 관리자 페이지 실습에 사용됩니다.</li>
          </ul>
        </section>
      </div>

      <aside className="card h-fit space-y-3 p-5 lg:sticky lg:top-32">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">상품금액</span>
          <span>{won(subtotal)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">배송비</span>
          <span>{shipping === 0 ? "무료" : won(shipping)}</span>
        </div>
        <div className="flex justify-between border-t border-gray-200 pt-3 text-lg font-extrabold">
          <span>결제예정금액</span>
          <span className="text-brand-700">{won(subtotal + shipping)}</span>
        </div>
        {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <button className="btn-primary w-full py-3.5" disabled={pending} onClick={submit}>
          {pending ? "주문 처리 중…" : "체험 주문하기"}
        </button>
        <p className="text-xs text-gray-400">최종 금액은 주문 시점에 서버에서 다시 계산합니다.</p>
      </aside>
    </div>
  );
}
