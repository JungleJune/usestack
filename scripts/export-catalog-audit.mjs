import fs from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const outputDir =
  process.argv[2] ||
  path.join(process.cwd(), "outputs", "catalog-audit-2026-06-28");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceRoleKey) {
  throw new Error("Supabase server credentials are required");
}

const supabase = createClient(url, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function selectAll(table, columns = "*") {
  const rows = [];
  const pageSize = 1000;

  for (let start = 0; ; start += pageSize) {
    const { data, error } = await supabase
      .from(table)
      .select(columns)
      .range(start, start + pageSize - 1);
    if (error) throw new Error(`${table}: ${error.message}`);
    rows.push(...(data || []));
    if (!data || data.length < pageSize) return rows;
  }
}

const [
  products,
  categories,
  subcategories,
  tags,
  productCategories,
  productSubcategories,
  productTags,
] = await Promise.all([
  selectAll(
    "products",
    "id,name,slug,tagline,description,website_url,logo_url,tool_thumbnail_url,tags,company_id,created_at,updated_at"
  ),
  selectAll("categories", "id,name,slug"),
  selectAll("sub_categories", "*"),
  selectAll("tags", "id,name,slug"),
  selectAll("product_category_jnc", "product_id,category_id,sort_order"),
  selectAll("product_subcategory_jnc", "*"),
  selectAll("product_tags_jnc", "product_id,tag_id"),
]);

const categoryById = new Map(
  categories.map((category) => [category.id, category])
);
const subcategoryById = new Map(
  subcategories.map((subcategory) => [subcategory.id, subcategory])
);
const tagById = new Map(tags.map((tag) => [tag.id, tag]));

const relationshipsByProduct = new Map(
  products.map((product) => [
    product.id,
    { categories: [], subcategories: [], relationalTags: [] },
  ])
);

for (const row of [...productCategories].sort(
  (left, right) =>
    left.product_id - right.product_id ||
    (left.sort_order ?? 999) - (right.sort_order ?? 999)
)) {
  const category = categoryById.get(row.category_id);
  if (category) relationshipsByProduct.get(row.product_id)?.categories.push(category);
}
for (const row of [...productSubcategories].sort(
  (left, right) =>
    left.product_id - right.product_id ||
    (left.sort_order ?? 999) - (right.sort_order ?? 999)
)) {
  const subcategory = subcategoryById.get(
    row.subcategory_id ?? row.sub_category_id
  );
  if (subcategory) {
    relationshipsByProduct.get(row.product_id)?.subcategories.push(subcategory);
  }
}
for (const row of productTags) {
  const tag = tagById.get(row.tag_id);
  if (tag) relationshipsByProduct.get(row.product_id)?.relationalTags.push(tag);
}

const enrichedProducts = products.map((product) => ({
  ...product,
  ...relationshipsByProduct.get(product.id),
}));

await fs.mkdir(outputDir, { recursive: true });
const outputPath = path.join(outputDir, "catalog-export.json");
await fs.writeFile(
  outputPath,
  JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      counts: {
        products: products.length,
        categories: categories.length,
        subcategories: subcategories.length,
        tags: tags.length,
        productCategories: productCategories.length,
        productSubcategories: productSubcategories.length,
        productTags: productTags.length,
      },
      taxonomy: { categories, subcategories, tags },
      products: enrichedProducts,
    },
    null,
    2
  )
);

console.log(JSON.stringify({ outputPath, products: products.length }));
