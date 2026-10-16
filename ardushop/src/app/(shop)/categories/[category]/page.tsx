import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCategories, getProducts } from "@/lib/data";
import ProductGrid from "@/components/product/ProductGrid";
import SortTabs, { parseSort } from "@/components/product/SortTabs";

type Props = { params: Promise<{ category: string }>; searchParams: Promise<{ sort?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params;
  const c = (await getCategories()).find((x) => x.slug === category);
  return { title: c?.name ?? "카테고리" };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const [{ category }, { sort: rawSort }] = await Promise.all([params, searchParams]);
  const c = (await getCategories()).find((x) => x.slug === category);
  if (!c) notFound();

  const sort = parseSort(rawSort);
  const products = await getProducts({ categoryId: c.id, sort });

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-bold">{c.name}</h1>
      {c.description && <p className="mb-6 mt-1 text-gray-500">{c.description}</p>}
      <SortTabs basePath={`/categories/${c.slug}`} current={sort} total={products.length} />
      <ProductGrid products={products} />
    </div>
  );
}
