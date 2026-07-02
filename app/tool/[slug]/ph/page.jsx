"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Header from "@/components/header";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  ExternalLink,
  Share2,
  BookmarkPlus,
  BarChart3,
  Heart,
  CheckCircle,
} from "lucide-react";
import Link from "next/link";
import { isProductVisible } from "@/lib/products.mjs";

export default function ProductHuntStylePage() {
  const params = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (params?.slug) fetchProduct();
    // The route slug is the only value that should trigger a reload.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params?.slug]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      setError(null);

      let { data, error } = await supabase
        .from("products")
        .select(
          `
          *,
          company:companies(name, slug, website_url, logo_url, verified, team_size, funding_round, funding_amount, funding_info),
          category:categories(name, slug),
          product_categories:product_category_jnc(category:categories!product_category_jnc_category_id_fkey(name, slug)),
          product_tags:product_tags_jnc(tag:tags!product_tags_jnc_tag_id_fkey(name))
        `
        )
        .eq("slug", params.slug)
        .single();

      if (error) {
        setError(error.message);
        return;
      }

      if (!isProductVisible(data)) {
        setError("Product not found");
        return;
      }

      setProduct(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="h-10 bg-gray-200 rounded w-1/3 mb-6" />
          <div className="h-6 bg-gray-200 rounded w-1/4" />
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <p className="text-red-600">{error || "Product not found"}</p>
        </div>
      </div>
    );
  }

  const categoryNames = [
    product?.category?.name,
    ...(product?.product_categories || [])
      .map((pc) => pc?.category?.name)
      .filter(Boolean),
  ].filter(Boolean);

  const tagNames = [
    ...(product?.tags || []),
    ...(product?.product_tags || []).map((pt) => pt?.tag?.name).filter(Boolean),
  ].filter(Boolean);

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Top header row */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            {product.company?.logo_url ? (
              <img
                src={product.company.logo_url}
                alt={product.name}
                className="w-12 h-12 rounded"
              />
            ) : (
              <div className="w-12 h-12 rounded bg-gray-100" />
            )}
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                {product.name}
              </h1>
              <div className="text-sm text-gray-600 flex items-center gap-2">
                <span>{product.company?.name}</span>
                {product.company?.verified && (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                )}
              </div>
            </div>
          </div>
          {product.website_url && (
            <a
              href={product.website_url}
              target="_blank"
              rel="noopener noreferrer"
              className="self-start md:self-auto"
            >
              <Button className="bg-blue-600 hover:bg-blue-700">
                <ExternalLink className="w-4 h-4 mr-2" /> Visit website
              </Button>
            </a>
          )}
        </div>

        {/* Subnav */}
        <div className="flex items-center gap-6 text-sm text-gray-600 border-b pb-3 mb-6">
          <span className="font-medium text-gray-900">Overview</span>
          <span>Reviews</span>
          <span>Team</span>
          <span>More</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main column */}
          <div className="lg:col-span-2">
            {/* Banner */}
            <div className="relative aspect-video bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 rounded-lg overflow-hidden mb-6">
              {product.banner_url && (
                <img
                  src={product.banner_url}
                  alt={`${product.name} banner`}
                  className="w-full h-full object-cover opacity-90"
                />
              )}
            </div>

            {/* Tagline / description */}
            {product.tagline && (
              <p className="text-gray-800 text-lg mb-3">{product.tagline}</p>
            )}
            {product.description && (
              <p className="text-gray-600 mb-4">{product.description}</p>
            )}

            {/* Category pills */}
            <div className="flex flex-wrap gap-2 mb-4">
              {categoryNames.slice(0, 3).map((name, i) => (
                <Badge
                  key={i}
                  variant="secondary"
                  className="text-xs px-3 py-1"
                >
                  {name}
                </Badge>
              ))}
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-8">
              {tagNames.slice(0, 6).map((tag, i) => (
                <Badge
                  key={i}
                  variant="secondary"
                  className="text-xs px-3 py-1"
                >
                  #{tag}
                </Badge>
              ))}
            </div>

            {/* Quick stats from company */}
            <div className="grid grid-cols-2 gap-4 mb-8 max-w-md">
              <div className="p-4 bg-gray-50 rounded-lg text-center">
                <div className="text-xs text-gray-600 mb-1">Team size</div>
                <div className="text-base font-medium text-gray-900">
                  {product.company?.team_size || "—"}
                </div>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg text-center">
                <div className="text-xs text-gray-600 mb-1">Funding</div>
                <div className="text-base font-medium text-gray-900">
                  {product.company?.funding_round ||
                    product.company?.funding_info ||
                    "—"}
                  {product.company?.funding_amount
                    ? ` • ${product.company.funding_amount}`
                    : ""}
                </div>
              </div>
            </div>

            {/* Reviews placeholder */}
            <Card>
              <CardContent className="p-8 text-center">
                <div className="text-lg font-medium text-gray-900 mb-2">
                  Reviews
                </div>
                <div className="text-gray-600 mb-4">
                  Be the first to review {product.name}
                </div>
                <Button variant="outline">Leave a review</Button>
              </CardContent>
            </Card>
          </div>

          {/* Right sidebar */}
          <div className="space-y-3">
            <Button className="w-full bg-red-600 hover:bg-red-700">
              <Heart className="w-4 h-4 mr-2" /> Upvote
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <BookmarkPlus className="w-4 h-4 mr-2" /> Add to collection
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Share2 className="w-4 h-4 mr-2" /> Share
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <BarChart3 className="w-4 h-4 mr-2" /> Analytics
            </Button>

            {/* Company info */}
            <Card className="mt-4">
              <CardContent className="p-4 text-sm">
                <div className="font-semibold text-gray-900 mb-2">
                  Company Info
                </div>
                {product.company?.website_url && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Website</span>
                    <a
                      href={product.company.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {product.company.website_url.replace(/^https?:\/\//, "")}
                    </a>
                  </div>
                )}
                <div className="flex items-center justify-between mt-2">
                  <span className="text-gray-600">Team size</span>
                  <span className="text-gray-900">
                    {product.company?.team_size || "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-gray-600">Funding</span>
                  <span className="text-gray-900">
                    {product.company?.funding_round ||
                      product.company?.funding_info ||
                      "—"}
                    {product.company?.funding_amount
                      ? ` • ${product.company.funding_amount}`
                      : ""}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
