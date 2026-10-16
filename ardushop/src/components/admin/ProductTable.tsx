"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useTransition } from "react";
import { updateProduct } from "@/actions/admin";
import { LOW_STOCK, won } from "@/lib/utils/format";
import type { Product } from "@/types/db";

function Row({ product }: { product: Product }) {
  const [price, setPrice] = useState(String(product.price));
  const [stock, setStock] = useState(String(product.stock));
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const dirty = price !== String(product.price) || stock !== String(product.stock);

  const save = (patch: Parameters<typeof updateProduct>[1]) =>
    startTransition(async () => {
      const res = await updateProduct(product.id, patch);
      setMsg(res.error ? { ok: false, text: res.error } : { ok: true, text: "저장됨" });
    });

  return (
    <tr className="border-t border-gray-100 align-middle">
      <td className="px-3 py-2">
        <div className="flex items-center gap-3">
          <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded bg-gray-100">
            {product.image_url && <Image src={product.image_url} alt="" fill sizes="40px" className="object-cover" />}
          </div>
          <div className="min-w-0">
            <Link href={`/products/${product.slug}`} className="line-clamp-1 font-medium hover:underline">
              {product.name}
            </Link>
            <p className="text-xs text-gray-400">{product.sku}</p>
          </div>
        </div>
      </td>
      <td className="px-3 py-2">
        <input className="input w-28 py-1.5" inputMode="numeric" value={price} onChange={(e) => setPrice(e.target.value)} />
        <p className="mt-0.5 text-xs text-gray-400">{won(product.price)}</p>
      </td>
      <td className="px-3 py-2">
        <input
          className={`input w-20 py-1.5 ${product.stock <= LOW_STOCK ? "border-amber-400" : ""}`}
          inputMode="numeric"
          value={stock}
          onChange={(e) => setStock(e.target.value)}
        />
      </td>
      <td className="px-3 py-2 text-center">
        <input
          type="checkbox"
          defaultChecked={product.is_featured}
          className="h-4 w-4 accent-brand-600"
          onChange={(e) => save({ is_featured: e.target.checked })}
          aria-label="추천 상품"
        />
      </td>
      <td className="px-3 py-2 text-center">
        <input
          type="checkbox"
          defaultChecked={product.is_active}
          className="h-4 w-4 accent-brand-600"
          onChange={(e) => save({ is_active: e.target.checked })}
          aria-label="판매중"
        />
      </td>
      <td className="px-3 py-2">
        <button
          className="btn-primary px-3 py-1.5"
          disabled={!dirty || pending}
          onClick={() => save({ price: Number(price), stock: Number(stock) })}
        >
          저장
        </button>
        {msg && <p className={`mt-0.5 text-xs ${msg.ok ? "text-brand-700" : "text-red-600"}`}>{msg.text}</p>}
      </td>
    </tr>
  );
}

export default function ProductTable({ products }: { products: Product[] }) {
  return (
    <div className="card overflow-x-auto">
      <table className="w-full min-w-[720px] text-sm">
        <thead className="bg-gray-50 text-left text-gray-600">
          <tr>
            <th className="px-3 py-2">상품</th>
            <th className="px-3 py-2">가격</th>
            <th className="px-3 py-2">재고</th>
            <th className="px-3 py-2 text-center">추천</th>
            <th className="px-3 py-2 text-center">판매중</th>
            <th className="px-3 py-2"></th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <Row key={`${p.id}-${p.price}-${p.stock}`} product={p} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
