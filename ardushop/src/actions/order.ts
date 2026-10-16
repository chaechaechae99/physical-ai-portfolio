"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type DemoOrderReceipt = {
  order_no: string;
  subtotal: number;
  shipping_fee: number;
  total: number;
  items: { name: string; unit_price: number; quantity: number }[];
};

// 교육용 체험 주문: 회원·배송 정보 없이 주문만 기록한다 (재고 차감 없음)
export async function placeDemoOrder(
  items: { product_id: number; quantity: number }[],
): Promise<{ receipt?: DemoOrderReceipt; error?: string }> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("place_demo_order", { p_items: items });
  if (error) return { error: error.message };

  revalidatePath("/admin", "layout");
  return { receipt: data as DemoOrderReceipt };
}
