import Image from "next/image";
import Link from "next/link";
import { getCategories, getProducts } from "@/lib/data";
import ProductGrid from "@/components/product/ProductGrid";

export default async function HomePage() {
  const [categories, featured, newest] = await Promise.all([
    getCategories(),
    getProducts({ featured: true, limit: 8 }),
    getProducts({ sort: "new", limit: 4 }),
  ]);

  return (
    <>
      <section className="relative overflow-hidden bg-brand-900">
        <Image
          src="/images/banners/hero-closeup.jpg"
          alt="점퍼선이 연결된 아두이노 우노 보드"
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-40"
        />
        <div className="relative mx-auto max-w-6xl px-4 py-20 text-white md:py-28">
          <p className="text-sm font-semibold tracking-widest text-brand-100">ARDUINO PARTS STORE</p>
          <h1 className="mt-3 text-3xl font-extrabold leading-tight md:text-5xl">
            상상한 프로젝트,
            <br />
            부품은 아두몰에서.
          </h1>
          <p className="mt-4 max-w-md text-brand-50/90">
            정품·호환 보드부터 센서, 모터, 디스플레이, 입문 키트까지. 3만원 이상 무료배송.
          </p>
          <div className="mt-8 flex gap-3">
            <Link href="/products" className="btn bg-white px-6 py-3 text-brand-900 hover:bg-brand-50">
              전체 상품 보기
            </Link>
            <Link href="/categories/kits" className="btn border border-white/60 px-6 py-3 text-white hover:bg-white/10">
              입문 키트
            </Link>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4">
        <section className="mt-10">
          <h2 className="mb-4 text-xl font-bold">카테고리</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
            {categories.map((c) => (
              <Link
                key={c.id}
                href={`/categories/${c.slug}`}
                className="card p-4 transition hover:border-brand-500 hover:shadow-md"
              >
                <p className="font-semibold text-gray-900">{c.name}</p>
                <p className="mt-1 line-clamp-2 text-xs text-gray-500">{c.description}</p>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-12">
          <div className="mb-4 flex items-end justify-between">
            <h2 className="text-xl font-bold">인기 상품</h2>
            <Link href="/products" className="text-sm text-brand-700 hover:underline">
              더보기 →
            </Link>
          </div>
          <ProductGrid products={featured} />
        </section>

        <section className="mt-12 grid items-center overflow-hidden rounded-2xl bg-white md:grid-cols-2">
          <div className="relative aspect-[4/3] md:aspect-auto md:h-full md:min-h-72">
            <Image
              src="/images/banners/hero-collection.jpg"
              alt="여러 종류의 마이크로컨트롤러 보드"
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
          <div className="p-6 md:p-10">
            <p className="text-sm font-semibold text-accent-500">처음이라면</p>
            <h2 className="mt-2 text-2xl font-bold">호환 보드로 부담 없이 시작하세요</h2>
            <p className="mt-3 text-gray-600">
              우노 호환보드 5,500원부터. 센서 모듈은 1,000원대부터 준비되어 있어 실습용으로 넉넉하게 구성할 수 있습니다.
            </p>
            <Link href="/categories/compatible" className="btn-primary mt-6">
              호환 보드 보러가기
            </Link>
          </div>
        </section>

        <section className="mt-12">
          <h2 className="mb-4 text-xl font-bold">새로 들어온 상품</h2>
          <ProductGrid products={newest} />
        </section>
      </div>
    </>
  );
}
