"use client";

import { useState, useEffect } from "react";
import Header from "@/components/header";
import { 
  FileText, 
  Image as ImageIcon,
  Code, 
  Megaphone, 
  Zap, 
  BarChart3, 
  Video, 
  Music,
  Bot,
  Briefcase,
  GraduationCap,
  Heart,
  ShoppingCart,
  Globe
} from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { isProductIdVisible } from "@/lib/products.mjs";

// Icon mapping for categories
const getCategoryIcon = (categoryName) => {
  const iconMap = {
    "Text Generation": <FileText className="w-5 h-5" />,
    "Image Generation": <ImageIcon className="w-5 h-5" />,
    "Developer Tools": <Code className="w-5 h-5" />,
    "Marketing": <Megaphone className="w-5 h-5" />,
    "Productivity": <Zap className="w-5 h-5" />,
    "Data & Analytics": <BarChart3 className="w-5 h-5" />,
    "Video Generation": <Video className="w-5 h-5" />,
    "Audio & Voice": <Music className="w-5 h-5" />,
    "AI Assistants": <Bot className="w-5 h-5" />,
    "Business": <Briefcase className="w-5 h-5" />,
    "Education": <GraduationCap className="w-5 h-5" />,
    "Healthcare": <Heart className="w-5 h-5" />,
    "E-commerce": <ShoppingCart className="w-5 h-5" />,
    "Research": <Globe className="w-5 h-5" />,
  };
  return iconMap[categoryName] || <Zap className="w-5 h-5" />;
};

export default function CategoriesPage() {
  const [dbCategories, setDbCategories] = useState([]);
  const [categoryCounts, setCategoryCounts] = useState({});

  useEffect(() => {
    async function fetchData() {
      const [categoriesRes, productCategoriesRes] = await Promise.all([
        supabase
          .from("categories")
          .select("id, name, slug")
          .order("name", { ascending: true }),
        supabase
          .from("product_category_jnc")
          .select("product_id, category_id"),
      ]);

      if (!categoriesRes.error && categoriesRes.data) {
        setDbCategories(categoriesRes.data);
      }

      if (!productCategoriesRes.error && productCategoriesRes.data) {
        const counts = {};
        productCategoriesRes.data.forEach((row) => {
          if (!isProductIdVisible(row.product_id)) return;
          const id = row.category_id;
          counts[id] = (counts[id] || 0) + 1;
        });
        setCategoryCounts(counts);
      }
    }
    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Page Header */}
      <div className="border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Browse by Category</h1>
          <p className="text-gray-500 text-lg">
            Explore AI tools organized by use case and functionality
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Grid of square category cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {dbCategories.map((category) => (
            <Link
              key={category.id}
              href={`/explore?category=${category.slug || category.id}`}
            >
              <div className="group bg-white rounded-xl border border-gray-200 p-4 hover:shadow-lg hover:border-blue-200 transition-all duration-300 cursor-pointer w-full aspect-square flex flex-col items-center justify-center text-center">
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center mb-3">
                  <span className="text-blue-600">
                    {getCategoryIcon(category.name)}
                  </span>
                </div>
                <h3 className="font-semibold text-sm text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                  {category.name}
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  {categoryCounts[category.id] || 0} tools
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
