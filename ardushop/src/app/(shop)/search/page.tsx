import type { Metadata } from "next";
import { getProducts } from "@/lib/data";
import ProductGrid from "@/components/product/ProductGrid";
import SortTabs, { parseSort } from "@/components/product/SortTabs";

export const metadata: Metadata = { title: "검색" };

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string; sort?: string }> }) {
  const { q = "", sort: rawSort } = await searchParams;
  const query = q.trim().slice(0, 50);
  const sort = parseSort(rawSort);
  const products = query ? await getProducts({ query, sort }) : [];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">
        {query ? (
          <>
            &ldquo;<span className="text-brand-700">{query}</span>&rdquo; 검색 결과
          </>
        ) : (
          "검색어를 입력해 주세요"
        )}
      </h1>
      {query && (
        <>
          <SortTabs basePath="/search" current={sort} params={{ q: query }} total={products.length} />
          <ProductGrid products={products} />
        </>
      )}
    </div>
  );
}
