import Link from "next/link";
import { getCategories, getCurrentUser } from "@/lib/data";
import { signOut } from "@/actions/auth";
import CartLink from "./CartLink";
import SearchBox from "./SearchBox";

export default async function Header() {
  const [categories, session] = await Promise.all([getCategories(), getCurrentUser()]);
  const isAdmin = session?.profile?.role === "admin";

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-600 text-lg font-black text-white">∞</span>
          <span className="text-xl font-extrabold tracking-tight text-brand-900">아두몰</span>
        </Link>
        <div className="hidden flex-1 md:block">
          <SearchBox />
        </div>
        <nav className="ml-auto flex items-center gap-1 text-sm">
          {session && (
            <>
              {isAdmin && (
                <Link href="/admin" className="rounded-md px-2.5 py-2 font-semibold text-accent-500 hover:bg-gray-100">
                  관리자
                </Link>
              )}
              <form action={signOut}>
                <button className="rounded-md px-2.5 py-2 text-gray-500 hover:bg-gray-100">로그아웃</button>
              </form>
            </>
          )}
          <CartLink />
        </nav>
      </div>
      <div className="px-4 pb-3 md:hidden">
        <SearchBox />
      </div>
      <div className="border-t border-gray-100">
        <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 text-sm">
          <Link href="/products" className="shrink-0 px-3 py-2.5 font-semibold text-gray-800 hover:text-brand-700">
            전체상품
          </Link>
          {categories.map((c) => (
            <Link
              key={c.id}
              href={`/categories/${c.slug}`}
              className="shrink-0 px-3 py-2.5 text-gray-600 hover:text-brand-700"
            >
              {c.name}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
