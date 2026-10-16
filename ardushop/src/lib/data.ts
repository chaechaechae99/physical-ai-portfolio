import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Category, Product, ProductWithCategory, Profile } from "@/types/db";

export const getCategories = cache(async (): Promise<Category[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase.from("categories").select("*").order("sort_order");
  if (error) throw error;
  return data;
});

export type ProductSort = "popular" | "new" | "price_asc" | "price_desc";

export const SORT_OPTIONS: { value: ProductSort; label: string }[] = [
  { value: "popular", label: "추천순" },
  { value: "new", label: "최신순" },
  { value: "price_asc", label: "낮은가격순" },
  { value: "price_desc", label: "높은가격순" },
];

export async function getProducts(opts: {
  categoryId?: number;
  query?: string;
  sort?: ProductSort;
  featured?: boolean;
  limit?: number;
} = {}): Promise<Product[]> {
  const supabase = await createClient();
  let q = supabase.from("products").select("*").eq("is_active", true);

  if (opts.categoryId) q = q.eq("category_id", opts.categoryId);
  if (opts.featured) q = q.eq("is_featured", true);
  if (opts.query) {
    // PostgREST or() 구문을 깨뜨리는 문자 제거
    const term = opts.query.replace(/[,()*%\\"]/g, " ").trim();
    if (term) q = q.or(`name.ilike.%${term}%,summary.ilike.%${term}%,sku.ilike.%${term}%`);
  }

  switch (opts.sort) {
    case "new":
      q = q.order("created_at", { ascending: false }).order("id", { ascending: false });
      break;
    case "price_asc":
      q = q.order("price", { ascending: true });
      break;
    case "price_desc":
      q = q.order("price", { ascending: false });
      break;
    default:
      q = q.order("is_featured", { ascending: false }).order("id");
  }
  if (opts.limit) q = q.limit(opts.limit);

  const { data, error } = await q;
  if (error) throw error;
  return data;
}

export const getProduct = cache(async (slug: string): Promise<ProductWithCategory | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("*, categories(slug, name)")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return data;
});

export const getCurrentUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle<Profile>();
  return { user, profile };
});
