"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import DOMPurify from "dompurify";
import {
  Calendar,
  Eye,
  BookOpen,
  Twitter,
  Linkedin,
  Share2,
  ArrowLeft,
} from "lucide-react";
import Header from "@/components/header";
import { supabase } from "@/lib/supabase";

export default function BlogDetailPage() {
  const params = useParams();
  const slug = params?.slug;

  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const sanitizedContent = useMemo(() => {
    if (typeof window === "undefined" || !blog?.content) return "";
    return DOMPurify.sanitize(blog.content, {
      USE_PROFILES: { html: true },
    });
  }, [blog?.content]);

  useEffect(() => {
    if (slug) {
      fetchBlog();
    }
    // The route slug is the only value that should trigger a reload.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  async function fetchBlog() {
    setLoading(true);

    const { data, error } = await supabase
      .from("blogs")
      .select(
        `
        id,
        title,
        slug,
        summary,
        content,
        category,
        tags,
        thumbnail_url,
        created_at,
        users:created_by (
          id,
          name
        )
      `
      )
      .eq("slug", slug)
      .eq("status", "published")
      .single();

    if (error) {
      console.error("Error fetching blog:", error);
    } else {
      setBlog(data);
    }
    setLoading(false);
  }

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Calculate reading time
  const getReadingTime = (content) => {
    if (!content) return "1 min read";
    const wordsPerMinute = 200;
    const words = content.split(/\s+/).length;
    const minutes = Math.ceil(words / wordsPerMinute);
    return `${minutes} min read`;
  };

  // Detect whether content is HTML (from rich text editor) or legacy plain text
  const isHTML = (str) => str && str.trimStart().startsWith("<");

  // Share handlers
  const shareOnTwitter = () => {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(blog?.title || "");
    window.open(
      `https://twitter.com/intent/tweet?url=${url}&text=${text}`,
      "_blank"
    );
  };

  const shareOnLinkedIn = () => {
    const url = encodeURIComponent(window.location.href);
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
      "_blank"
    );
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    alert("Link copied to clipboard!");
  };

  if (loading) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-gradient-to-b from-blue-50/30 to-white">
          <div className="max-w-4xl mx-auto px-6 py-16">
            <div className="animate-pulse space-y-6">
              <div className="h-10 bg-gray-200 rounded w-3/4 mx-auto" />
              <div className="h-4 bg-gray-200 rounded w-1/4 mx-auto" />
              <div className="h-32 bg-gray-100 rounded-xl mt-8" />
              <div className="space-y-3 mt-8">
                <div className="h-4 bg-gray-200 rounded w-full" />
                <div className="h-4 bg-gray-200 rounded w-5/6" />
                <div className="h-4 bg-gray-200 rounded w-4/6" />
              </div>
            </div>
          </div>
        </main>
      </>
    );
  }

  if (!blog) {
    return (
      <>
        <Header />
        <main className="min-h-screen bg-gradient-to-b from-blue-50/30 to-white">
          <div className="max-w-4xl mx-auto px-6 py-16 text-center">
            <h1 className="text-2xl font-semibold text-gray-900 mb-4">
              Blog not found
            </h1>
            <p className="text-gray-600 mb-6">
              The article you're looking for doesn't exist or has been removed.
            </p>
            <Link
              href="/blogs"
              className="inline-flex items-center gap-2 text-blue-600 hover:underline"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Blogs
            </Link>
          </div>
        </main>
      </>
    );
  }


  return (
    <>
      <Header />
      <main className="min-h-screen bg-gradient-to-b from-blue-50/30 to-white">
        {/* Article Header */}
        <header className="text-center pt-16 pb-8 px-6">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 max-w-4xl mx-auto leading-tight">
            {blog.title}
          </h1>

          {/* Meta Info */}
          <div className="flex items-center justify-center gap-4 mt-6 text-sm text-gray-500">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              {formatDate(blog.created_at)}
            </div>
            <span className="text-gray-300">•</span>
            <div className="flex items-center gap-1.5">
              <Eye className="w-4 h-4" />
              1248 views
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="max-w-6xl mx-auto px-6 pb-16">
          <div className="grid lg:grid-cols-[1fr_280px] gap-8">
            {/* Main Content */}
            <article className="space-y-8">
              {/* TL;DR Card */}
              {blog.summary && (
                <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-2xl p-6 border border-blue-100">
                  <div className="flex items-center gap-2 mb-3">
                    <BookOpen className="w-5 h-5 text-blue-600" />
                    <span className="font-semibold text-gray-900">TL;DR</span>
                  </div>
                  <p className="text-gray-700 leading-relaxed">{blog.summary}</p>
                </div>
              )}

              {/* Article Content */}
              {isHTML(blog.content) ? (
                <div
                  className="prose prose-gray prose-headings:font-bold prose-a:text-blue-600 prose-blockquote:border-l-blue-400 max-w-none"
                  dangerouslySetInnerHTML={{ __html: sanitizedContent }}
                />
              ) : (
                <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {blog.content}
                </div>
              )}

              {/* Tags */}
              {blog.tags && blog.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-100">
                  {blog.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1.5 bg-gray-100 text-gray-600 text-sm rounded-full hover:bg-gray-200 transition-colors cursor-pointer"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Author Card */}
              <div className="bg-white rounded-2xl border border-gray-100 p-6 mt-8">
                <div className="flex items-start gap-4">
                  {blog.users?.avatar_url ? (
                    <img
                      src={blog.users.avatar_url}
                      alt={blog.users.name}
                      className="w-14 h-14 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xl font-semibold">
                      {blog.users?.name?.charAt(0)?.toUpperCase() || "A"}
                    </div>
                  )}

                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">
                      {blog.users?.name || "Anonymous"}
                    </h4>
                    <p className="text-sm text-gray-500 mt-1">
                      {blog.users?.bio ||
                        "AI researcher and tech writer specializing in productivity tools and automation."}
                    </p>

                    {/* Author Social Links */}
                    <div className="flex items-center gap-3 mt-3">
                      <button className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors">
                        <Twitter className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                        <Linkedin className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </article>

            {/* Sidebar */}
            <aside className="lg:sticky lg:top-24 lg:self-start space-y-6">
              {/* Share Card */}
              <div className="bg-white rounded-2xl border border-gray-100 p-5">
                <h4 className="font-semibold text-gray-900 mb-4">
                  Share this article
                </h4>

                <div className="flex items-center gap-2">
                  <button
                    onClick={shareOnTwitter}
                    className="flex-1 flex items-center justify-center gap-2 p-2.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors"
                  >
                    <Twitter className="w-4 h-4" />
                  </button>
                  <button
                    onClick={shareOnLinkedIn}
                    className="flex-1 flex items-center justify-center gap-2 p-2.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors"
                  >
                    <Linkedin className="w-4 h-4" />
                  </button>
                  <button
                    onClick={copyLink}
                    className="flex-1 flex items-center justify-center gap-2 p-2.5 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Back to Blogs */}
              <Link
                href="/Blogs"
                className="flex items-center justify-center gap-2 w-full p-3 text-sm text-gray-600 hover:text-gray-900 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to all articles
              </Link>
            </aside>
          </div>
        </div>
      </main>
    </>
  );
}
