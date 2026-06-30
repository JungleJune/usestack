
"use client";

import { useEffect, useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import Header from "@/components/header";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
import { isProductVisible } from "@/lib/products.mjs";

export default function Page() {
  const [stacks, setStacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchStacks = async () => {
      const { data, error } = await supabase
        .from("stacks")
        .select(
          `id, name, description,slug, product_stacks:product_stack_jnc(product:products(id, name, logo_url, tool_thumbnail_url))`
        )
        .order("created_at", { ascending: false });
      if (!error && data) {
        setStacks(data);
      } else {
        setError(error?.message || "Failed to fetch stacks");
      }
      setLoading(false);
    };
    fetchStacks();
  }, []);

  const filteredStacks = useMemo(() => {
    if (!searchQuery.trim()) return stacks;
    const q = searchQuery.trim().toLowerCase();
    return stacks.filter(
      (stack) =>
        stack.name.toLowerCase().includes(q) ||
        (stack.description && stack.description.toLowerCase().includes(q))
    );
  }, [stacks, searchQuery]);

  const handleSearch = () => {};
  const clearSearch = () => setSearchQuery("");

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <div className="border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">AI Tool Stacks</h1>
          <p className="text-gray-500 text-lg mb-6">Curated collections of AI tools for specific workflows</p>
          <div className="flex gap-3 max-w-xl mx-auto">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Search stacks..."
                className="pl-12 pr-12 py-3 text-base border border-gray-200 rounded-full bg-gray-50 focus:bg-white"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  type="button"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="text-center py-20 text-gray-400">Loading stacks...</div>
        ) : error ? (
          <div className="text-center py-20 text-red-500">{error}</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredStacks.length === 0 ? (
              <div className="col-span-full text-center text-gray-400 py-20">No stacks found.</div>
            ) : (
              filteredStacks.map((stack) => {
                const products = (stack.product_stacks || [])
                  .map((ps) => ps.product)
                  .filter((product) => product && isProductVisible(product));
                const displayProducts = products.slice(0, 4);
                const extraCount = products.length - 4;
                return (
                  <Link key={stack.id} href={`/stack/${stack.slug}`} className="block group">
                    <Card className="overflow-hidden border border-gray-200 hover:shadow-lg transition-all duration-300 hover:border-blue-200 rounded-2xl bg-white flex flex-col cursor-pointer">
                      {/* Header with Tool Logos - Overlapping Style */}
                      <div className="h-28 bg-white flex items-center justify-center px-6 border-b border-gray-100">
                        <div className="flex items-center">
                          {displayProducts.map((product, pIdx) => (
                            <div
                              key={product.id || pIdx}
                              className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center border-2 border-white shadow-md bg-white"
                              style={{ marginLeft: pIdx === 0 ? 0 : -16, zIndex: pIdx + 1 }}
                            >
                              {product.logo_url || product.tool_thumbnail_url ? (
                                <img
                                  src={product.logo_url || product.tool_thumbnail_url}
                                  alt={product.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                                  <span className="text-gray-700 text-sm font-bold">
                                    {product.name?.charAt(0)?.toUpperCase() || "?"}
                                  </span>
                                </div>
                              )}
                            </div>
                          ))}
                          {extraCount > 0 && (
                            <div
                              className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center border-2 border-white shadow-md"
                              style={{ marginLeft: -16, zIndex: displayProducts.length + 1 }}
                            >
                              <span className="text-gray-600 text-sm font-semibold">
                                +{extraCount}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <CardContent className="p-4 bg-white flex-1 flex flex-col">
                        <h3 className="font-bold text-base text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
                          {stack.name}
                        </h3>
                        <p className="text-gray-500 text-xs mb-3 line-clamp-2 flex-1">
                          {stack.description}
                        </p>
                        <div className="flex items-center text-gray-500 text-xs mt-auto">
                          <span>{products.length} tools</span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
