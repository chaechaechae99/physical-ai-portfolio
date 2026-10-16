import Image from "next/image";
import Link from "next/link";
import { won } from "@/lib/utils/format";
import type { Product } from "@/types/db";

export default function ProductCard({ product }: { product: Product }) {
  const soldOut = product.stock <= 0;
  return (
    <Link
      href={`/products/${product.slug}`}
      className="group card flex flex-col overflow-hidden transition hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
        {product.image_url && (
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition duration-300 group-hover:scale-105"
          />
        )}
        {soldOut && (
          <span className="absolute inset-0 grid place-items-center bg-black/50 text-sm font-bold text-white">품절</span>
        )}
        {product.is_featured && !soldOut && (
          <span className="absolute left-2 top-2 rounded bg-accent-500 px-2 py-0.5 text-xs font-bold text-white">BEST</span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-3.5">
        {product.sku && <p className="text-xs text-gray-400">{product.sku}</p>}
        <h3 className="mt-0.5 line-clamp-2 text-sm font-semibold text-gray-900">{product.name}</h3>
        {product.summary && <p className="mt-1 line-clamp-2 text-xs text-gray-500">{product.summary}</p>}
        <p className="mt-auto pt-3 text-base font-extrabold text-gray-900">{won(product.price)}</p>
      </div>
    </Link>
  );
}
