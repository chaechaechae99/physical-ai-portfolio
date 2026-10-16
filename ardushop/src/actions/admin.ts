"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { OrderStatus } from "@/types/db";

// RLS가 최종 방어선이지만, 명확한 에러 메시지를 위해 여기서도 확인한다.
async function adminClient() {
  const supabase = await createClient();
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) throw new Error("관리자 권한이 필요합니다.");
  return supabase;
}

export async function updateProduct(
  id: number,
  patch: { price?: number; stock?: number; is_active?: boolean; is_featured?: boolean },
): Promise<{ error?: string }> {
  try {
    const supabase = await adminClient();
    if (patch.price !== undefined && (!Number.isInteger(patch.price) || patch.price < 0)) return { error: "가격이 올바르지 않습니다." };
    if (patch.stock !== undefined && (!Number.isInteger(patch.stock) || patch.stock < 0)) return { error: "재고가 올바르지 않습니다." };
    const { error } = await supabase.from("products").update(patch).eq("id", id);
    if (error) return { error: error.message };
  } catch (e) {
    return { error: (e as Error).message };
  }
  revalidatePath("/", "layout");
  return {};
}

export type NewProductState = { error?: string; message?: string } | undefined;

export async function createProduct(_: NewProductState, formData: FormData): Promise<NewProductState> {
  try {
    const supabase = await adminClient();
    const name = String(formData.get("name") ?? "").trim();
    const slug = String(formData.get("slug") ?? "").trim().toLowerCase();
    const price = Number(formData.get("price"));
    const stock = Number(formData.get("stock"));
    if (!name || !/^[a-z0-9-]+$/.test(slug)) return { error: "이름과 슬러그(영문 소문자·숫자·-)를 확인해 주세요." };
    if (!Number.isInteger(price) || price < 0 || !Number.isInteger(stock) || stock < 0) return { error: "가격·재고는 0 이상의 정수여야 합니다." };

    const { error } = await supabase.from("products").insert({
      name,
      slug,
      price,
      stock,
      category_id: Number(formData.get("category_id")),
      sku: String(formData.get("sku") ?? "").trim() || null,
      summary: String(formData.get("summary") ?? "").trim() || null,
      image_url: String(formData.get("image_url") ?? "").trim() || null,
    });
    if (error) return { error: error.code === "23505" ? "이미 사용 중인 슬러그입니다." : error.message };
  } catch (e) {
    return { error: (e as Error).message };
  }
  revalidatePath("/", "layout");
  return { message: "상품이 등록되었습니다." };
}

export async function updateOrderStatus(orderId: number, status: OrderStatus): Promise<{ error?: string }> {
  try {
    const supabase = await adminClient();
    const { data: current } = await supabase.from("orders").select("status").eq("id", orderId).single();
    if (current?.status === "cancelled") return { error: "취소된 주문은 상태를 바꿀 수 없습니다." };
    if (status === "cancelled") {
      // 재고 복구가 필요하므로 취소는 DB 함수로 처리
      const { error } = await supabase.rpc("cancel_order", { p_order_id: orderId });
      if (error) return { error: error.message };
    } else {
      const { error } = await supabase.from("orders").update({ status }).eq("id", orderId);
      if (error) return { error: error.message };
    }
  } catch (e) {
    return { error: (e as Error).message };
  }
  revalidatePath("/admin", "layout");
  revalidatePath("/mypage", "layout");
  return {};
}
