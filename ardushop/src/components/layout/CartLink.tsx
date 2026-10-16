"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { cartCount, useCart } from "@/stores/cart";

export default function CartLink() {
  const items = useCart((s) => s.items);
  // localStorage 복원 전 서버 렌더와 불일치하지 않도록 마운트 후 표시
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const count = mounted ? cartCount(items) : 0;

  return (
    <Link href="/cart" className="relative ml-1 rounded-md bg-brand-600 px-3 py-2 font-semibold text-white hover:bg-brand-700">
      장바구니
      {count > 0 && (
        <span className="absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-accent-500 px-1 text-xs font-bold">
          {count}
        </span>
      )}
    </Link>
  );
}
