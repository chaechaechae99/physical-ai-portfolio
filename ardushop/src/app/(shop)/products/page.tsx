import type { Metadata } from "next";
import { getProducts } from "@/lib/data";
import ProductGrid from "@/components/product/ProductGrid";
import SortTabs, { parseSort } from "@/components/product/SortTabs";

export const metadata: Metadata = { title: "전체상품" };

export default async function ProductsPage({ searchParams }: { searchParams: Promise<{ sort?: string }> }) {
  const sort = parseSort((await searchParams).sort);
  const products = await getProducts({ sort });

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">전체상품</h1>
      <SortTabs basePath="/products" current={sort} total={products.length} />
      <ProductGrid products={products} />
    </div>
  );
}
