export type Category = {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  sort_order: number;
};

export type ImageCredit = { author: string; license: string; source: string };

export type Product = {
  id: number;
  category_id: number;
  slug: string;
  name: string;
  sku: string | null;
  summary: string | null;
  price: number;
  compare_at_price: number | null;
  stock: number;
  specs: Record<string, string>;
  image_url: string | null;
  image_credit: ImageCredit | null;
  is_featured: boolean;
  is_active: boolean;
  created_at: string;
};

export type ProductWithCategory = Product & { categories: Pick<Category, "slug" | "name"> | null };

export type OrderStatus = "pending" | "paid" | "shipping" | "delivered" | "cancelled";

export type Order = {
  id: number;
  order_no: string;
  user_id: string | null;
  status: OrderStatus;
  subtotal: number;
  shipping_fee: number;
  total: number;
  recipient: string | null;
  phone: string | null;
  address: string | null;
  memo: string | null;
  created_at: string;
};

export type OrderItem = {
  id: number;
  order_id: number;
  product_id: number | null;
  product_name: string;
  unit_price: number;
  quantity: number;
};

export type Profile = {
  id: string;
  name: string | null;
  phone: string | null;
  address: string | null;
  role: "customer" | "admin";
};
