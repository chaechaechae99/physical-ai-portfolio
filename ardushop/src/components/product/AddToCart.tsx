"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCart } from "@/stores/cart";
import type { Product } from "@/types/db";

export default function AddToCart({ product }: { product: Product }) {
  const add = useCart((s) => s.add);
  const router = useRouter();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const soldOut = product.stock <= 0;
  const max = Math.min(product.stock, 99);

  const put = () => {
    add(
      { productId: product.id, slug: product.slug, name: product.name, price: product.price, imageUrl: product.image_url, stock: product.stock },
      qty,
    );
  };

  if (soldOut) return <button className="btn-primary w-full py-3.5" disabled>품절</button>;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-600">수량</span>
        <div className="flex items-center rounded-lg border border-gray-300 bg-white">
          <button className="px-3 py-2 text-lg leading-none" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="수량 감소">
            −
          </button>
          <input
            className="w-12 border-x border-gray-300 py-2 text-center text-sm outline-none"
            value={qty}
            inputMode="numeric"
            onChange={(e) => {
              const n = parseInt(e.target.value, 10);
              setQty(Number.isNaN(n) ? 1 : Math.max(1, Math.min(n, max)));
            }}
            aria-label="수량"
          />
          <button className="px-3 py-2 text-lg leading-none" onClick={() => setQty((q) => Math.min(max, q + 1))} aria-label="수량 증가">
            +
          </button>
        </div>
        <span className="text-xs text-gray-400">재고 {product.stock}개</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <button
          className="btn-outline py-3.5"
          onClick={() => {
            put();
            setAdded(true);
          }}
        >
          장바구니 담기
        </button>
        <button
          className="btn-primary py-3.5"
          onClick={() => {
            put();
            router.push("/cart");
          }}
        >
          바로 구매
        </button>
      </div>
      {added && (
        <p className="rounded-lg bg-brand-50 px-3 py-2 text-sm text-brand-700">
          장바구니에 담았습니다.{" "}
          <button className="font-semibold underline" onClick={() => router.push("/cart")}>
            장바구니 보기
          </button>
        </p>
      )}
    </div>
  );
}
