"use client";

import { useState, useEffect, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Header from "@/components/header";
import { Checkbox } from "@/components/ui/checkbox";
import { ChevronDown, Filter, Search, X } from "lucide-react";
// categories and tags are now fetched from Supabase
import FeaturedProducts from "@/components/featured-products";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { isProductIdVisible } from "@/lib/products.mjs";

export default function ExplorePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get("category");

  const [selectedCategories, setSelectedCategories] = useState(
    initialCategory ? [initialCategory] : []
  );
  const [selectedTags, setSelectedTags] = useState([]);
  const [availableTags, setAvailableTags] = useState([]);
  const [availableCategories, setAvailableCategories] = useState([]);
  const [categoryCounts, setCategoryCounts] = useState({});
  const [searchQuery, setSearchQuery] = useState(
    searchParams.get("search") || ""
  );
  const [filteredCount, setFilteredCount] = useState(0);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const handleCategoryChange = (categoryId, checked) => {
    if (checked) {
      setSelectedCategories([...selectedCategories, categoryId]);
    } else {
      setSelectedCategories(
        selectedCategories.filter((id) => id !== categoryId)
      );
    }
  };

  const handleTagChange = (tag, checked) => {
    if (checked) {
      setSelectedTags([...selectedTags, tag]);
    } else {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    }
  };

  const removeAllFilters = () => {
    setSelectedCategories([]);
    setSelectedTags([]);
    setSearchQuery("");
    // Clear all URL parameters
    router.push("/explore");
  };

  const clearSearch = () => {
    setSearchQuery("");
    // Also clear the URL search parameter
    const params = new URLSearchParams(searchParams);
    params.delete("search");
    const newUrl = params.toString()
      ? `/explore?${params.toString()}`
      : "/explore";
    router.push(newUrl);
  };

  const handleFilteredCountChange = (count) => {
    setFilteredCount(count);
  };

  const handleSearchQueryChange = (newQuery) => {
    setSearchQuery(newQuery);
    // Update URL with new search query
    const params = new URLSearchParams(searchParams);
    if (newQuery.trim()) {
      params.set("search", newQuery.trim());
    } else {
      params.delete("search");
    }
    const newUrl = params.toString()
      ? `/explore?${params.toString()}`
      : "/explore";
    router.push(newUrl);
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.set("search", searchQuery.trim());
      if (selectedCategories.length > 0)
        params.set("categories", selectedCategories.join(","));
      if (selectedTags.length > 0) params.set("tags", selectedTags.join(","));

      const queryString = params.toString();
      const newUrl = queryString ? `/explore?${queryString}` : "/explore";
      router.push(newUrl);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  // Fetch categories and tags from Supabase
  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const [categoriesRes, productCategoriesRes, tagsRes] =
          await Promise.all([
            supabase
              .from("categories")
              .select("id, name, slug")
              .order("name", { ascending: true }),
            supabase
              .from("product_category_jnc")
              .select("product_id, category_id"),
            supabase
              .from("tags")
              .select("name")
              .order("name", { ascending: true }),
          ]);

        if (!categoriesRes.error && categoriesRes.data) {
          setAvailableCategories(categoriesRes.data);
        } else {
          console.error("Error fetching categories:", categoriesRes.error);
        }

        if (!productCategoriesRes.error && productCategoriesRes.data) {
          const counts = {};
          productCategoriesRes.data.forEach((row) => {
            if (!isProductIdVisible(row.product_id)) return;
            counts[row.category_id] = (counts[row.category_id] || 0) + 1;
          });
          setCategoryCounts(counts);
        } else {
          console.error(
            "Error fetching product_categories:",
            productCategoriesRes.error
          );
        }

        if (!tagsRes.error && tagsRes.data) {
          setAvailableTags(tagsRes.data.map((t) => t.name));
        } else {
          console.error("Error fetching tags:", tagsRes.error);
        }
      } catch (error) {
        console.error("Error fetching filters:", error);
      }
    };

    fetchFilters();
  }, []);

  // Memoized sorted lists to keep selected items at the top
  const sortedCategories = useMemo(() => {
    const originalIndex = new Map(availableCategories.map((c, i) => [c.id, i]));
    const bySelectedThenOriginal = (a, b) => {
      const aSel = selectedCategories.includes(a.slug);
      const bSel = selectedCategories.includes(b.slug);
      if (aSel !== bSel) return aSel ? -1 : 1;
      return (originalIndex.get(a.id) ?? 0) - (originalIndex.get(b.id) ?? 0);
    };
    return [...availableCategories].sort(bySelectedThenOriginal);
  }, [availableCategories, selectedCategories]);

  const sortedTags = useMemo(() => {
    const originalIndex = new Map(availableTags.map((t, i) => [t, i]));
    const bySelectedThenOriginal = (a, b) => {
      const aSel = selectedTags.includes(a);
      const bSel = selectedTags.includes(b);
      if (aSel !== bSel) return aSel ? -1 : 1;
      return (originalIndex.get(a) ?? 0) - (originalIndex.get(b) ?? 0);
    };
    return [...availableTags].sort(bySelectedThenOriginal);
  }, [availableTags, selectedTags]);

  return (
    <div className="min-h-screen bg-[#f5f5f2] text-[#141414]">
      <Header />

      <div className="border-b border-[#e1e1dc] bg-white">
        <div className="mx-auto max-w-[1440px] px-5 py-12 sm:px-8 sm:py-16 lg:px-12">
          <p className="text-[13px] font-medium text-[#2563eb]">Directory</p>
          <h1 className="mt-3 max-w-3xl text-[42px] font-medium leading-tight tracking-normal sm:text-[58px]">
            Explore AI tools
          </h1>
          <p className="mb-8 mt-4 max-w-2xl text-[17px] leading-7 text-[#6b6b65]">
            Search the full index by product, use case, category, or tag.
          </p>

          <div className="flex max-w-3xl gap-2 rounded-full border border-[#cfcfca] bg-white p-1.5 shadow-[0_8px_32px_rgba(0,0,0,0.05)] focus-within:border-[#85857f]">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#888882]" />
              <Input
                placeholder="Search tools, tasks, or workflows"
                className="h-11 border-0 bg-transparent pl-11 pr-11 text-[15px] shadow-none focus-visible:ring-0"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleKeyPress}
              />
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8d8d87] transition hover:text-black"
                  type="button"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <Button
              className="h-11 rounded-full bg-[#171717] px-5 text-[13px] hover:bg-[#333333]"
              onClick={handleSearch}
            >
              Search
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1440px] px-5 py-10 sm:px-8 lg:px-12">
        <div className="flex flex-col gap-10 lg:flex-row">
          <div className="shrink-0 lg:w-64">
            <div className="sticky top-24 border-t border-[#cfcfca] pt-5">
              <div className="mb-5 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setShowMobileFilters((current) => !current)}
                  className="flex items-center gap-2 lg:pointer-events-none"
                  aria-expanded={showMobileFilters}
                >
                  <Filter className="h-4 w-4 text-[#666661]" />
                  <h3 className="text-[14px] font-medium">Filters</h3>
                  <span className="text-[11px] text-[#9a9a94] lg:hidden">
                    {selectedCategories.length + selectedTags.length || ""}
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 text-[#8d8d87] transition lg:hidden ${
                      showMobileFilters ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {(selectedCategories.length > 0 ||
                  selectedTags.length > 0 ||
                  searchQuery.trim()) && (
                  <button
                    onClick={removeAllFilters}
                    type="button"
                    aria-label="Clear all filters"
                    className="text-[#8c8c86] transition hover:text-black"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              <div className={`${showMobileFilters ? "block" : "hidden"} lg:block`}>
                <div className="mb-5 border-b border-[#deded9] pb-5">
                  <h4 className="mb-3 text-[12px] font-medium text-[#777772]">
                    Categories
                  </h4>
                  <div className="max-h-52 space-y-2 overflow-y-auto pr-2">
                    {sortedCategories.map((category) => (
                      <div
                        key={category.id}
                        className="flex items-center justify-between py-0.5"
                      >
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={category.slug}
                            checked={selectedCategories.includes(category.slug)}
                            onCheckedChange={(checked) =>
                              handleCategoryChange(category.slug, checked)
                            }
                          />
                          <label
                            htmlFor={category.slug}
                            className="cursor-pointer text-[13px] text-[#595954]"
                          >
                            {category.name}
                          </label>
                        </div>
                        <span className="text-[11px] text-[#9b9b95]">
                          {categoryCounts[category.id] || 0}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mb-5">
                  <h4 className="mb-3 text-[12px] font-medium text-[#777772]">
                    Tags
                  </h4>
                  <div className="max-h-52 space-y-2 overflow-y-auto pr-2">
                    {sortedTags.map((tag) => (
                      <div key={tag} className="flex items-center space-x-2 py-0.5">
                        <Checkbox
                          id={`tag-${tag}`}
                          checked={selectedTags.includes(tag)}
                          onCheckedChange={(checked) =>
                            handleTagChange(tag, checked)
                          }
                        />
                        <label
                          htmlFor={`tag-${tag}`}
                          className="cursor-pointer text-[13px] text-[#595954]"
                        >
                          #{tag}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {(selectedCategories.length > 0 || selectedTags.length > 0) && (
                  <div className="border-t border-[#deded9] pt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={removeAllFilters}
                      className="w-full rounded-full border-[#cfcfca] bg-transparent text-[12px]"
                    >
                      Clear filters
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex-1">
            <div className="mb-6 flex items-center justify-between border-t border-[#cfcfca] pt-5">
              <p className="text-[13px] text-[#6c6c66]">
                {filteredCount === 0
                  ? "No tools found"
                  : `Showing ${filteredCount} ${filteredCount === 1 ? "tool" : "tools"}`}
              </p>
              {(selectedCategories.length > 0 ||
                selectedTags.length > 0 ||
                searchQuery.trim()) && (
                <p className="text-[11px] text-[#969690]">
                  {selectedCategories.length > 0 && `${selectedCategories.length} categories`}
                  {selectedCategories.length > 0 && selectedTags.length > 0 && ", "}
                  {selectedTags.length > 0 && `${selectedTags.length} tags`}
                </p>
              )}
            </div>
            <FeaturedProducts
              gridCols={3}
              showRating={false}
              showAll={true}
              selectedCategories={selectedCategories}
              selectedTags={selectedTags}
              searchQuery={searchQuery}
              onFilteredCountChange={handleFilteredCountChange}
              onSearchQueryChange={handleSearchQueryChange}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
