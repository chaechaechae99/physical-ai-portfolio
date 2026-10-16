"use client";

import { useActionState } from "react";
import { createProduct } from "@/actions/admin";
import type { Category } from "@/types/db";

export default function NewProductForm({ categories }: { categories: Category[] }) {
  const [state, action, pending] = useActionState(createProduct, undefined);

  return (
    <details className="card p-5">
      <summary className="cursor-pointer font-bold">+ 새 상품 등록</summary>
      <form action={action} className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="np-name">상품명</label>
          <input id="np-name" name="name" required className="input" />
        </div>
        <div>
          <label className="label" htmlFor="np-slug">슬러그 (URL)</label>
          <input id="np-slug" name="slug" required pattern="[a-z0-9-]+" placeholder="arduino-uno-r3" className="input" />
        </div>
        <div>
          <label className="label" htmlFor="np-cat">카테고리</label>
          <select id="np-cat" name="category_id" className="input">
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="np-sku">부품번호 (SKU)</label>
          <input id="np-sku" name="sku" className="input" />
        </div>
        <div>
          <label className="label" htmlFor="np-price">가격 (원)</label>
          <input id="np-price" name="price" type="number" min={0} required className="input" />
        </div>
        <div>
          <label className="label" htmlFor="np-stock">재고</label>
          <input id="np-stock" name="stock" type="number" min={0} required className="input" />
        </div>
        <div className="sm:col-span-2">
          <label className="label" htmlFor="np-summary">한 줄 설명</label>
          <input id="np-summary" name="summary" className="input" />
        </div>
        <div className="sm:col-span-2">
          <label className="label" htmlFor="np-img">이미지 경로</label>
          <input id="np-img" name="image_url" placeholder="/images/products/파일명.jpg" className="input" />
        </div>
        <div className="flex items-center gap-3 sm:col-span-2">
          <button className="btn-primary" disabled={pending}>
            {pending ? "등록 중…" : "등록"}
          </button>
          {state?.error && <span className="text-sm text-red-600">{state.error}</span>}
          {state?.message && <span className="text-sm text-brand-700">{state.message}</span>}
        </div>
      </form>
    </details>
  );
}
