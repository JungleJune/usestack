"use client";

import { useEffect, useMemo, useState } from "react";
import { getSupabasePublicConfig, supabase } from "@/lib/supabase";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import ProductCardMedia from "@/components/product-card-media";
import {
  filterProducts,
  getProductCategoryName,
  getProductTagNames,
} from "@/lib/products.mjs";

export default function FeaturedProducts({
  showRating = true,
  gridCols = 3,
  showAll = false,
  selectedCategories = [],
  selectedTags = [],
  searchQuery = "",
  onFilteredCountChange = null,
  onSearchQueryChange = null,
}) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const filteredProducts = useMemo(
    () =>
      filterProducts(products, {
        searchQuery,
        selectedCategories,
        selectedTags,
      }),
    [products, searchQuery, selectedCategories, selectedTags]
  );

  useEffect(() => {
    fetchAllProducts();
  }, []);

  // Notify parent component of filtered count changes
  useEffect(() => {
    if (onFilteredCountChange) {
      onFilteredCountChange(filteredProducts.length);
    }
  }, [
    filteredProducts.length,
    onFilteredCountChange,
  ]);

  const fetchAllProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      // Check if Supabase is properly configured
      const supabaseConfig = getSupabasePublicConfig();
      if (!supabaseConfig.url || !supabaseConfig.key) {
        throw new Error(
          "Supabase environment variables are not configured. Please check your Vercel project settings or .env.local file."
        );
      }

      // Fetch all products from Supabase
      const { data, error } = await supabase
        .from("products")
        .select(
          `
          *,
          company:companies(name, slug, website_url, logo_url, verified),
          product_categories:product_category_jnc(
            category:categories!product_category_jnc_category_id_fkey(id, name, slug)
          ),
          product_tags:product_tags_jnc(
            tag:tags!product_tags_jnc_tag_id_fkey(id, name, slug)
          )
        `
        )
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Supabase error fetching products:", error);
        setError(`Database error: ${error.message}`);
        return;
      }

      console.log("Successfully fetched products:", data?.length || 0);
      setProducts(data || []);
    } catch (err) {
      console.error("Error fetching products:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div
        className={`grid sm:grid-cols-2 ${
          gridCols === 4 ? "md:grid-cols-4" : gridCols === 2 ? "md:grid-cols-2" : "md:grid-cols-3"
        } gap-4`}
      >
        {[...Array(gridCols === 4 ? 8 : 12)].map((_, i) => (
          <div
            key={i}
            className="animate-pulse overflow-hidden rounded-[8px] border border-[#e1e1dd] bg-white"
          >
            <div className="aspect-[16/10] bg-[#ededeb]" />
            <div className="space-y-3 p-5">
              <div className="h-3 w-20 rounded bg-[#e3e3df]" />
              <div className="h-5 w-2/3 rounded bg-[#dededa]" />
              <div className="h-3 w-full rounded bg-[#e8e8e5]" />
              <div className="h-3 w-4/5 rounded bg-[#e8e8e5]" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="bg-red-50 border border-red-200 rounded-md p-4 max-w-2xl mx-auto">
          <h3 className="text-red-800 font-semibold mb-2">
            Error loading products
          </h3>
          <p className="text-red-700 mb-4">{error}</p>
          {error.includes("environment variables") && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-4 text-left">
              <p className="text-yellow-800 text-sm">
                <strong>Setup required:</strong> Create a{" "}
                <code>.env.local</code> file in your project root with:
              </p>
              <pre className="text-xs text-yellow-700 mt-2 bg-yellow-100 p-2 rounded">
                {`NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your_supabase_publishable_key_here
# or, for older Supabase projects:
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here`}
              </pre>
            </div>
          )}
          <button
            onClick={fetchAllProducts}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">
          No products found. Please check your database.
        </p>
      </div>
    );
  }

  // Calculate Levenshtein distance for fuzzy matching
  const levenshteinDistance = (str1, str2) => {
    const matrix = [];
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    return matrix[str2.length][str1.length];
  };

  // Generate search suggestions based on product names
  const generateSuggestions = (query) => {
    if (!query || query.length < 3) return [];

    const suggestions = [];
    const queryLower = query.toLowerCase();

    // Common AI tool names for fallback suggestions
    const commonTools = [
      "ChatGPT",
      "Claude",
      "Gemini",
      "Perplexity",
      "Midjourney",
      "DALL-E",
      "Stable Diffusion",
      "Jasper",
      "Copy.ai",
      "Notion AI",
      "Grammarly",
      "Otter.ai",
      "Descript",
      "Runway",
      "Figma",
      "Canva",
      "Loom",
    ];

    // Find products with similar names using multiple strategies
    products.forEach((product) => {
      const name = product.name?.toLowerCase() || "";
      if (!name) return;

      let score = 0;
      let shouldInclude = false;

      // Strategy 1: Exact substring match (highest priority)
      if (name.includes(queryLower)) {
        score = 100;
        shouldInclude = true;
      }
      // Strategy 2: Word starts with query
      else if (name.split(" ").some((word) => word.startsWith(queryLower))) {
        score = 80;
        shouldInclude = true;
      }
      // Strategy 3: Fuzzy matching with Levenshtein distance
      else {
        const words = name.split(" ");
        for (const word of words) {
          if (word.length >= 3) {
            const distance = levenshteinDistance(queryLower, word);
            const maxDistance = Math.max(1, Math.floor(word.length / 3));
            if (distance <= maxDistance) {
              score = Math.max(score, 60 - distance * 10);
              shouldInclude = true;
            }
          }
        }
      }

      // Strategy 4: Character-based similarity (for typos like "chatkpt" → "chatgpt")
      if (!shouldInclude && queryLower.length >= 4) {
        const commonChars = queryLower
          .split("")
          .filter((char) => name.includes(char));
        const similarity = commonChars.length / queryLower.length;
        if (similarity >= 0.6) {
          score = Math.max(score, similarity * 40);
          shouldInclude = true;
        }
      }

      if (shouldInclude && score > 0) {
        suggestions.push({ name: product.name, score });
      }
    });

    // Sort by score and get top suggestions
    let topSuggestions = suggestions
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map((item) => item.name);

    // If we don't have enough suggestions, add common tools that match the query
    if (topSuggestions.length < 3) {
      commonTools.forEach((tool) => {
        const toolLower = tool.toLowerCase();
        if (topSuggestions.length >= 3) return;

        // Check if tool matches the query using similar logic
        let shouldAdd = false;

        if (
          toolLower.includes(queryLower) ||
          toolLower.split(" ").some((word) => word.startsWith(queryLower))
        ) {
          shouldAdd = true;
        } else if (queryLower.length >= 4) {
          const commonChars = queryLower
            .split("")
            .filter((char) => toolLower.includes(char));
          const similarity = commonChars.length / queryLower.length;
          if (similarity >= 0.6) {
            shouldAdd = true;
          }
        }

        if (shouldAdd && !topSuggestions.includes(tool)) {
          topSuggestions.push(tool);
        }
      });
    }

    return topSuggestions.slice(0, 3);
  };

  // Show no results message with suggestions if no products found
  if (
    filteredProducts.length === 0 &&
    (selectedCategories.length > 0 ||
      selectedTags.length > 0 ||
      searchQuery.trim())
  ) {
    const suggestions = searchQuery.trim()
      ? generateSuggestions(searchQuery)
      : [];

    return (
      <div className="text-center py-12">
        <div className="max-w-md mx-auto">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No tools found
          </h3>
          <p className="text-gray-600 mb-6">
            We couldn't find any tools matching your search criteria.
          </p>

          {suggestions.length > 0 && (
            <div className="text-left">
              <p className="text-sm font-medium text-gray-700 mb-3">
                Did you mean:
              </p>
              <div className="space-y-2">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      if (onSearchQueryChange) {
                        onSearchQueryChange(suggestion);
                      }
                    }}
                    className="block w-full text-left px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg text-sm text-gray-700 transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6">
            <p className="text-sm text-gray-500 mb-4">
              Try adjusting your search or filters:
            </p>
            <ul className="text-sm text-gray-500 space-y-1">
              <li>• Check your spelling</li>
              <li>• Try different keywords</li>
              <li>• Remove some filters</li>
              <li>• Browse by category instead</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  // Determine how many products to show based on gridCols
  const displayCount = gridCols === 4 ? 4 : (showAll ? filteredProducts.length : 6);
  const displayProducts = showAll ? filteredProducts : filteredProducts.slice(0, displayCount);

  return (
    <>
      <div
        className={`grid sm:grid-cols-2 ${
          gridCols === 4 ? "md:grid-cols-4" : gridCols === 2 ? "md:grid-cols-2" : "md:grid-cols-3"
        } gap-4`}
      >
        {displayProducts.map((product) => (
          <Link
            key={product.id}
            href={`/tool/${product.slug}`}
            className="group flex min-w-0 flex-col overflow-hidden rounded-[8px] border border-[#deded9] bg-white transition duration-300 hover:-translate-y-1 hover:border-[#9d9d96] hover:shadow-[0_18px_50px_rgba(0,0,0,0.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563eb] focus-visible:ring-offset-2"
          >
            <ProductCardMedia
              product={product}
              className="aspect-[16/10] w-full"
            />

            <div className="flex min-h-[180px] flex-1 flex-col p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="truncate text-[12px] font-medium text-[#777772]">
                    {getProductCategoryName(product)}
                  </p>
                  <h3 className="mt-1 truncate text-[18px] font-semibold text-[#141414]">
                    {product.name}
                  </h3>
                </div>
                <ArrowUpRight className="mt-1 h-5 w-5 shrink-0 text-[#9c9c96] transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[#141414]" />
              </div>

              <p className="mt-3 line-clamp-2 text-[14px] leading-6 text-[#666661]">
                {product.tagline || product.description || "AI-powered tool"}
              </p>

              <div className="mt-auto flex flex-wrap gap-2 pt-5">
                {getProductTagNames(product)
                  .slice(0, 2)
                  .map((tag, index) => (
                    <span
                      key={`${tag}-${index}`}
                      className="max-w-[130px] truncate rounded-full bg-[#f1f1ee] px-2.5 py-1 text-[11px] font-medium text-[#5d5d58]"
                    >
                      {tag}
                    </span>
                  ))}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
