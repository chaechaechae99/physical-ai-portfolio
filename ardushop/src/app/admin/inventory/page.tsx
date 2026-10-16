import { createClient } from "@/lib/supabase/server";
import ProductTable from "@/components/admin/ProductTable";
import type { Product } from "@/types/db";
import { LOW_STOCK } from "@/lib/utils/format";

export default async function AdminInventoryPage() {
  const supabase = await createClient();
  const { data: products } = await supabase
    .from("products")
    .select("*")
    .lte("stock", LOW_STOCK)
    .order("stock")
    .returns<Product[]>();

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        재고가 <b>{LOW_STOCK}개 이하</b>인 상품 {products?.length ?? 0}종입니다. 재고 수량을 바로 수정할 수 있습니다.
      </p>
      {products?.length ? (
        <ProductTable products={products} />
      ) : (
        <p className="card p-10 text-center text-gray-500">재고가 부족한 상품이 없습니다.</p>
      )}
    </div>
  );
}
