"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Eye, Save, Upload, X, Loader2 } from "lucide-react";
import { supabase } from "@/lib/admin-supabase";
import { toast } from "@/hooks/use-toast";
import RichTextEditor from "@/components/rich-text-editor";

const CATEGORIES = ["Tool", "Stack", "News"];

export default function EditBlogPage() {
  const router = useRouter();
  const { id } = useParams();
  const fileInputRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [availableTags, setAvailableTags] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);

  const [form, setForm] = useState({
    title: "",
    slug: "",
    summary: "",
    content: "",
    category: "",
    thumbnail: "",
    meta_description: "",
    status: "pending",
  });

  useEffect(() => {
    fetchTags();
    fetchBlog();
    // The route ID is the only value that should trigger a reload.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function fetchTags() {
    const { data, error } = await supabase
      .from("tags")
      .select("id, name, slug")
      .order("name");
    if (!error) setAvailableTags(data ?? []);
  }

  async function fetchBlog() {
    setFetching(true);
    const { data, error } = await supabase
      .from("blogs")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      console.error("Failed to load blog:", error);
      toast({ title: "Error", description: "Blog post not found.", variant: "destructive" });
      router.push("/admin/blogs");
      return;
    }

    setForm({
      title: data.title ?? "",
      slug: data.slug ?? "",
      summary: data.summary ?? "",
      content: data.content ?? "",
      category: data.category ?? "",
      thumbnail: data.thumbnail_url ?? "",
      meta_description: data.meta_description ?? "",
      status: data.status ?? "pending",
    });
    setSelectedTags(Array.isArray(data.tags) ? data.tags : []);
    setFetching(false);
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleTagToggle(tagName) {
    setSelectedTags((prev) =>
      prev.includes(tagName) ? prev.filter((t) => t !== tagName) : [...prev, tagName]
    );
  }

  async function handleImageUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!validTypes.includes(file.type)) {
      toast({ title: "Invalid file type", description: "Please upload a JPEG, PNG, GIF, or WebP image.", variant: "destructive" });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Please upload an image smaller than 5MB.", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `BlogImages${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const { error } = await supabase.storage.from("product-images").upload(fileName, file, { cacheControl: "3600", upsert: false });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("product-images").getPublicUrl(fileName);
      setForm((prev) => ({ ...prev, thumbnail: urlData.publicUrl }));
      toast({ title: "Success", description: "Image uploaded successfully!" });
    } catch (error) {
      console.error("Upload error:", error);
      toast({ title: "Upload failed", description: error.message || "Failed to upload image.", variant: "destructive" });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleSubmit() {
    if (!form.title || !form.summary || !form.content || !form.category) {
      toast({ title: "Missing fields", description: "Title, summary, content and category are required.", variant: "destructive" });
      return;
    }

    setLoading(true);
    const { error } = await supabase
      .from("blogs")
      .update({
        title: form.title,
        slug: form.slug,
        summary: form.summary,
        content: form.content,
        category: form.category,
        tags: selectedTags,
        thumbnail_url: form.thumbnail || null,
        meta_description: form.meta_description || null,
        status: form.status,
      })
      .eq("id", id);

    setLoading(false);

    if (error) {
      console.error(error);
      toast({ title: "Error", description: "Failed to update blog post.", variant: "destructive" });
    } else {
      toast({ title: "Saved", description: "Blog post updated successfully." });
      router.push("/admin/blogs");
    }
  }

  if (fetching) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()}>
            <ArrowLeft />
          </button>
          <div>
            <h1 className="text-2xl font-semibold">Edit Blog Post</h1>
            <p className="text-sm text-muted-foreground">Update your article</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 border px-3 py-2 rounded-md text-sm">
            <Eye size={16} /> Preview
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700"
          >
            <Save size={16} /> {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left — main content */}
        <div className="lg:col-span-2">
          <div className="rounded-xl border bg-white p-6 space-y-6">
            <h2 className="text-sm font-semibold text-gray-900">Post Details</h2>

            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700">Title <span className="text-red-500">*</span></label>
              <input name="title" value={form.title} onChange={handleChange} className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700">Slug <span className="text-red-500">*</span></label>
              <input name="slug" value={form.slug} onChange={handleChange} className="w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <p className="text-xs text-gray-400">URL: /blog/{form.slug || "post-url-slug"}</p>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700">Summary <span className="text-red-500">*</span></label>
              <textarea name="summary" value={form.summary} onChange={handleChange} rows={3} className="w-full rounded-md border px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-700">Content <span className="text-red-500">*</span></label>
              <RichTextEditor
                value={form.content}
                onChange={(html) => setForm((p) => ({ ...p, content: html }))}
                placeholder="Write your blog post content here..."
              />
            </div>
          </div>
        </div>

        {/* Right — sidebar */}
        <div className="space-y-6">
          {/* Publishing */}
          <div className="rounded-xl border bg-white p-5">
            <h3 className="text-sm font-semibold mb-4">Publishing</h3>
            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600">Status</label>
              <select name="status" value={form.status} onChange={handleChange} className="w-full rounded-md border px-3 py-2 text-sm bg-white">
                <option value="pending">Pending</option>
                <option value="published">Published</option>
              </select>
            </div>
          </div>

          {/* Metadata */}
          <div className="rounded-xl border bg-white p-5 space-y-4">
            <h3 className="text-sm font-semibold">Metadata</h3>

            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600">Category <span className="text-red-500">*</span></label>
              <select name="category" value={form.category} onChange={handleChange} className="w-full rounded-md border px-3 py-2 text-sm bg-white">
                <option value="">Select category</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-600">Tags</label>
              <div className="max-h-48 overflow-y-auto border rounded-md p-3 space-y-2">
                {availableTags.length === 0 ? (
                  <p className="text-xs text-gray-400">No tags available</p>
                ) : (
                  availableTags.map((tag) => (
                    <label key={tag.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                      <input
                        type="checkbox"
                        checked={selectedTags.includes(tag.name)}
                        onChange={() => handleTagToggle(tag.name)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">{tag.name}</span>
                    </label>
                  ))
                )}
              </div>
              {selectedTags.length > 0 && (
                <p className="text-xs text-gray-500">Selected: {selectedTags.join(", ")}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-600">Thumbnail Image</label>
              {form.thumbnail ? (
                <div className="relative">
                  <img src={form.thumbnail} alt="Thumbnail" className="w-full h-32 object-cover rounded-md border" />
                  <button type="button" onClick={() => setForm((p) => ({ ...p, thumbnail: "" }))} className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600">
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => !uploading && fileInputRef.current?.click()}
                  className={`w-full h-32 border-2 border-dashed rounded-md flex flex-col items-center justify-center cursor-pointer ${uploading ? "border-gray-300 bg-gray-50 cursor-not-allowed" : "border-gray-300 hover:border-blue-500 hover:bg-blue-50"}`}
                >
                  {uploading ? (
                    <><Loader2 size={24} className="text-blue-500 animate-spin" /><span className="text-xs text-gray-500 mt-2">Uploading...</span></>
                  ) : (
                    <><Upload size={24} className="text-gray-400" /><span className="text-xs text-gray-500 mt-2">Click to upload image</span><span className="text-xs text-gray-400">JPEG, PNG, GIF, WebP (max 5MB)</span></>
                  )}
                </div>
              )}
              <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp" onChange={handleImageUpload} className="hidden" />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-gray-600">Meta Description</label>
              <textarea name="meta_description" value={form.meta_description} onChange={handleChange} rows={3} className="w-full rounded-md border px-3 py-2 text-sm resize-none" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
