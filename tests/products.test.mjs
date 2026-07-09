import assert from "node:assert/strict";
import test from "node:test";

import {
  filterProducts,
  getProductCategoryName,
  getProductLogo,
  getProductTagNames,
  getCatalogVisibilitySummary,
  isProductVisible,
  productMatchesFilters,
  scoreProductSearch,
  validMediaUrl,
} from "../lib/products.mjs";

const product = {
  id: 1,
  name: "Launch Writer",
  tagline: "Create campaign copy",
  description: "An AI writing assistant for product marketing.",
  logo_url: "https://example.com/logo.png",
  tags: ["copywriting"],
  product_categories: [
    { category: { name: "Marketing", slug: "business-marketing-tools" } },
  ],
  product_tags: [{ tag: { name: "launches" } }],
};

test("normalizes product presentation data", () => {
  assert.equal(getProductLogo(product), "https://example.com/logo.png");
  assert.equal(getProductCategoryName(product), "Marketing");
  assert.deepEqual(getProductTagNames(product), ["copywriting", "launches"]);
  assert.equal(validMediaUrl(" undefined "), null);
});

test("matches search, category, and tag filters consistently", () => {
  assert.equal(
    productMatchesFilters(product, {
      searchQuery: "campaign",
      selectedCategories: ["business-marketing-tools"],
      selectedTags: ["launches"],
    }),
    true
  );
  assert.equal(
    productMatchesFilters(product, { selectedTags: ["video"] }),
    false
  );
});

test("filters invalid collections safely", () => {
  assert.deepEqual(filterProducts(null, { searchQuery: "anything" }), []);
  assert.deepEqual(filterProducts([product], { searchQuery: "writing" }), [
    product,
  ]);
});

test("excludes reviewed hidden and removed products from public discovery", () => {
  const summary = getCatalogVisibilitySummary();

  assert.deepEqual(summary, {
    hidden: 287,
    removed: 15,
    excluded: 302,
  });
  assert.equal(isProductVisible({ id: 266, name: "ActiveCampaign" }), false);
  assert.equal(isProductVisible({ id: 182, name: "AI Directory" }), false);
  assert.equal(isProductVisible({ id: 999999, name: "New tool" }), true);
  assert.deepEqual(
    filterProducts(
      [
        { id: 266, name: "ActiveCampaign", tagline: "Marketing automation" },
        { id: 999999, name: "New tool", tagline: "Marketing automation" },
      ],
      { searchQuery: "marketing" }
    ).map((item) => item.id),
    [999999]
  );
});

test("does not qualify products from a noisy legacy tag alone", () => {
  const noisyProduct = {
    name: "Supersonik",
    tagline: "Interactive product demos",
    description: "Demos that leads can watch on demand.",
    category: "Video & Animation Tools",
    tags: ["marketing"],
  };
  const relevantProduct = {
    name: "Zuddl",
    tagline: "Event and webinar platform for B2B marketing teams",
    description: "Run events and webinars.",
    category: "Productivity & Workflow Tools",
  };

  assert.equal(
    productMatchesFilters(noisyProduct, { searchQuery: "marketing" }),
    false
  );
  assert.equal(
    productMatchesFilters(relevantProduct, { searchQuery: "marketing" }),
    true
  );
  assert.ok(
    scoreProductSearch(relevantProduct, "marketing") >
      scoreProductSearch(noisyProduct, "marketing")
  );
});

test("does not qualify products from a broad legacy category alone", () => {
  const broadCategoryProduct = {
    name: "Unrelated infrastructure product",
    tagline: "Deploy data pipelines",
    description: "Build and monitor production workloads.",
    product_categories: [
      {
        category: {
          name: "Business & Marketing Tools",
          slug: "business-marketing-tools",
        },
      },
    ],
  };

  assert.equal(
    productMatchesFilters(broadCategoryProduct, {
      searchQuery: "marketing",
    }),
    false
  );
});

test("sorts keyword results by relevance", () => {
  const results = filterProducts(
    [
      { name: "General CRM", description: "Marketing automation tools" },
      { name: "Marketing Copilot", description: "Campaign assistant" },
    ],
    { searchQuery: "marketing" }
  );

  assert.equal(results[0].name, "Marketing Copilot");
});
