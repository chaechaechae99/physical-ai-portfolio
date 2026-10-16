"use client";

import { useState, useTransition } from "react";
import { updateOrderStatus } from "@/actions/admin";
import { ORDER_STATUS } from "@/lib/utils/format";
import type { OrderStatus } from "@/types/db";

export default function OrderStatusSelect({ orderId, status }: { orderId: number; status: OrderStatus }) {
  const [value, setValue] = useState(status);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div>
      <select
        className="input w-32 py-1.5"
        value={value}
        disabled={pending || status === "cancelled"}
        onChange={(e) => {
          const next = e.target.value as OrderStatus;
          const prev = value;
          setValue(next);
          setError(null);
          startTransition(async () => {
            const res = await updateOrderStatus(orderId, next);
            if (res.error) {
              setValue(prev);
              setError(res.error);
            }
          });
        }}
      >
        {Object.entries(ORDER_STATUS).map(([k, v]) => (
          <option key={k} value={k}>
            {v.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 max-w-40 text-xs text-red-600">{error}</p>}
    </div>
  );
}
