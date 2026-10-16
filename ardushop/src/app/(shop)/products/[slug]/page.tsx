import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProduct, getProducts } from "@/lib/data";
import { SHIPPING_FEE, SHIPPING_FREE_OVER, won } from "@/lib/utils/format";
import AddToCart from "@/components/product/AddToCart";
import ProductGrid from "@/components/product/ProductGrid";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await getProduct((await params).slug);
  return p ? { title: p.name, description: p.summary ?? undefined } : {};
}

export default async function ProductPage({ params }: Props) {
  const product = await getProduct((await params).slug);
  if (!product) notFound();

  const related = (await getProducts({ categoryId: product.category_id, limit: 5 }))
    .filter((p) => p.id !== product.id)
    .slice(0, 4);
  const specs = Object.entries(product.specs ?? {});

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <nav className="mb-4 text-sm text-gray-500">
        <Link href="/" className="hover:underline">
          홈
        </Link>
        {product.categories && (
          <>
            {" › "}
            <Link href={`/categories/${product.categories.slug}`} className="hover:underline">
              {product.categories.name}
            </Link>
          </>
        )}
      </nav>

      <div className="grid gap-8 md:grid-cols-2">
        <div>
          <div className="card relative aspect-square overflow-hidden">
            {product.image_url && (
              <Image
                src={product.image_url}
                alt={product.name}
                fill
                priority
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
              />
            )}
          </div>
          {product.image_credit && (
            <p className="mt-2 text-xs text-gray-400">
              참고 이미지 · {product.image_credit.author || "Wikimedia Commons"} ·{" "}
              <a href={product.image_credit.source} target="_blank" rel="noreferrer" className="underline">
                {product.image_credit.license}
              </a>
            </p>
          )}
        </div>

        <div>
          {product.sku && <p className="text-sm text-gray-400">{product.sku}</p>}
          <h1 className="mt-1 text-2xl font-bold leading-snug md:text-3xl">{product.name}</h1>
          {product.summary && <p className="mt-3 text-gray-600">{product.summary}</p>}
          <p className="mt-6 text-3xl font-extrabold">{won(product.price)}</p>
          <p className="mt-2 text-sm text-gray-500">
            배송비 {won(SHIPPING_FEE)} · {won(SHIPPING_FREE_OVER)} 이상 구매 시 무료
          </p>

          <div className="mt-6 border-t border-gray-200 pt-6">
            <AddToCart product={product} />
          </div>

          {specs.length > 0 && (
            <div className="mt-8">
              <h2 className="mb-3 font-bold">주요 사양</h2>
              <table className="card w-full overflow-hidden text-sm">
                <tbody>
                  {specs.map(([k, v]) => (
                    <tr key={k} className="border-b border-gray-200 last:border-0">
                      <th className="w-1/3 bg-gray-50 px-3 py-2.5 text-left font-medium text-gray-600">{k}</th>
                      <td className="px-3 py-2.5">{v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="mb-4 text-xl font-bold">같은 카테고리 상품</h2>
          <ProductGrid products={related} />
        </section>
      )}
    </div>
  );
}
