import Link from "next/link";
import { SORT_OPTIONS, type ProductSort } from "@/lib/data";

export default function SortTabs({
  basePath,
  current,
  params = {},
  total,
}: {
  basePath: string;
  current: ProductSort;
  params?: Record<string, string>;
  total: number;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
      <p className="text-sm text-gray-500">
        전체 <b className="text-gray-900">{total}</b>개
      </p>
      <div className="flex gap-1 text-sm">
        {SORT_OPTIONS.map((o) => {
          const qs = new URLSearchParams({ ...params, sort: o.value }).toString();
          const active = o.value === current;
          return (
            <Link
              key={o.value}
              href={`${basePath}?${qs}`}
              className={`rounded-md px-2.5 py-1.5 ${active ? "bg-brand-900 font-semibold text-white" : "text-gray-600 hover:bg-gray-100"}`}
            >
              {o.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export const parseSort = (v: string | string[] | undefined): ProductSort =>
  SORT_OPTIONS.some((o) => o.value === v) ? (v as ProductSort) : "popular";
