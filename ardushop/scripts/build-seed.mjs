// supabase/seed/products.json + public/images/credits.json → supabase/seed/seed.sql
import fs from 'node:fs';

const root = new URL('..', import.meta.url);
const data = JSON.parse(fs.readFileSync(new URL('supabase/seed/products.json', root), 'utf8'));
const credits = JSON.parse(fs.readFileSync(new URL('public/images/credits.json', root), 'utf8'));

const q = (v) => (v == null ? 'null' : `'${String(v).replace(/'/g, "''")}'`);
const j = (v) => (v == null ? 'null' : `${q(JSON.stringify(v))}::jsonb`);

let sql = '-- 자동 생성: node scripts/build-seed.mjs\n\n';
sql += 'insert into public.categories (slug, name, description, sort_order) values\n';
sql += data.categories.map((c) => `  (${q(c.slug)}, ${q(c.name)}, ${q(c.description)}, ${c.sort_order})`).join(',\n');
sql += '\non conflict (slug) do update set name = excluded.name, description = excluded.description, sort_order = excluded.sort_order;\n\n';

sql += 'insert into public.products (category_id, slug, name, sku, summary, price, stock, specs, image_url, image_credit, is_featured) values\n';
sql += data.products.map((p) => {
  const c = credits[p.slug];
  if (!c) throw new Error(`이미지 없음: ${p.slug}`);
  const credit = { author: c.author, license: c.license, source: c.source };
  return `  ((select id from public.categories where slug = ${q(p.category)}), ${q(p.slug)}, ${q(p.name)}, ${q(p.sku)}, ${q(p.summary)}, ${p.price}, ${p.stock}, ${j(p.specs)}, ${q(c.file)}, ${j(credit)}, ${p.featured ? 'true' : 'false'})`;
}).join(',\n');
sql += '\non conflict (slug) do update set category_id = excluded.category_id, name = excluded.name, sku = excluded.sku, summary = excluded.summary, price = excluded.price, specs = excluded.specs, image_url = excluded.image_url, image_credit = excluded.image_credit, is_featured = excluded.is_featured;\n';

fs.writeFileSync(new URL('supabase/seed/seed.sql', root), sql);
console.log(`seed.sql: 카테고리 ${data.categories.length}개, 상품 ${data.products.length}개`);
