export default function SearchBox({ defaultValue = "" }: { defaultValue?: string }) {
  return (
    <form action="/search" className="flex">
      <input
        name="q"
        defaultValue={defaultValue}
        placeholder="상품명, 부품번호로 검색 (예: 우노, HC-SR04)"
        className="input rounded-r-none"
        aria-label="상품 검색"
      />
      <button className="shrink-0 whitespace-nowrap rounded-r-lg bg-brand-900 px-4 text-sm font-semibold text-white hover:bg-black">검색</button>
    </form>
  );
}
