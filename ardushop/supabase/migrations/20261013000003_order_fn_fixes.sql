-- 같은 상품이 여러 줄로 들어와도 합산해서 재고 검사, 취소 메시지 상태별 분리

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
  v_line     record;
  v_product  public.products;
  v_subtotal int := 0;
  v_shipping int;
begin
  if v_uid is null then
    raise exception '로그인이 필요합니다.';
  end if;
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception '장바구니가 비어 있습니다.';
  end if;
  if coalesce(trim(p_recipient), '') = '' or coalesce(trim(p_phone), '') = '' or coalesce(trim(p_address), '') = '' then
    raise exception '배송 정보를 모두 입력해 주세요.';
  end if;
  if exists (
    select 1 from jsonb_array_elements(p_items) e
    where (e ->> 'quantity') is null or (e ->> 'quantity')::int not between 1 and 99
  ) then
    raise exception '수량이 올바르지 않습니다.';
  end if;

  -- 재고 잠금 + 금액 계산 (id 순서로 잠가 교착 방지)
  for v_line in select (e ->> 'product_id')::bigint as product_id, sum((e ->> 'quantity')::int)::int as quantity
      from jsonb_array_elements(p_items) e group by 1 order by 1 loop
    select * into v_product from public.products
    where id = v_line.product_id and is_active
    for update;

    if not found then
      raise exception '판매하지 않는 상품이 포함되어 있습니다.';
    end if;
    if v_product.stock < v_line.quantity then
      raise exception '재고가 부족합니다: % (남은 수량 %개)', v_product.name, v_product.stock;
    end if;

    v_subtotal := v_subtotal + v_product.price * v_line.quantity;
  end loop;

  v_shipping := case when v_subtotal >= 30000 then 0 else 3000 end;

  insert into public.orders (order_no, user_id, status, subtotal, shipping_fee, total, recipient, phone, address, memo)
  values (
    to_char(now() at time zone 'Asia/Seoul', 'YYYYMMDD') || '-' || upper(substr(md5(gen_random_uuid()::text), 1, 6)),
    v_uid, 'paid', v_subtotal, v_shipping, v_subtotal + v_shipping,
    trim(p_recipient), trim(p_phone), trim(p_address), nullif(trim(coalesce(p_memo, '')), '')
  )
  returning * into v_order;

  for v_line in select (e ->> 'product_id')::bigint as product_id, sum((e ->> 'quantity')::int)::int as quantity
      from jsonb_array_elements(p_items) e group by 1 order by 1 loop
    update public.products
      set stock = stock - v_line.quantity
      where id = v_line.product_id
      returning * into v_product;

    insert into public.order_items (order_id, product_id, product_name, unit_price, quantity)
    values (v_order.id, v_product.id, v_product.name, v_product.price, v_line.quantity);
  end loop;

  return v_order;
end;
$$;

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
  if v_order.status = 'cancelled' then
    raise exception '이미 취소된 주문입니다.';
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
