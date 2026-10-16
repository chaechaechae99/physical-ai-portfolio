-- 아두이노 쇼핑몰 초기 스키마

-- ───────── 테이블 ─────────
create table public.categories (
  id          serial primary key,
  slug        text not null unique,
  name        text not null,
  description text,
  sort_order  int  not null default 0
);

create table public.products (
  id               bigserial primary key,
  category_id      int  not null references public.categories(id),
  slug             text not null unique,
  name             text not null,
  sku              text,
  summary          text,
  price            int  not null check (price >= 0),
  compare_at_price int  check (compare_at_price is null or compare_at_price >= price),
  stock            int  not null default 0 check (stock >= 0),
  specs            jsonb not null default '{}'::jsonb,
  image_url        text,
  image_credit     jsonb,
  is_featured      boolean not null default false,
  is_active        boolean not null default true,
  created_at       timestamptz not null default now()
);
create index products_category_idx on public.products(category_id);

create table public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  name       text,
  phone      text,
  address    text,
  role       text not null default 'customer' check (role in ('customer', 'admin')),
  created_at timestamptz not null default now()
);

create table public.orders (
  id           bigserial primary key,
  order_no     text not null unique,
  user_id      uuid not null references auth.users(id) on delete cascade,
  status       text not null default 'paid'
               check (status in ('pending', 'paid', 'shipping', 'delivered', 'cancelled')),
  subtotal     int not null,
  shipping_fee int not null,
  total        int not null,
  recipient    text not null,
  phone        text not null,
  address      text not null,
  memo         text,
  created_at   timestamptz not null default now()
);
create index orders_user_idx on public.orders(user_id);

create table public.order_items (
  id           bigserial primary key,
  order_id     bigint not null references public.orders(id) on delete cascade,
  product_id   bigint references public.products(id) on delete set null,
  product_name text not null,
  unit_price   int  not null,
  quantity     int  not null check (quantity > 0)
);
create index order_items_order_idx on public.order_items(order_id);
create index order_items_product_idx on public.order_items(product_id);

-- ───────── 헬퍼 ─────────
create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;

-- 회원가입 시 프로필 자동 생성
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ───────── 주문 생성 (가격·재고는 서버에서 검증) ─────────
-- p_items: [{"product_id": 1, "quantity": 2}, ...]
create or replace function public.place_order(
  p_items     jsonb,
  p_recipient text,
  p_phone     text,
  p_address   text,
  p_memo      text default null
)
returns public.orders
language plpgsql security definer set search_path = ''
as $$
declare
  v_uid      uuid := auth.uid();
  v_order    public.orders;
  v_item     jsonb;
  v_product  public.products;
  v_qty      int;
  v_subtotal int := 0;
  v_shipping int;
begin
  if v_uid is null then
    raise exception '로그인이 필요합니다.';
  end if;
  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception '장바구니가 비어 있습니다.';
  end if;
  if coalesce(trim(p_recipient), '') = '' or coalesce(trim(p_phone), '') = '' or coalesce(trim(p_address), '') = '' then
    raise exception '배송 정보를 모두 입력해 주세요.';
  end if;

  -- 1차: 재고 잠금 + 금액 계산
  for v_item in select * from jsonb_array_elements(p_items) loop
    v_qty := (v_item ->> 'quantity')::int;
    if v_qty is null or v_qty < 1 or v_qty > 99 then
      raise exception '수량이 올바르지 않습니다.';
    end if;

    select * into v_product from public.products
    where id = (v_item ->> 'product_id')::bigint and is_active
    for update;

    if not found then
      raise exception '판매하지 않는 상품이 포함되어 있습니다.';
    end if;
    if v_product.stock < v_qty then
      raise exception '재고가 부족합니다: % (남은 수량 %개)', v_product.name, v_product.stock;
    end if;

    v_subtotal := v_subtotal + v_product.price * v_qty;
  end loop;

  v_shipping := case when v_subtotal >= 30000 then 0 else 3000 end;

  insert into public.orders (order_no, user_id, status, subtotal, shipping_fee, total, recipient, phone, address, memo)
  values (
    to_char(now() at time zone 'Asia/Seoul', 'YYYYMMDD') || '-' || upper(substr(md5(gen_random_uuid()::text), 1, 6)),
    v_uid, 'paid', v_subtotal, v_shipping, v_subtotal + v_shipping,
    trim(p_recipient), trim(p_phone), trim(p_address), nullif(trim(coalesce(p_memo, '')), '')
  )
  returning * into v_order;

  -- 2차: 주문 상품 기록 + 재고 차감
  for v_item in select * from jsonb_array_elements(p_items) loop
    v_qty := (v_item ->> 'quantity')::int;
    update public.products
      set stock = stock - v_qty
      where id = (v_item ->> 'product_id')::bigint
      returning * into v_product;

    insert into public.order_items (order_id, product_id, product_name, unit_price, quantity)
    values (v_order.id, v_product.id, v_product.name, v_product.price, v_qty);
  end loop;

  return v_order;
end;
$$;

-- 고객 주문 취소 (결제완료 상태에서만, 재고 복구)
create or replace function public.cancel_order(p_order_id bigint)
returns public.orders
language plpgsql security definer set search_path = ''
as $$
declare
  v_order public.orders;
begin
  select * into v_order from public.orders
  where id = p_order_id and (user_id = auth.uid() or public.is_admin())
  for update;

  if not found then
    raise exception '주문을 찾을 수 없습니다.';
  end if;
  if v_order.status not in ('pending', 'paid') then
    raise exception '배송이 시작된 주문은 취소할 수 없습니다.';
  end if;

  update public.products p
    set stock = p.stock + oi.quantity
    from public.order_items oi
    where oi.order_id = v_order.id and oi.product_id = p.id;

  update public.orders set status = 'cancelled' where id = v_order.id
  returning * into v_order;
  return v_order;
end;
$$;

revoke execute on function public.place_order(jsonb, text, text, text, text) from public, anon;
revoke execute on function public.cancel_order(bigint) from public, anon;
grant execute on function public.place_order(jsonb, text, text, text, text) to authenticated;
grant execute on function public.cancel_order(bigint) to authenticated;

-- ───────── RLS ─────────
alter table public.categories  enable row level security;
alter table public.products    enable row level security;
alter table public.profiles    enable row level security;
alter table public.orders      enable row level security;
alter table public.order_items enable row level security;

create policy "categories: 누구나 조회" on public.categories
  for select using (true);
create policy "categories: 관리자 관리" on public.categories
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "products: 판매중 상품 조회" on public.products
  for select using (is_active or (select public.is_admin()));
create policy "products: 관리자 관리" on public.products
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "profiles: 본인/관리자 조회" on public.profiles
  for select to authenticated using (id = (select auth.uid()) or (select public.is_admin()));
create policy "profiles: 본인 수정" on public.profiles
  for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- role 컬럼은 고객이 직접 바꿀 수 없도록 컬럼 단위 권한 제한
revoke update on public.profiles from authenticated, anon;
grant update (name, phone, address) on public.profiles to authenticated;

create policy "orders: 본인/관리자 조회" on public.orders
  for select to authenticated using (user_id = (select auth.uid()) or (select public.is_admin()));
create policy "orders: 관리자 상태 변경" on public.orders
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "order_items: 본인/관리자 조회" on public.order_items
  for select to authenticated using (
    exists (
      select 1 from public.orders o
      where o.id = order_id and (o.user_id = (select auth.uid()) or (select public.is_admin()))
    )
  );
