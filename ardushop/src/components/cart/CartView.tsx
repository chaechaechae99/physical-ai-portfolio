"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { cartSubtotal, useCart } from "@/stores/cart";
import { shippingFor, SHIPPING_FREE_OVER, won } from "@/lib/utils/format";

export default function CartView() {
  const { items, setQuantity, remove } = useCart();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return <div className="card h-48 animate-pulse" />;

  if (items.length === 0) {
    return (
      <div className="card p-12 text-center">
        <p className="text-gray-500">장바구니가 비어 있습니다.</p>
        <Link href="/products" className="btn-primary mt-6">
          쇼핑하러 가기
        </Link>
      </div>
    );
  }

  const subtotal = cartSubtotal(items);
  const shipping = shippingFor(subtotal);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <ul className="card divide-y divide-gray-100">
        {items.map((i) => (
          <li key={i.productId} className="flex gap-4 p-4">
            <Link href={`/products/${i.slug}`} className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-gray-100">
              {i.imageUrl && <Image src={i.imageUrl} alt={i.name} fill sizes="80px" className="object-cover" />}
            </Link>
            <div className="flex min-w-0 flex-1 flex-col">
              <Link href={`/products/${i.slug}`} className="line-clamp-2 text-sm font-semibold hover:text-brand-700">
                {i.name}
              </Link>
              <p className="text-sm text-gray-500">{won(i.price)}</p>
              <div className="mt-auto flex items-center justify-between pt-2">
                <div className="flex items-center rounded-lg border border-gray-300">
                  <button className="px-2.5 py-1" onClick={() => setQuantity(i.productId, i.quantity - 1)} aria-label="수량 감소">
                    −
                  </button>
                  <span className="w-9 text-center text-sm">{i.quantity}</span>
                  <button className="px-2.5 py-1" onClick={() => setQuantity(i.productId, i.quantity + 1)} aria-label="수량 증가">
                    +
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold">{won(i.price * i.quantity)}</span>
                  <button className="text-xs text-gray-400 hover:text-red-600" onClick={() => remove(i.productId)}>
                    삭제
                  </button>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <aside className="card h-fit space-y-3 p-5 lg:sticky lg:top-32">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">상품금액</span>
          <span>{won(subtotal)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">배송비</span>
          <span>{shipping === 0 ? "무료" : won(shipping)}</span>
        </div>
        {shipping > 0 && (
          <p className="rounded-md bg-brand-50 px-3 py-2 text-xs text-brand-700">
            {won(SHIPPING_FREE_OVER - subtotal)} 더 담으면 무료배송!
          </p>
        )}
        <div className="flex justify-between border-t border-gray-200 pt-3 text-lg font-extrabold">
          <span>결제예정금액</span>
          <span>{won(subtotal + shipping)}</span>
        </div>
        <Link href="/checkout" className="btn-primary w-full py-3.5">
          체험 주문하기
        </Link>
      </aside>
    </div>
  );
}
