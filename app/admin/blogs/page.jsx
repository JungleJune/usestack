"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, Plus, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { supabase } from "@/lib/admin-supabase";

export default function Page() {
  const router = useRouter();
  const [blogs, setBlogs] = useState([]);
  const [search, setSearch] = useState("");
  const [openMenuId, setOpenMenuId] = useState(null);
  const menuRef = useRef(null);

  useEffect(() => {
    fetchBlogs();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpenMenuId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function fetchBlogs() {
    const { data, error } = await supabase
      .from("blogs")
      .select(`
        id,
        title,
        status,
        created_at,
        users:created_by (
          id,
          name
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching blogs:", error);
      return;
    }

    setBlogs(
      data.map((blog) => ({
        id: blog.id,
        title: blog.title,
        status: blog.status,
        created_at: blog.created_at,
        author: blog.users?.name ?? "—",
      }))
    );
  }

  async function handleDelete(blog) {
    if (!confirm(`Delete "${blog.title}"? This cannot be undone.`)) return;
    const { error } = await supabase.from("blogs").delete().eq("id", blog.id);
    if (error) {
      console.error("Delete failed:", error);
      alert("Failed to delete blog post.");
    } else {
      setBlogs((prev) => prev.filter((b) => b.id !== blog.id));
    }
    setOpenMenuId(null);
  }

  const filteredBlogs = blogs.filter((blog) =>
    blog.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Blog Posts</h1>
          <p className="text-sm text-muted-foreground">Manage your blog content</p>
        </div>
        <button
          onClick={() => router.push("/admin/blogs/new")}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
        >
          <Plus size={16} />
          New Post
        </button>
      </div>

      {/* Search */}
      <div className="relative w-full max-w-sm">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <input
          placeholder="Search posts..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 pr-3 py-2 w-full rounded-md border text-sm focus:outline-none"
        />
      </div>

      {/* Table */}
      <div className="rounded-lg border bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-b">
            <tr className="text-left">
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Author</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3 text-right"></th>
            </tr>
          </thead>

          <tbody>
            {filteredBlogs.map((blog) => (
              <tr key={blog.id} className="border-b last:border-none hover:bg-muted/30">
                <td className="px-4 py-3 font-medium">{blog.title}</td>

                <td className="px-4 py-3">{blog.author}</td>

                <td className="px-4 py-3">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      blog.status === "published"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {blog.status === "published" ? "Published" : "Pending"}
                  </span>
                </td>

                <td className="px-4 py-3 text-muted-foreground">
                  {new Date(blog.created_at).toLocaleDateString()}
                </td>

                <td className="px-4 py-3 text-right">
                  <div className="relative inline-block" ref={openMenuId === blog.id ? menuRef : null}>
                    <button
                      onClick={() => setOpenMenuId(openMenuId === blog.id ? null : blog.id)}
                      className="p-1 rounded hover:bg-muted"
                    >
                      <MoreVertical className="w-4 h-4 text-muted-foreground" />
                    </button>

                    {openMenuId === blog.id && (
                      <div className="absolute right-0 z-10 mt-1 w-36 rounded-md border bg-white shadow-lg">
                        <button
                          onClick={() => {
                            setOpenMenuId(null);
                            router.push(`/admin/blogs/${blog.id}/edit`);
                          }}
                          className="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-muted"
                        >
                          <Pencil size={14} /> Edit
                        </button>
                        <button
                          onClick={() => handleDelete(blog)}
                          className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                          <Trash2 size={14} /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}

            {filteredBlogs.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">
                  No blogs found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
