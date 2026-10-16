import { createClient } from "@/lib/supabase/server";
import { getCategories } from "@/lib/data";
import ProductTable from "@/components/admin/ProductTable";
import NewProductForm from "@/components/admin/NewProductForm";
import type { Product } from "@/types/db";

export default async function AdminProductsPage() {
  const supabase = await createClient();
  const [categories, { data: products }] = await Promise.all([
    getCategories(),
    supabase.from("products").select("*").order("category_id").order("id").returns<Product[]>(),
  ]);

  return (
    <div className="space-y-4">
      <NewProductForm categories={categories} />
      <ProductTable products={products ?? []} />
    </div>
  );
}
