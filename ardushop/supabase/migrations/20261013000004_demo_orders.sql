-- 교육용 전환: 회원가입 없이 개인정보 없는 '체험 주문'

-- 체험 주문은 회원·배송정보가 없다
alter table public.orders alter column user_id   drop not null;
alter table public.orders alter column recipient drop not null;
alter table public.orders alter column phone     drop not null;
alter table public.orders alter column address   drop not null;

-- 개인정보를 받는 기존 주문 함수는 더 이상 호출 불가
revoke execute on function public.place_order(jsonb, text, text, text, text) from authenticated;

-- p_items: [{"product_id": 1, "quantity": 2}, ...]
-- 누구나 호출 가능하므로 재고는 검사만 하고 차감하지 않는다.
create or replace function public.place_demo_order(p_items jsonb)
returns jsonb
language plpgsql security definer set search_path = ''
as $$
declare
  v_order    public.orders;
  v_line     record;
  v_product  public.products;
  v_subtotal int := 0;
  v_shipping int;
  v_items    jsonb := '[]'::jsonb;
begin
  if p_items is null or jsonb_typeof(p_items) <> 'array'
     or jsonb_array_length(p_items) = 0 or jsonb_array_length(p_items) > 50 then
    raise exception '장바구니가 비어 있습니다.';
  end if;
  if exists (
    select 1 from jsonb_array_elements(p_items) e
    where (e ->> 'quantity') is null or (e ->> 'quantity')::int not between 1 and 99
  ) then
    raise exception '수량이 올바르지 않습니다.';
  end if;

  for v_line in select (e ->> 'product_id')::bigint as product_id, sum((e ->> 'quantity')::int)::int as quantity
      from jsonb_array_elements(p_items) e group by 1 order by 1 loop
    select * into v_product from public.products where id = v_line.product_id and is_active;
    if not found then
      raise exception '판매하지 않는 상품이 포함되어 있습니다.';
    end if;
    if v_product.stock < v_line.quantity then
      raise exception '재고가 부족합니다: % (남은 수량 %개)', v_product.name, v_product.stock;
    end if;
    v_subtotal := v_subtotal + v_product.price * v_line.quantity;
  end loop;

  v_shipping := case when v_subtotal >= 30000 then 0 else 3000 end;

  insert into public.orders (order_no, status, subtotal, shipping_fee, total)
  values (
    to_char(now() at time zone 'Asia/Seoul', 'YYYYMMDD') || '-' || upper(substr(md5(gen_random_uuid()::text), 1, 6)),
    'paid', v_subtotal, v_shipping, v_subtotal + v_shipping
  )
  returning * into v_order;

  for v_line in select (e ->> 'product_id')::bigint as product_id, sum((e ->> 'quantity')::int)::int as quantity
      from jsonb_array_elements(p_items) e group by 1 order by 1 loop
    select * into v_product from public.products where id = v_line.product_id;
    insert into public.order_items (order_id, product_id, product_name, unit_price, quantity)
    values (v_order.id, v_product.id, v_product.name, v_product.price, v_line.quantity);
    v_items := v_items || jsonb_build_object('name', v_product.name, 'unit_price', v_product.price, 'quantity', v_line.quantity);
  end loop;

  return jsonb_build_object(
    'order_no', v_order.order_no,
    'subtotal', v_order.subtotal,
    'shipping_fee', v_order.shipping_fee,
    'total', v_order.total,
    'items', v_items
  );
end;
$$;

revoke execute on function public.place_demo_order(jsonb) from public;
grant execute on function public.place_demo_order(jsonb) to anon, authenticated;

-- 체험 주문 취소는 재고를 건드리지 않는다 (관리자 전용)
create or replace function public.cancel_order(p_order_id bigint)
returns public.orders
language plpgsql security definer set search_path = ''
as $$
declare
  v_order public.orders;
begin
  if not public.is_admin() then
    raise exception '관리자 권한이 필요합니다.';
  end if;

  select * into v_order from public.orders where id = p_order_id for update;
  if not found then
    raise exception '주문을 찾을 수 없습니다.';
  end if;
  if v_order.status = 'cancelled' then
    raise exception '이미 취소된 주문입니다.';
  end if;
  if v_order.status not in ('pending', 'paid') then
    raise exception '배송이 시작된 주문은 취소할 수 없습니다.';
  end if;

  -- 회원 주문(과거 방식)만 재고 복구
  if v_order.user_id is not null then
    update public.products p
      set stock = p.stock + oi.quantity
      from public.order_items oi
      where oi.order_id = v_order.id and oi.product_id = p.id;
  end if;

  update public.orders set status = 'cancelled' where id = v_order.id
  returning * into v_order;
  return v_order;
end;
$$;
