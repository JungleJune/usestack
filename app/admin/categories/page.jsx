"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/admin-supabase";
import { toast } from "@/hooks/use-toast";
export default function Page() {
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [tags, setTags] = useState([]);

  const [open, setOpen] = useState(false);
  const [type, setType] = useState("categories");
  const [value, setValue] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAll();
  }, []);

  async function fetchAll() {
    const [{ data: c }, { data: s }, { data: t }] = await Promise.all([
      supabase.from("categories").select("*").order("created_at"),
      supabase.from("sub_categories").select("*").order("created_at"),
      supabase.from("tags").select("*").order("created_at"),
    ]);

    setCategories(c || []);
    setSubcategories(s || []);
    setTags(t || []);
  }

  function generateSlug(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "") 
    .replace(/\s+/g, "-")           
    .replace(/-+/g, "-");      
}

  function handleTypeChange(newType) {
    setType(newType);
    setSelectedCategoryId("");
  }

  async function handleSubmit() {
    if (!value.trim()) return alert("Enter a value");

    // Validate category selection for subcategories
    if (type === "sub_categories" && !selectedCategoryId) {
      toast({
        title: "Error",
        description: "Please select a parent category for the subcategory",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    let insertData = { name: value.trim()};

    // Add category_id and category_name for subcategories
    if (type === "sub_categories") {
      const selectedCategory = categories.find(
        (cat) => cat.id === parseInt(selectedCategoryId)
      );
      insertData = {
        ...insertData,
        category_id: parseInt(selectedCategoryId),
        category_name: selectedCategory?.name || "",
      };
    }

    const { error } = await supabase.from(type).insert(insertData);

    setLoading(false);

    if (error) {
      toast({
        title: "Error",
        description: error.message || error,
        variant: "destructive",
      });
      return;
    }

    setValue("");
    setSelectedCategoryId("");
    setOpen(false);
    fetchAll();
    toast({
      title: "Success",
      description: `${type} added Successfully`,
      variant: "success",
    });
  }

  return (
    <div className="bg-white w-full min-h-screen text-black p-10">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-semibold">Manage Taxonomy</h1>
        <button
          onClick={() => setOpen(true)}
          className="bg-black text-white px-5 py-2 rounded"
        >
          Add New
        </button>
      </div>

      <Section title="Categories" data={categories} />
      <Section title="Subcategories" data={subcategories} />
      <Section title="Tags" data={tags} />

      {open && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <div className="bg-white w-[400px] p-6 rounded shadow">
            <h2 className="text-xl font-medium mb-4">Add New</h2>

            <select
              value={type}
              onChange={(e) => handleTypeChange(e.target.value)}
              className="w-full border p-2 mb-3"
            >
              <option value="categories">Category</option>
              <option value="sub_categories">Subcategory</option>
              <option value="tags">Tag</option>
            </select>

            {type === "sub_categories" && (
              <select
                value={selectedCategoryId}
                onChange={(e) => setSelectedCategoryId(e.target.value)}
                className="w-full border p-2 mb-3"
                required
              >
                <option value="">Select Parent Category *</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            )}

            <input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Enter value"
              className="w-full border p-2 mb-4"
            />

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setOpen(false)}
                className="px-4 py-2 border"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-4 py-2 bg-black text-white"
              >
                {loading ? "Adding..." : "Submit"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Section({ title, data }) {
  return (
    <div className="mb-8">
      <h2 className="text-2xl font-medium mb-3">{title}</h2>
      <div className="flex flex-wrap gap-3">
        {data.map((item) => (
          <span
            key={item.id}
            className="px-3 py-1 border rounded text-sm"
          >
            {item.name}
            {item.category_name && (
              <span className="text-gray-500 ml-1">({item.category_name})</span>
            )}
          </span>
        ))}
      </div>
    </div>
  );
}
