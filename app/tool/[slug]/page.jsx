"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Header from "@/components/header";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ShareModal from "@/components/ui/share-modal";
import ReportModal from "@/components/ui/report-modal";
import SocialFeeds from "@/components/social-feeds";
import {
  Star,
  ExternalLink,
  Heart,
  Share2,
  Flag,
  TrendingUp,
  Clock,
  MapPin,
  Calendar,
  Users,
  Globe,
  MessageSquare,
  ThumbsUp,
  User,
  Shuffle,
  Zap
} from "lucide-react";
import { notFound } from "next/navigation";
import { isProductVisible } from "@/lib/products.mjs";

// Trending products are fetched dynamically by IDs

const getCategoryImage = (category) => {
  const categoryImages = {
    "Writing & Content": "/ai-writing-tool-interface.png",
    "Design & Creative": "/logo-design-ai-interface.png",
    "Code & Development": "/code-generation-ai-interface.png",
    "Marketing & SEO": "/futuristic-ai-interface.png",
    "Image Generation": "/futuristic-ai-interface.png",
    "Chatbots & Automation": "/futuristic-ai-interface.png",
  };
  return categoryImages[category] || "/futuristic-ai-interface.png";
};

const sampleReviews = [
  {
    id: 1,
    user: "Sarah Johnson",
    avatar: "SJ",
    rating: 5,
    date: "2 days ago",
    comment:
      "This tool has completely transformed my content creation workflow. The AI understands context perfectly and maintains my brand voice consistently.",
    helpful: 12,
  },
  {
    id: 2,
    user: "Mike Chen",
    avatar: "MC",
    rating: 4,
    date: "1 week ago",
    comment:
      "Great tool overall! The interface is intuitive and the results are impressive. Would love to see more customization options in future updates.",
    helpful: 8,
  },
  {
    id: 3,
    user: "Emily Rodriguez",
    avatar: "ER",
    rating: 5,
    date: "2 weeks ago",
    comment:
      "Outstanding quality and speed. I've tried many similar tools but this one stands out for its accuracy and ease of use. Highly recommended!",
    helpful: 15,
  },
];

const teamMembers = [
  {
    name: "Alex Thompson",
    role: "Co-Founder & CEO",
    avatar: "AT",
    bio: "Former Google AI researcher with 10+ years in machine learning and natural language processing.",
    linkedin: "#",
  },
  {
    name: "Maria Garcia",
    role: "Co-Founder & CTO",
    avatar: "MG",
    bio: "PhD in Computer Science from Stanford. Previously led AI initiatives at Microsoft and OpenAI.",
    linkedin: "#",
  },
  {
    name: "David Kim",
    role: "Head of Product",
    avatar: "DK",
    bio: "Product strategist with experience at Notion and Figma. Passionate about user-centric AI design.",
    linkedin: "#",
  },
];

