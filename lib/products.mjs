import {
  EXCLUDED_CATALOG_PRODUCT_IDS,
  HIDDEN_CATALOG_PRODUCTS,
  REMOVED_CATALOG_PRODUCTS,
} from "./catalog-visibility.generated.mjs";

const excludedCatalogProductIds = new Set(EXCLUDED_CATALOG_PRODUCT_IDS);

function normalize(value) {
  return String(value ?? "").trim().toLowerCase();
}

export function isProductIdVisible(productId) {
  const normalizedId = Number(productId);
  return !Number.isInteger(normalizedId) || !excludedCatalogProductIds.has(normalizedId);
}

export function isProductVisible(product) {
  return isProductIdVisible(product?.id);
}

export function getCatalogVisibilitySummary() {
  return {
    hidden: HIDDEN_CATALOG_PRODUCTS.length,
    removed: REMOVED_CATALOG_PRODUCTS.length,
    excluded: EXCLUDED_CATALOG_PRODUCT_IDS.length,
  };
}

export function validMediaUrl(value) {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  if (!normalized || ["null", "undefined"].includes(normalized.toLowerCase())) {
    return null;
  }
  return normalized;
}

export function productInitial(product) {
  return product?.name?.trim()?.charAt(0)?.toUpperCase() || "U";
}

export function getProductLogo(product) {
  return (
    validMediaUrl(product?.logo_url) ||
    validMediaUrl(product?.company?.logo_url) ||
    null
  );
}

export function getProductCategoryName(product) {
  return (
    product?.category?.name ||
    product?.category ||
    product?.product_categories?.[0]?.category?.name ||
    "AI tool"
  );
}

export function getProductTagNames(product) {
  return [
    ...(Array.isArray(product?.tags) ? product.tags : []),
    ...(product?.product_tags || [])
      .map((item) => item?.tag?.name)
      .filter(Boolean),
  ].filter(Boolean);
}

function getCategoryValues(product) {
  return [
    product?.category?.name,
    product?.category?.slug,
    typeof product?.category === "string" ? product.category : null,
    ...(product?.product_categories || []).flatMap((item) => [
      item?.category?.name,
      item?.category?.slug,
    ]),
  ]
    .filter(Boolean)
    .map(normalize);
}

export function scoreProductSearch(product, searchQuery) {
  const query = normalize(searchQuery);
  if (!query) return 0;

  const name = normalize(product?.name);
  const tagline = normalize(product?.tagline);
  const description = normalize(product?.description);
  const categoryValues = getCategoryValues(product);
  const tagValues = getProductTagNames(product).map(normalize);
  let score = 0;

  if (name === query) score += 140;
  else if (name.startsWith(query)) score += 90;
  else if (name.includes(query)) score += 70;

  if (tagline.includes(query)) score += 48;
  if (description.includes(query)) score += 18;
  // Broad legacy categories (for example "Business & Marketing Tools") are
  // not precise enough to qualify a result by themselves.
  if (categoryValues.some((value) => value.includes(query))) score += 10;

  // Legacy tags are noisy. They can improve ordering, but a tag alone should
  // not make a product qualify for a keyword search.
  if (tagValues.some((value) => value === query)) score += 8;
  else if (tagValues.some((value) => value.includes(query))) score += 4;

  const tokens = query.split(/\s+/).filter((token) => token.length >= 3);
  if (tokens.length > 1) {
    const tokenScore = tokens.reduce((total, token) => {
      if (name.includes(token)) return total + 18;
      if (tagline.includes(token)) return total + 10;
      if (description.includes(token)) return total + 5;
      if (categoryValues.some((value) => value.includes(token))) {
        return total + 8;
      }
      return total;
    }, 0);
    score += tokenScore;
  }

  return score;
}

export function productMatchesFilters(
  product,
  { searchQuery = "", selectedCategories = [], selectedTags = [] } = {}
) {
  if (!isProductVisible(product)) return false;

  const query = normalize(searchQuery);
  const categoryValues = getCategoryValues(product);
  const tagValues = getProductTagNames(product).map(normalize);

  if (query && scoreProductSearch(product, query) < 20) return false;

  if (selectedCategories.length > 0) {
    const selected = new Set(selectedCategories.map(normalize));
    if (!categoryValues.some((value) => selected.has(value))) return false;
  }

  if (selectedTags.length > 0) {
    const selected = new Set(selectedTags.map(normalize));
    if (!tagValues.some((value) => selected.has(value))) return false;
  }

  return true;
}

export function filterProducts(products, filters) {
  const filtered = (Array.isArray(products) ? products : []).filter((product) =>
    productMatchesFilters(product, filters)
  );
  const query = normalize(filters?.searchQuery);

  if (!query) return filtered;
  return filtered
    .map((product, index) => ({
      product,
      index,
      score: scoreProductSearch(product, query),
    }))
    .sort((left, right) => right.score - left.score || left.index - right.index)
    .map(({ product }) => product);
}
