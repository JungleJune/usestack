"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/admin-supabase";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { FolderOpen, Tag, ExternalLink, Save, Upload, X, Loader2 } from "lucide-react";

export default function EditProductForm({ productId }) {
  const { toast } = useToast();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const thumbnailInputRef = useRef(null);
  const logoInputRef = useRef(null);
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [tagsList, setTagsList] = useState([]);
  const [companies, setCompanies] = useState([]);

  const [formData, setFormData] = useState({
    name: "",
    tagline: "",
    description: "",
    website_url: "",
    logo_url: "",
    is_verified: false,
    twitter_url: "",
    linkedin_url: "",
    team_members: "",
    tool_thumbnail_url: "",
    company_name: "",
    company_website: "",
    company_logo: "",
    company_verified: false,
    company_team_size: "",
    company_funding_round: "",
    company_funding_amount: "",
    company_funding_info: "",
    selected_categories: [],
    selected_subcategories: [],
    selected_tags: [],
    company_id: null,
    slug: "",
  });

  useEffect(() => {
    const load = async () => {
      try {
        // Reference data
        const [
          { data: cats },
          { data: subs },
          { data: tags },
          { data: comps },
        ] = await Promise.all([
          supabase.from("categories").select("id,name,slug").order("name"),
          supabase
            .from("sub_categories")
            .select("id,name,category_id")
            .order("name"),
          supabase.from("tags").select("id,name,slug").order("name"),
          supabase
            .from("companies")
            .select("id,name,website_url,verified")
            .order("name"),
        ]);
        setCategories(cats || []);
        setSubCategories(subs || []);
        setTagsList(tags || []);
        setCompanies(comps || []);

        // Product & relations
        const { data: product, error: pErr } = await supabase
          .from("products")
          .select("*")
          .eq("id", productId)
          .single();
        if (pErr) throw pErr;

        const [{ data: catJ }, { data: subJ }] = await Promise.all([
          supabase
            .from("product_category_jnc")
            .select("category_id, sort_order")
            .eq("product_id", productId)
            .order("sort_order"),
          supabase
            .from("product_subcategory_jnc")
            .select("sub_category_id, sort_order")
            .eq("product_id", productId)
            .order("sort_order"),
        ]);

        setFormData((prev) => ({
          ...prev,
          name: product.name || "",
          tagline: product.tagline || "",
          description: product.description || "",
          website_url: product.website_url || "",
          logo_url: product.logo_url || "",
          is_verified: !!product.is_verified,
          twitter_url: product.twitter_url || "",
          linkedin_url: product.linkedin_url || "",
          team_members: product.team_members || "",
          tool_thumbnail_url: product.tool_thumbnail_url || "",
          selected_categories: (catJ || []).map((r) => r.category_id),
          selected_subcategories: (subJ || []).map((r) => r.sub_category_id),
          selected_tags: Array.isArray(product.tags)
            ? (tags || [])
                .filter((t) => (product.tags || []).includes(t.name))
                .map((t) => t.id)
            : [],
          company_id: product.company_id || null,
          slug: product.slug || "",
        }));
      } catch (e) {
        console.error(e);
        toast({
          title: "Error",
          description: "Failed to load product",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  const handleInputChange = (field, value) => {
    setFormData((p) => ({ ...p, [field]: value }));
  };

  const handleImageUpload = async (file, field) => {
    const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a JPEG, PNG, GIF, or WebP image.",
        variant: "destructive",
      });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 5MB.",
        variant: "destructive",
      });
      return;
    }

    const setUploading =
      field === "tool_thumbnail_url" ? setUploadingThumbnail : setUploadingLogo;
    const inputRef =
      field === "tool_thumbnail_url" ? thumbnailInputRef : logoInputRef;
    setUploading(true);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `tool-images/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

      const { error } = await supabase.storage
        .from("product-images")
        .upload(fileName, file, { cacheControl: "3600", upsert: false });
      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from("product-images")
        .getPublicUrl(fileName);

      setFormData((prev) => ({ ...prev, [field]: urlData.publicUrl }));
      toast({ title: "Success", description: "Image uploaded successfully!" });
    } catch (err) {
      console.error("Upload error:", err);
      toast({
        title: "Upload failed",
        description: err.message || "Failed to upload image.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const generateSlug = (name) =>
    name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim("-");

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const selectedTagNames = tagsList
        .filter((t) => formData.selected_tags.includes(t.id))
        .map((t) => t.name);

      const { error: upErr } = await supabase
        .from("products")
        .update({
          name: formData.name.trim(),
          slug: formData.slug || generateSlug(formData.name),
          tagline: formData.tagline.trim(),
          description: formData.description.trim(),
          website_url: formData.website_url.trim(),
          logo_url: formData.logo_url.trim() || null,
          is_verified: !!formData.is_verified,
          twitter_url: formData.twitter_url.trim() || null,
          linkedin_url: formData.linkedin_url.trim() || null,
          team_members: formData.team_members
            ? String(formData.team_members)
            : null,
          tool_thumbnail_url: formData.tool_thumbnail_url.trim() || null,
          company_id: formData.company_id || null,
          tags: selectedTagNames.length > 0 ? selectedTagNames : null,
        })
        .eq("id", productId);
      if (upErr) throw upErr;

      // Replace junctions
      await supabase
        .from("product_category_jnc")
        .delete()
        .eq("product_id", productId);
      await supabase
        .from("product_subcategory_jnc")
        .delete()
        .eq("product_id", productId);

      if (formData.selected_categories.length > 0) {
        const catRows = formData.selected_categories.map(
          (categoryId, index) => ({
            product_id: productId,
            category_id: categoryId,
            sort_order: index,
          })
        );
        const { error: cErr } = await supabase
          .from("product_category_jnc")
          .insert(catRows);
        if (cErr) throw cErr;
      }

      if (formData.selected_subcategories.length > 0) {
        const subRows = formData.selected_subcategories.map((subId, index) => {
          const sc = subCategories.find((s) => s.id === subId);
          return {
            product_id: productId,
            product_name: formData.name.trim(),
            sub_category_id: subId,
            sub_category_name: sc?.name || null,
            sort_order: index,
          };
        });
        const { error: sErr } = await supabase
          .from("product_subcategory_jnc")
          .insert(subRows);
        if (sErr) throw sErr;
      }

      toast({ title: "Saved", description: "Product updated successfully." });
      router.push("/admin/tools");
    } catch (err) {
      console.error(err);
      toast({
        title: "Error",
        description: err.message || "Update failed",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <form onSubmit={onSubmit} className="space-y-6 max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ExternalLink className="h-5 w-5" /> Edit Product
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Product Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="tagline">Tagline *</Label>
              <Input
                id="tagline"
                value={formData.tagline}
                onChange={(e) => handleInputChange("tagline", e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              rows={4}
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="website_url">Website URL *</Label>
              <Input
                id="website_url"
                value={formData.website_url}
                onChange={(e) =>
                  handleInputChange("website_url", e.target.value)
                }
              />
            </div>
            <div>
              <Label>Tool Thumbnail</Label>
              {formData.tool_thumbnail_url && (
                <div className="relative w-20 h-20 mt-1 mb-2">
                  <img
                    src={formData.tool_thumbnail_url}
                    alt="Thumbnail preview"
                    className="w-20 h-20 object-cover rounded border"
                  />
                  <button
                    type="button"
                    onClick={() => handleInputChange("tool_thumbnail_url", "")}
                    className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
              <div className="flex gap-2">
                <Input
                  id="tool_thumbnail_url"
                  placeholder="Paste URL or upload"
                  value={formData.tool_thumbnail_url}
                  onChange={(e) =>
                    handleInputChange("tool_thumbnail_url", e.target.value)
                  }
                  className="flex-1"
                />
                <input
                  ref={thumbnailInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageUpload(file, "tool_thumbnail_url");
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={uploadingThumbnail}
                  onClick={() => thumbnailInputRef.current?.click()}
                >
                  {uploadingThumbnail ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>

          <div>
            <Label>Logo</Label>
            {formData.logo_url && (
              <div className="relative w-20 h-20 mt-1 mb-2 inline-block">
                <img
                  src={formData.logo_url}
                  alt="Logo preview"
                  className="w-20 h-20 object-cover rounded border"
                />
                <button
                  type="button"
                  onClick={() => handleInputChange("logo_url", "")}
                  className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
            <div className="flex gap-2">
              <Input
                id="logo_url"
                placeholder="Paste URL or upload"
                value={formData.logo_url}
                onChange={(e) => handleInputChange("logo_url", e.target.value)}
                className="flex-1"
              />
              <input
                ref={logoInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageUpload(file, "logo_url");
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={uploadingLogo}
                onClick={() => logoInputRef.current?.click()}
              >
                {uploadingLogo ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="twitter_url">Twitter URL</Label>
              <Input
                id="twitter_url"
                value={formData.twitter_url}
                onChange={(e) =>
                  handleInputChange("twitter_url", e.target.value)
                }
              />
            </div>
            <div>
              <Label htmlFor="linkedin_url">LinkedIn URL</Label>
              <Input
                id="linkedin_url"
                value={formData.linkedin_url}
                onChange={(e) =>
                  handleInputChange("linkedin_url", e.target.value)
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="team_members">Team Members</Label>
              <Input
                id="team_members"
                value={formData.team_members}
                onChange={(e) =>
                  handleInputChange("team_members", e.target.value)
                }
              />
            </div>
            <div className="flex items-center gap-2 mt-6 md:mt-0">
              <Checkbox
                id="is_verified"
                checked={formData.is_verified}
                onCheckedChange={(c) => handleInputChange("is_verified", c)}
              />
              <Label htmlFor="is_verified">Verified Tool</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Categories */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5" /> Categories
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {categories.map((category) => (
              <div key={category.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`category-${category.id}`}
                  checked={formData.selected_categories.includes(category.id)}
                  onCheckedChange={() => {
                    setFormData((p) => ({
                      ...p,
                      selected_categories: p.selected_categories.includes(
                        category.id
                      )
                        ? p.selected_categories.filter(
                            (id) => id !== category.id
                          )
                        : [...p.selected_categories, category.id],
                    }));
                  }}
                />
                <Label htmlFor={`category-${category.id}`} className="text-sm">
                  {category.name}
                </Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Subcategories */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5" /> Sub-Categories
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {subCategories.map((sc) => (
              <div key={sc.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`subcat-${sc.id}`}
                  checked={formData.selected_subcategories.includes(sc.id)}
                  onCheckedChange={() => {
                    setFormData((p) => ({
                      ...p,
                      selected_subcategories: p.selected_subcategories.includes(
                        sc.id
                      )
                        ? p.selected_subcategories.filter((id) => id !== sc.id)
                        : [...p.selected_subcategories, sc.id],
                    }));
                  }}
                />
                <Label htmlFor={`subcat-${sc.id}`} className="text-sm">
                  {sc.name}
                </Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tags */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" /> Tags
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {tagsList.map((tag) => (
              <div key={tag.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`tag-${tag.id}`}
                  checked={formData.selected_tags.includes(tag.id)}
                  onCheckedChange={() => {
                    setFormData((p) => ({
                      ...p,
                      selected_tags: p.selected_tags.includes(tag.id)
                        ? p.selected_tags.filter((id) => id !== tag.id)
                        : [...p.selected_tags, tag.id],
                    }));
                  }}
                />
                <Label htmlFor={`tag-${tag.id}`} className="text-sm">
                  {tag.name}
                </Label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={saving} className="min-w-[120px]">
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" /> Save Changes
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
