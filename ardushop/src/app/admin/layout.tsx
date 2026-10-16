import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/data";

const NAV = [
  { href: "/admin", label: "대시보드" },
  { href: "/admin/products", label: "상품 관리" },
  { href: "/admin/inventory", label: "재고 관리" },
  { href: "/admin/orders", label: "주문 관리" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getCurrentUser();
  if (!session) redirect("/login?next=/admin");
  if (session.profile?.role !== "admin") notFound();

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">관리자</h1>
        <nav className="flex gap-1 overflow-x-auto text-sm">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="shrink-0 rounded-md px-3 py-2 hover:bg-gray-100">
              {n.label}
            </Link>
          ))}
        </nav>
      </div>
      {children}
    </div>
  );
}