export default function ToolDetailPage() {
  const params = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [latestNews, setLatestNews] = useState([
    { title: "New AI Writing Features Released", date: "2 days ago" },
    { title: "Platform Security Update", date: "1 week ago" },
    { title: "Community Milestone: 50K Users", date: "2 weeks ago" },
  ]);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [sponsoredProducts, setSponsoredProducts] = useState([]);

  useEffect(() => {
    if (params?.slug) {
      fetchProduct();
    }
    // The route slug is the only value that should trigger a reload.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params?.slug]);

  useEffect(() => {
    fetchAINews();
  }, []);

  // Fetch sponsored products for sidebar from ads table
  useEffect(() => {
    const fetchSponsoredProducts = async () => {
      try {
        // Fetch ads from the ads table where visiblity is true
        const { data: adsData, error: adsError } = await supabase
          .from("ads")
          .select("tool_id")
          .eq("visibility", true)
          .order("created_at", { ascending: false })
          .limit(2);

        if (adsError || !adsData || adsData.length === 0) {
          setSponsoredProducts([]);
          return;
        }

        // Extract tool IDs from ads
        const toolIds = adsData.map((ad) => ad.tool_id).filter(Boolean);

        if (toolIds.length === 0) {
          setSponsoredProducts([]);
          return;
        }

        // Fetch the product details for these tool IDs
        const { data: productsData, error: productsError } = await supabase
          .from("products")
          .select(
            `
            id, name, slug, tagline, logo_url, tool_thumbnail_url,
            product_categories:product_category_jnc(
              category:categories!product_category_jnc_category_id_fkey(id, name)
            )
          `
          )
          .in("id", toolIds);

        if (productsError || !productsData) {
          setSponsoredProducts([]);
          return;
        }

        // Sort products to match the order from ads table and filter out current product
        const sortedProducts = toolIds
          .map((id) => productsData.find((p) => p.id === id))
          .filter(
            (p) => p && p.slug !== params?.slug && isProductVisible(p)
          );

        setSponsoredProducts(sortedProducts.slice(0, 2));
      } catch (err) {
        console.error("Error fetching sponsored products:", err);
        setSponsoredProducts([]);
      }
    };

    fetchSponsoredProducts();
  }, [params?.slug]);

  // Fetch related products based on matching categories (products can have multiple categories)
  useEffect(() => {
    const fetchRelatedProducts = async () => {
      if (!product?.id) return;
      
      try {
        // First, get all category IDs for the current product
        const { data: currentProductCategories, error: catError } = await supabase
          .from("product_category_jnc")
          .select("category_id")
          .eq("product_id", product.id);

        if (catError || !currentProductCategories?.length) {
          console.error("Error fetching current product categories:", catError);
          return;
        }

        const currentCategoryIds = currentProductCategories.map(pc => pc.category_id);

        // Find all products that share at least one category with the current product
        const { data: relatedProductIds, error: relatedError } = await supabase
          .from("product_category_jnc")
          .select("product_id, category_id")
          .in("category_id", currentCategoryIds)
          .neq("product_id", product.id);

        if (relatedError) {
          console.error("Error fetching related product IDs:", relatedError);
          return;
        }

        // Count how many categories each product shares and sort by match count
        const productMatchCount = {};
        relatedProductIds.forEach(item => {
          productMatchCount[item.product_id] = (productMatchCount[item.product_id] || 0) + 1;
        });

        // Sort by match count (descending) and take top 3
        const sortedProductIds = Object.entries(productMatchCount)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([id]) => parseInt(id));

        if (sortedProductIds.length === 0) {
          setRelatedProducts([]);
          return;
        }

        // Fetch the product details for the top related products
        const { data: products, error: productsError } = await supabase
          .from("products")
          .select(
            `
            id, name, slug, tagline,
            product_categories:product_category_jnc(
              category:categories!product_category_jnc_category_id_fkey(id, name)
            )
          `
          )
          .in("id", sortedProductIds);

        if (productsError) {
          console.error("Error fetching related products:", productsError);
          return;
        }

        // Sort the results by match count to maintain the ranking
        const sortedProducts = products
          .filter(isProductVisible)
          .sort((a, b) => {
            return productMatchCount[b.id] - productMatchCount[a.id];
          });

        setRelatedProducts(sortedProducts);
      } catch (err) {
        console.error("Error fetching related products:", err);
      }
    };

    fetchRelatedProducts();
  }, [product]);

  const fetchAINews = async () => {
    try {
      const response = await fetch("/api/fetch-ai-news");
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.news) {
          setLatestNews(data.news.slice(0, 3)); // Show only 3 latest news items
        }
      }
    } catch (error) {
      console.error("Failed to fetch AI news:", error);
      // Keep the default news if API fails
    }
  };

  const fetchProduct = async () => {
    try {
      setLoading(true);
      setError(null);

      // Try to find by slug first, then by ID if slug doesn't work
      let { data, error } = await supabase
        .from("products")
        .select(
          `
          *,
          company:companies(name, slug, website_url, logo_url, verified, team_size, funding_round, funding_amount, funding_info),
          category:categories(name, slug)
        `
        )
        .eq("slug", params.slug)
        .single();

      // If not found by slug, try by ID (in case the URL contains a numeric ID)
      if (error && !isNaN(params.slug)) {
        const { data: idData, error: idError } = await supabase
          .from("products")
          .select(
            `
            *,
            company:companies(name, slug, website_url, logo_url, verified, team_size, funding_round, funding_amount, funding_info),
            category:categories(name, slug)
          `
          )
          .eq("id", parseInt(params.slug))
          .single();

        if (!idError) {
          data = idData;
          error = null;
        }
      }

      if (error) {
        console.error("Error fetching product:", error);
        setError(error.message);
        return;
      }

      if (!isProductVisible(data)) {
        setError("Product not found");
        return;
      }

      setProduct(data);
    } catch (err) {
      console.error("Error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="grid lg:grid-cols-2 gap-12">
              <div className="aspect-video bg-gray-200 rounded-lg"></div>
              <div className="space-y-4">
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-6 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="bg-red-50 border border-red-200 rounded-md p-8">
              <h1 className="text-2xl font-bold text-red-700 mb-4">
                Tool Not Found
              </h1>
              <p className="text-red-600 mb-6">
                {error || "The tool you are looking for could not be found."}
              </p>
              <Button onClick={() => window.history.back()}>Go Back</Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="flex text-sm text-gray-500 mb-6">
          <span>Home</span>
          <span className="mx-2">/</span>
          <span className="text-gray-900">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-7 gap-8">
          {/* Main Content - Tool Info */}
          <div className="lg:col-span-5">
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                {/* Company Logo and Product Name */}
                <div className="flex items-center gap-4 mb-3">
                  {/* {(product.logo_url || product.company?.logo_url) && (
                    <img
                      src={product.logo_url || product.company.logo_url}
                      alt={`${product.company?.name || product.name} logo`}
                      className="h-12 w-12 object-contain flex-shrink-0"
                    />
                  )} */}

                  <h1 className="text-3xl font-bold text-gray-900">
                    {product.name}
                  </h1>
                </div>
                {product.tagline && (
                  <p className="text-gray-600 text-lg leading-relaxed mb-4">
                    {product.tagline}
                  </p>
                )}

                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span>by</span>
                    <span className="text-gray-900 font-medium">
                      {product.company?.name || "Unknown Company"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {product.website_url && (
                    <a
                      href={product.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button
                        size="lg"
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Website
                      </Button>
                    </a>
                  )}
                  {/* Save button hidden for now */}
                  {/* <Button variant="outline" size="lg">
                    <Heart className="w-4 h-4 mr-2" />
                    Save
                  </Button> */}
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => setShowShareModal(true)}
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Share
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => setShowReportModal(true)}
                  >
                    <Flag className="w-4 h-4 mr-2" />
                    Report
                  </Button>
                </div>
              </div>
            </div>

            <div className="w-full mb-6">
              {/* Badge above the image */}
              <div className="mb-2">
                <Badge className="bg-black/50 text-white border-0">
                  {product.is_verified ? "Verified" : "New"}
                </Badge>
              </div>

              <div className="relative rounded-lg overflow-hidden">
                {product.tool_thumbnail_url ? (
                  <img
                    src={product.tool_thumbnail_url}
                    alt={`${product.name} interface preview`}
                    className="w-full h-full object-contain"
                  />
                ) : product.banner_url ? (
                  <img
                    src={product.banner_url}
                    alt={`${product.name} interface preview`}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
                    <div className="text-white text-center">
                      <div className="text-6xl mb-4">🚀</div>
                      <div className="text-xl opacity-80">{product.name}</div>
                    </div>
                  </div>
                )}
                <div className="absolute bottom-4 right-4">
                  <Badge
                    variant="secondary"
                    className="bg-white/90 text-gray-900"
                  >
                    AI
                  </Badge>
                </div>
              </div>
            </div>

            <div className="mt-8">
              {/* Tabs */}
              <div className="bg-white rounded-lg shadow-sm border">
                <Tabs defaultValue="about" className="w-full">
                  <TabsList className="w-full justify-start border-b rounded-none bg-transparent p-0">
                    <TabsTrigger
                      value="about"
                      className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent"
                    >
                      About
                    </TabsTrigger>
                    {/*
                    <TabsTrigger
                      value="social-feeds"
                      className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent"
                    >
                      Social Feeds
                    </TabsTrigger>
                       */}
                    { /*
                    <TabsTrigger
                      value="team"
                      className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent"
                    >
                      Team
                    </TabsTrigger>
                     */}
                  </TabsList>

                  <TabsContent value="about" className="p-6">
                    <div className="space-y-6">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">
                          About {product.name}
                        </h2>
                        <p className="text-gray-700 leading-relaxed mb-6">
                          {product.description || "No description available."}
                        </p>
                      </div>
                       {/*
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-4">
                          About {product.company?.name || "Unknown Company"}
                        </h3>
                      
                        <p className="text-gray-700 leading-relaxed mb-6">
                          {product.company?.name || "This company"} has been at
                          the forefront of AI technology, creating innovative
                          tools that help businesses and individuals achieve
                          their goals more efficiently. Our commitment to
                          excellence and user satisfaction drives everything we
                          do.
                        </p>
                      </div>
                        */}
                    {/*
                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <div className="flex flex-col items-center text-center p-4 bg-gray-50 rounded-lg">
                          <Globe className="w-8 h-8 text-blue-600 mb-2" />
                          <div className="font-semibold text-gray-900 text-sm mb-1">
                            Website
                          </div>
                          <div className="text-blue-600 text-sm">
                            {product.website_url ? (
                              <a
                                href={product.website_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:underline"
                              >
                                {product.website_url.replace(
                                  /^https?:\/\//,
                                  ""
                                )}
                              </a>
                            ) : (
                              "No website available"
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col items-center text-center p-4 bg-gray-50 rounded-lg">
                          <Calendar className="w-8 h-8 text-blue-600 mb-2" />
                          <div className="font-semibold text-gray-900 text-sm mb-1">
                            Founded in
                          </div>
                          <div className="text-gray-600 text-sm">2019</div>
                        </div>

                        <div className="flex flex-col items-center text-center p-4 bg-gray-50 rounded-lg">
                          <MapPin className="w-8 h-8 text-blue-600 mb-2" />
                          <div className="font-semibold text-gray-900 text-sm mb-1">
                            Location
                          </div>
                          <div className="text-gray-600 text-sm">
                            San Francisco, CA
                          </div>
                        </div>
                      </div>
                      */}
                      {/*
                      <div className="grid grid-cols-3 gap-4">
                        <div className="flex flex-col items-center text-center p-4 bg-gray-50 rounded-lg">
                          <Users className="w-8 h-8 text-blue-600 mb-2" />
                          <div className="font-semibold text-gray-900 text-sm mb-1">
                            Team Size
                          </div>
                          <div className="text-gray-600 text-sm">
                            {product.company?.team_size || "—"}
                          </div>
                        </div>

                        <div className="flex flex-col items-center text-center p-4 bg-gray-50 rounded-lg">
                          <TrendingUp className="w-8 h-8 text-blue-600 mb-2" />
                          <div className="font-semibold text-gray-900 text-sm mb-1">
                            Funding
                          </div>
                          <div className="text-gray-600 text-sm">
                            {(product.company?.funding_round ||
                              product.company?.funding_info ||
                              "—") +
                              (product.company?.funding_amount
                                ? ` • ${product.company.funding_amount}`
                                : "")}
                          </div>
                        </div>

                        <div></div>
                      </div>
                      */}
                    </div>
                    
                  </TabsContent>

                  <TabsContent value="social-feeds" className="p-6">
                    <div className="space-y-8">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">
                          Social Feeds
                        </h2>

                        <SocialFeeds
                          productId={product.id}
                          toolName={product.name}
                        />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="team" className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {teamMembers.map((member, index) => (
                        <div
                          key={index}
                          className="bg-white border rounded-lg p-6 text-center"
                        >
                          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg mx-auto mb-4">
                            {member.avatar}
                          </div>
                          <h3 className="font-semibold text-gray-900 mb-1">
                            {member.name}
                          </h3>
                          <p className="text-blue-600 text-sm">{member.role}</p>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>

            {/* Reviews section hidden */}
            {/* <div className="mt-8">
               <div className="bg-white rounded-lg shadow-sm border p-6">
                 <div className="flex items-center justify-between mb-6">
                   <h2 className="text-2xl font-bold text-gray-900">Reviews</h2>
                   <Button variant="outline">Write a Review</Button>
                 </div>

                 <div className="space-y-6">
                   {sampleReviews.map((review) => (
                     <div key={review.id} className="border-b border-gray-200 pb-6 last:border-b-0">
                       <div className="flex items-start gap-4">
                         <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                           {review.avatar}
                         </div>
                         <div className="flex-1">
                           <div className="flex items-center gap-2 mb-2">
                             <span className="font-semibold text-gray-900">{review.user}</span>
                             <div className="flex items-center gap-1">
                               {[...Array(5)].map((_, i) => (
                                 <Star
                                   key={i}
                                   className={`w-4 h-4 ${
                                     i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                                   }`}
                                 />
                               ))}
                             </div>
                             <span className="text-gray-500 text-sm">• {review.date}</span>
                           </div>
                           <p className="text-gray-700 mb-3">{review.comment}</p>
                           <div className="flex items-center gap-2 text-sm text-gray-500">
                             <Button variant="ghost" size="sm" className="h-auto p-0 text-gray-500 hover:text-gray-700">
                               <ThumbsUp className="w-4 h-4 mr-1" />
                               Helpful ({review.helpful})
                             </Button>
                           </div>
                         </div>
                       </div>
                     </div>
                   ))}
                 </div>
               </div>
             </div> */}
          </div>

          {/* Right Sidebar */}
          <div className="lg:col-span-2 space-y-6">
            {/* Sponsored Tools Section */}
            {sponsoredProducts.length > 0 && (
              <Card className="border-blue-200 shadow-lg bg-gradient-to-br from-blue-50/50 to-indigo-50/50">
                <CardHeader className="pb-4 border-b border-blue-100 bg-gradient-to-r from-blue-100 to-indigo-100">
                  <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                    <div className="flex items-center justify-center w-6 h-6 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-lg">
                      <Zap className="w-4 h-4 text-white fill-white" />
                    </div>
                    Sponsored Tools
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-5">
                  {sponsoredProducts.map((sp, index) => {
                    const categoryNames = (sp.product_categories || [])
                      .map((pc) => pc?.category?.name)
                      .filter(Boolean);
                    const categoryName = categoryNames.join(", ");
                    const subline = sp.tagline || categoryName || "AI-powered tool";
                    const href = `/tool/${sp.slug || sp.id}`;
                    return (
                      <Link
                        href={href}
                        key={sp.id}
                        className="flex items-start gap-3 p-4 rounded-lg hover:bg-blue-100/50 transition-colors border border-transparent hover:border-blue-200 hover:shadow-sm group"
                      >
                        {/* Tool Logo/Avatar */}
                        <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 border border-blue-200 shadow-sm">
                          {sp.logo_url || sp.tool_thumbnail_url ? (
                            <img
                              src={sp.logo_url || sp.tool_thumbnail_url}
                              alt={sp.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center">
                              <span className="text-white text-sm font-bold">
                                {sp.name?.charAt(0)?.toUpperCase() || "?"}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-1">
                            <p className="font-semibold text-sm text-gray-900 truncate leading-tight group-hover:text-blue-700 transition-colors">
                              {sp.name}
                            </p>
                            <Star className="w-3.5 h-3.5 text-blue-400 fill-blue-400 flex-shrink-0" />
                          </div>
                          <p className="text-xs text-gray-600 line-clamp-2">{subline}</p>
                        </div>
                      </Link>
                    );
                  })}
                </CardContent>
              </Card>
            )}

            <Card className="border-gray-200 shadow-lg bg-white">
              <CardHeader className="pb-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-blue-100">
                <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                  <Shuffle className="w-5 h-5 text-blue-600" />
                  Related Tools
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-5">
                {relatedProducts.length > 0 ? (
                  relatedProducts.map((tp, index) => {
                    const categoryNames = (tp.product_categories || [])
                      .map((pc) => pc?.category?.name)
                      .filter(Boolean);
                    const categoryName = categoryNames.join(", ");
                    const subline = tp.tagline || categoryName || "—";
                    const href = `/tool/${tp.slug || tp.id}`;
                    return (
                      <Link
                        href={href}
                        key={tp.id}
                        className="flex items-start gap-4 p-4 rounded-lg hover:bg-blue-50 transition-colors border border-transparent hover:border-blue-200 hover:shadow-sm"
                      >
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 shadow-sm">
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-gray-900 truncate leading-tight mb-1">
                            {tp.name}
                          </p>
                          <p className="text-xs text-gray-600 mb-2">{subline}</p>
                        </div>
                      </Link>
                    );
                  })
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">No related tools found</p>
                )}
              </CardContent>
            </Card>

            <Card className="border-gray-200 shadow-lg bg-white">
              <CardHeader className="pb-4 border-b border-gray-100 bg-gradient-to-r from-green-50 to-green-100">
                <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                  <Clock className="w-5 h-5 text-green-600" />
                  Latest News
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-5">
                {latestNews.map((news, index) => (
                  <a
                    key={index}
                    href={news.url || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-4 rounded-lg hover:bg-green-50 transition-colors border border-transparent hover:border-green-200 hover:shadow-sm"
                  >
                    <p className="font-semibold text-sm text-gray-900 leading-tight mb-2">
                      {news.title}
                    </p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span className="font-medium">{news.date}</span>
                      {news.source && (
                        <span className="text-gray-400">via {news.source}</span>
                      )}
                    </div>
                  </a>
                ))}
              </CardContent>
            </Card>

            <div className="h-32"></div>
          </div>
        </div>
      </div>

      {/* Share Modal */}
      <ShareModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        url={typeof window !== "undefined" ? window.location.href : ""}
        title={product?.name}
        description={product?.description}
      />

      {/* Report Modal */}
      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        toolName={product?.name}
        toolId={product?.id}
      />
    </div>
  );
}
