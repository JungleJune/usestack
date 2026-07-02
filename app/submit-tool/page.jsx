"use client";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
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
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Plus,
  X,
  Save,
  Building2,
  Tag,
  FolderOpen,
  ExternalLink,
  AlertCircle,
  CheckCircle,
  Loader2
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import Fuse from "fuse.js";
import Header from "@/components/header";
export default function SubmitToolPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [scrapping, setScrapping] = useState(false);
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [tags, setTags] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [toolUrl, setToolUrl] = useState('');
  const [formData, setFormData] = useState({
    // Product fields
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

    // Company fields
    company_name: "",
    company_website: "",
    company_logo: "",
    company_verified: false,
    company_team_size: "",
    company_funding_round: "",
    company_funding_amount: "",
    company_funding_info: "",

    // Relationships
    selected_categories: [],
    selected_subcategories: [],
    selected_tags: [],
    company_id: null,

    // Submitter fields
    submitter_name: "",
    submitter_email: "",
    submitter_message: "",
  });

  const [errors, setErrors] = useState({});
  const [isCompanyNew, setIsCompanyNew] = useState(true);
  const [companySuggestions, setCompanySuggestions] = useState([]);
  const [submittedTool, setSubmittedTool] = useState(false);


  // Fuzzy Match to validate the Company
  const fuse = useMemo(() => {
    return new Fuse(companies, {
      keys: [
        { name: "name", weight: 0.6 },
        { name: "productName", weight: 0.5 },
        { name: "url", weight: 0.4 },
      ],
      threshold: 0.3,
    });
  }, [companies]);


  useEffect(() => {
    const value = formData.company_name;

    if (!value || value.trim().length === 0) {
      setCompanySuggestions([]);
      return;
    }

    const results = fuse.search(value).map((r) => r.item);
    setCompanySuggestions(results.slice(0, 5));
  }, [formData.company_name, fuse]);

  useEffect(() => {
    fetchInitialData();
    // This initial lookup is intentionally performed once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchInitialData = async () => {
    try {
      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from("categories")
        .select("id, name, slug")
        .order("name");

      if (categoriesError) throw categoriesError;
      setCategories(categoriesData || []);

      // Fetch tags
      const { data: tagsData, error: tagsError } = await supabase
        .from("tags")
        .select("id, name, slug")
        .order("name");

      if (tagsError) throw tagsError;
      setTags(tagsData || []);

      // Fetch sub-categories - simplified approach
      const { data: subCatsData, error: subCatsError } = await supabase
        .from("sub_categories")
        .select("id, name, category_id")
        .order("name");

      if (subCatsError) {
        setSubCategories([]);
      } else {
        setSubCategories(subCatsData || []);
      }

      // Fetch companies
      const { data: companiesData, error: companiesError } = await supabase
        .from("companies")
        .select("id, name, slug, website_url, verified")
        .order("name");

      if (companiesError) throw companiesError;
      setCompanies(companiesData || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load form data. Please refresh the page.",
        variant: "destructive",
      });
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: null,
      }));
    }
  };

  const handleCompanySelect = (companyId) => {
    if (companyId === "new") {
      setIsCompanyNew(true);
      setFormData((prev) => ({
        ...prev,
        company_id: null,
        company_name: "",
        company_website: "",
        company_logo: "",
        company_verified: false,
        company_team_size: "",
        company_funding_round: "",
        company_funding_amount: "",
        company_funding_info: "",
      }));
    } else {
      setIsCompanyNew(false);
      const company = companies.find((c) => c.id === parseInt(companyId));
      setFormData((prev) => ({
        ...prev,
        company_id: parseInt(companyId),
        company_name: company?.name || "",
        company_website: company?.website_url || "",
        company_logo: "",
        company_verified: company?.verified || false,
        company_team_size: "",
        company_funding_round: "",
        company_funding_amount: "",
        company_funding_info: "",
      }));
    }
  };

  const handleCategoryToggle = (categoryId) => {
    setFormData((prev) => ({
      ...prev,
      selected_categories: prev.selected_categories.includes(categoryId)
        ? prev.selected_categories.filter((id) => id !== categoryId)
        : [...prev.selected_categories, categoryId],
    }));
  };

  const handleTagToggle = (tagId) => {
    setFormData((prev) => ({
      ...prev,
      selected_tags: prev.selected_tags.includes(tagId)
        ? prev.selected_tags.filter((id) => id !== tagId)
        : [...prev.selected_tags, tagId],
    }));
  };

  const handleSubcategoryToggle = (subCategoryId) => {
    setFormData((prev) => ({
      ...prev,
      selected_subcategories: prev.selected_subcategories.includes(
        subCategoryId
      )
        ? prev.selected_subcategories.filter((id) => id !== subCategoryId)
        : [...prev.selected_subcategories, subCategoryId],
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    // Required product fields
    if (!formData.name.trim()) newErrors.name = "Product name is required";
    if (!formData.tagline.trim()) newErrors.tagline = "Tagline is required";
    if (!formData.description.trim())
      newErrors.description = "Description is required";
    if (!formData.website_url.trim())
      newErrors.website_url = "Website URL is required";

    // Company validation
    if (!formData.company_name.trim())
      newErrors.company_name = "Company name is required";
    if (!formData.company_website.trim())
      newErrors.company_website = "Company website is required";

    // Categories validation
    if (formData.selected_categories.length === 0) {
      newErrors.selected_categories = "At least one category is required";
    }

    // URL validation
    const urlRegex = /^https?:\/\/.+/;
    if (formData.website_url && !urlRegex.test(formData.website_url)) {
      newErrors.website_url =
        "Please enter a valid URL starting with http:// or https://";
    }
    if (formData.company_website && !urlRegex.test(formData.company_website)) {
      newErrors.company_website =
        "Please enter a valid URL starting with http:// or https://";
    }
    if (
      formData.tool_thumbnail_url &&
      !urlRegex.test(formData.tool_thumbnail_url)
    ) {
      newErrors.tool_thumbnail_url =
        "Please enter a valid URL starting with http:// or https://";
    }
    if (formData.logo_url && !urlRegex.test(formData.logo_url)) {
      newErrors.logo_url =
        "Please enter a valid URL starting with http:// or https://";
    }
    if (formData.twitter_url && !urlRegex.test(formData.twitter_url)) {
      newErrors.twitter_url =
        "Please enter a valid URL starting with http:// or https://";
    }
    if (formData.linkedin_url && !urlRegex.test(formData.linkedin_url)) {
      newErrors.linkedin_url =
        "Please enter a valid URL starting with http:// or https://";
    }
    if (formData.company_logo && !urlRegex.test(formData.company_logo)) {
      newErrors.company_logo =
        "Please enter a valid URL starting with http:// or https://";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const generateSlug = (name) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim("-");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors below before submitting.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Check if a tool with the same URL already exists in submissions or products
      const websiteUrl = formData.website_url.trim();

      const [{ data: existingSubmission }, { data: existingProduct }] = await Promise.all([
        supabase
          .from("submissions")
          .select("id")
          .eq("website_url", websiteUrl)
          .maybeSingle(),
        supabase
          .from("products")
          .select("id")
          .eq("website_url", websiteUrl)
          .maybeSingle()
      ]);

      if (existingSubmission || existingProduct) {
        toast({
          title: "Tool Already Exists",
          description: "A tool with this URL has already been submitted.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      let companyId = formData.company_id;

      // Create or update company
      if (isCompanyNew || !companyId) {
        const companySlug = generateSlug(formData.company_name);

        const { data: companyData, error: companyError } = await supabase
          .from("companies")
          .insert({
            name: formData.company_name.trim(),
            slug: companySlug,
            website_url: formData.company_website.trim(),
            logo_url: formData.company_logo.trim() || null,
            verified: formData.company_verified,
            team_size: formData.company_team_size.trim() || null,
            funding_round: formData.company_funding_round.trim() || null,
            funding_amount: formData.company_funding_amount.trim() || null,
            funding_info: formData.company_funding_info.trim() || null,
          })
          .select()
          .single();

        if (companyError) throw companyError;
        companyId = companyData.id;
      }

      // Create product
      const productSlug = generateSlug(formData.name);

      // Resolve tag names to store directly on products.tags (text[])
      const selectedTagNames = tags
        .filter((t) => formData.selected_tags.includes(t.id))
        .map((t) => t.name);

      const { data: productData, error: productError } = await supabase
        .from("submissions")
        .insert({
          name: formData.name.trim(),
          slug: productSlug,
          tagline: formData.tagline.trim(),
          description: formData.description.trim(),
          website_url: formData.website_url.trim(),
          logo_url: formData.logo_url.trim() || null,
          company_id: companyId,
          is_verified: !!formData.is_verified,
          twitter_url: formData.twitter_url.trim() || null,
          linkedin_url: formData.linkedin_url.trim() || null,
          team_members: formData.team_members
            ? String(formData.team_members)
            : null,
          tool_thumbnail_url: formData.tool_thumbnail_url.trim() || null,
          tags: selectedTagNames.length > 0 ? selectedTagNames : null,
          submitter_name: formData.submitter_name.trim() || null,
          submitter_email: formData.submitter_email.trim() || null,
          submitter_message: formData.submitter_message.trim() || null,
        })
        .select()
        .single();

      if (productError) throw productError;

      // Create category junctions (with sort_order)
      if (formData.selected_categories.length > 0) {
        const categoryJunctions = formData.selected_categories.map(
          (categoryId, index) => ({
            product_id: productData.id,
            category_id: categoryId,
            sort_order: index,
          })
        );

        const { error: categoryError } = await supabase
          .from("product_category_jnc")
          .insert(categoryJunctions);

        if (categoryError) throw categoryError;
      }

      // Create sub-category junctions (with names and sort_order)
      if (formData.selected_subcategories.length > 0) {
        const subCatInserts = formData.selected_subcategories.map(
          (subId, index) => {
            const sc = subCategories.find((s) => s.id === subId);
            return {
              product_id: productData.id,
              product_name: formData.name.trim(),
              sub_category_id: subId,
              sub_category_name: sc?.name || null,
              sort_order: index,
            };
          }
        );

        const { error: subCatError } = await supabase
          .from("product_subcategory_jnc")
          .insert(subCatInserts);

        if (subCatError) throw subCatError;
      }

      toast({
        title: "Success!",
        description: "Product has been created successfully.",
      });

      // Show success message
      setSubmittedTool(true);
    } catch (error) {
      toast({
        title: "Error",
        description:
          error.message || "Failed to create product. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle the Submit Of Tool Url
  const handleAddToolAutomatically = async (e) => {
    e.preventDefault();
    if (!toolUrl) {
      toast({
        title: "Error",
        description: "Tool URL is Required",
        variant: "destructive",
      });
      return;
    }
    setScrapping(true);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      let data;
      try {
        const response = await fetch(`/api/scrape`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: toolUrl }),
          signal: controller.signal,
        });

        data = await response.json();
      } finally {
        clearTimeout(timeoutId);
      }
      if (!data || data.error) {
        toast({
          title: "Error",
          description: "Failed to Load Tool Data, Please Try again",
          variant: "destructive",
        });
        setScrapping(false);
        return;
      }
      const tool = data;
     
      setFormData({
        ...formData,
        name: tool.name ?? "Hello",
        tagline: tool.tagline ?? "",
        description: tool.description ?? "",
        website_url: tool.website_url ?? "",
        logo_url: tool.logo_url ?? "",
        is_verified: tool.is_verified ?? false,
        twitter_url: tool.twitter_url ?? "",
        linkedin_url: tool.linkedin_url ?? "",
        team_members: tool.team_members ?? "",
        tool_thumbnail_url: tool.tool_thumbnail_url ?? "",
        company_name: tool.company_name ?? "",
        company_website: tool.company_website ?? "",
        company_logo: tool.company_logo ?? "",
        company_verified: tool.company_verified ?? false,
        company_team_size: tool.company_team_size ?? "",
        company_funding_round: tool.company_funding_round ?? "",
        company_funding_amount: tool.company_funding_amount ?? "",
        company_funding_info: tool.company_funding_info ?? "",
        company_id: tool.company_id ?? null,
      });
       if (Array.isArray(tool.categories)) {
        for (const category of tool.categories) {
          handleCategoryToggle(parseInt(category.id));
        }
      }
      if (Array.isArray(tool.subCategories)) {
        for (const subCategory of tool.subCategories) {
          handleSubcategoryToggle(parseInt(subCategory.id));
        }
      }
      if (Array.isArray(tool.tags)) {
        for (const tag of tool.tags) {
          handleTagToggle(parseInt(tag.id));
        }
      }
      toast({
        title: "Success!",
        description: "Tool Data Fetched Successfully.",
        duration: 3000,
        variant: "success",
      });
    }
    catch (err) {
      toast({
        title: "Error",
        description: "Failed to Load Tool Data, Please Try again",
        variant: "destructive",
        duration: 5000,
      });
    }
    finally {
      setScrapping(false);
    }
  }
  return (
    <>
      <Header />
      <div className="max-w-4xl mx-auto space-y-10 pb-10">
        {submittedTool ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-6">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-center">Thank You for Your Submission!</h2>
            <p className="text-center text-muted-foreground max-w-md">
              We have received your tool information. Our team will review it and get back to you soon.
            </p>
            <Button onClick={() => setSubmittedTool(false)} variant="outline">
              Submit Another Tool
            </Button>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center gap-3">
              <Plus className="h-7 w-7 text-primary" />
              <h1 className="text-3xl font-bold tracking-tight">Add New AI Tool</h1>
            </div>      {/* Auto Fetch Section */}
            <div className="space-y-3 p-5 border rounded-xl shadow-sm bg-white">
              <span className="text-lg font-semibold">Add Tool Automatically</span>

              <form className="flex flex-row items-center gap-3" onSubmit={(e) => handleAddToolAutomatically(e)}>
                <Input
                  id="autofetch-url"
                  placeholder="Enter Tool Website URL…"
                  className="flex-1"
                  disabled={scrapping}
                  value={toolUrl}
                  onChange={(e) => setToolUrl(e.target.value)}
                />
                <Button type="submit" className="px-5" disabled={scrapping}> {scrapping ? <><Loader2 className="animate-spin" /> Fetching </> : "Fetch Tool"}</Button>
              </form>
            </div>

            {/* Separator */}
            <div className="flex items-center justify-center gap-3">
              <div className="flex-1 border-t" />
              <span className="text-gray-500 text-sm">or</span>
              <div className="flex-1 border-t" />
            </div>

            {/* MAIN FORM */}
            <form onSubmit={handleSubmit} className="space-y-10">
              <fieldset disabled={scrapping} className="space-y-6 opacity-100">
                {/* Product Information */}
                <Card className="shadow-md">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <ExternalLink className="h-5 w-5" />
                      Product Information
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="space-y-6">

                    {/* Product Name + Tagline */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="name">Product Name *</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => handleInputChange("name", e.target.value)}
                          placeholder="e.g., ChatGPT, Midjourney"
                        />
                      </div>

                      <div>
                        <Label htmlFor="tagline">Tagline *</Label>
                        <Input
                          id="tagline"
                          value={formData.tagline}
                          onChange={(e) => handleInputChange("tagline", e.target.value)}
                          placeholder="Short description of the tool"
                        />
                      </div>
                    </div>

                    {/* Description */}
                    <div>
                      <Label htmlFor="description">Description *</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => handleInputChange("description", e.target.value)}
                        placeholder="Detailed description of what the tool does…"
                        rows={5}
                      />
                    </div>

                    {/* URLs */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="website_url">Website URL *</Label>
                        <Input
                          id="website_url"
                          value={formData.website_url}
                          onChange={(e) => handleInputChange("website_url", e.target.value)}
                          placeholder="https://example.com"
                        />
                      </div>

                      <div>
                        <Label htmlFor="tool_thumbnail_url">Thumbnail URL</Label>
                        <Input
                          id="tool_thumbnail_url"
                          value={formData.tool_thumbnail_url}
                          onChange={(e) =>
                            handleInputChange("tool_thumbnail_url", e.target.value)
                          }
                          placeholder="https://example.com/logo.png"
                        />
                      </div>
                    </div>

                    {/* Social Links */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="twitter_url">Twitter URL</Label>
                        <Input
                          id="twitter_url"
                          value={formData.twitter_url}
                          onChange={(e) => handleInputChange("twitter_url", e.target.value)}
                          placeholder="https://twitter.com/yourtool"
                        />
                      </div>

                      <div>
                        <Label htmlFor="linkedin_url">LinkedIn URL</Label>
                        <Input
                          id="linkedin_url"
                          value={formData.linkedin_url}
                          onChange={(e) => handleInputChange("linkedin_url", e.target.value)}
                          placeholder="https://linkedin.com/company/yourtool"
                        />
                      </div>
                    </div>

                    {/* Team + Verified */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="team_members">Team Members</Label>
                        <Input
                          id="team_members"
                          value={formData.team_members}
                          onChange={(e) =>
                            handleInputChange("team_members", e.target.value)
                          }
                          placeholder="e.g., John, Jane"
                        />
                      </div>
                    </div>

                  </CardContent>
                </Card>

                {/* Company Information */}
                <Card className="shadow-md">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <Building2 className="h-5 w-5" />
                      Company Information
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="space-y-6">
                    <div>
                      <Label>Select Company</Label>
                      <Select onValueChange={handleCompanySelect}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose company or create new…" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="new">+ Create New Company</SelectItem>
                          {companies.map((company) => (
                            <SelectItem key={company.id} value={company.id.toString()}>
                              {company.name}
                              {company.verified && (
                                <CheckCircle className="inline h-3 w-3 text-green-500 ml-1" />
                              )}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {isCompanyNew && (
                      <div className="space-y-6 border p-5 rounded-lg bg-muted/30">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <Label>Company Name *</Label>
                            <div className="relative">
                              <Input
                                value={formData.company_name}
                                onChange={(e) => {
                                  const value = e.target.value;

                                  handleInputChange("company_name", value);

                                  if (!value.trim()) {
                                    setCompanySuggestions([]);
                                    return;
                                  }

                                  const results = fuse.search(value).map((r) => r.item);
                                  setCompanySuggestions(results.slice(0, 5));
                                }}
                                placeholder="e.g., OpenAI, ChatGPT, openai.com"
                              />

                              {companySuggestions.length > 0 && (
                                <div className="absolute z-20 mt-1 w-full bg-white border rounded shadow">
                                  {companySuggestions.map((c) => (

                                    <div
                                      key={c.id}
                                      className="p-2 cursor-pointer hover:bg-gray-100"
                                      onClick={() => {
                                        handleInputChange("company_name", c.name);
                                        setCompanySuggestions([]);
                                      }}
                                    >
                                      <div className="text-sm">{c.name}
                                        {c.verified && (
                                          <span className="text-green-600 text-xs ml-2"> Verified</span>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                          </div>

                          <div>
                            <Label>Company Website *</Label>
                            <Input
                              value={formData.company_website}
                              onChange={(e) =>
                                handleInputChange("company_website", e.target.value)
                              }
                              placeholder="https://company.com"
                            />
                          </div>
                        </div>

                        <div>
                          <Label>Company Logo URL</Label>
                          <Input
                            value={formData.company_logo}
                            onChange={(e) =>
                              handleInputChange("company_logo", e.target.value)
                            }
                            placeholder="https://company.com/logo.png"
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <Label>Team Size</Label>
                            <Input
                              value={formData.company_team_size}
                              onChange={(e) =>
                                handleInputChange("company_team_size", e.target.value)
                              }
                              placeholder="1–10, 11–50, etc."
                            />
                          </div>

                          <div>
                            <Label>Funding Round</Label>
                            <Input
                              value={formData.company_funding_round}
                              onChange={(e) =>
                                handleInputChange("company_funding_round", e.target.value)
                              }
                              placeholder="Series A, Seed"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <Label>Funding Amount</Label>
                            <Input
                              value={formData.company_funding_amount}
                              onChange={(e) =>
                                handleInputChange("company_funding_amount", e.target.value)
                              }
                              placeholder="$10M"
                            />
                          </div>

                          <div>
                            <Label>Funding Info</Label>
                            <Input
                              value={formData.company_funding_info}
                              onChange={(e) =>
                                handleInputChange("company_funding_info", e.target.value)
                              }
                              placeholder="Optional details or link"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Categories */}
                <Card className="shadow-md">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <FolderOpen className="h-5 w-5" />
                      Categories *
                    </CardTitle>
                  </CardHeader>

                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {categories.map((category) => (
                        <div key={category.id} className="flex items-center gap-2">
                          <Checkbox
                            id={`category-${category.id}`}
                            checked={formData.selected_categories.includes(category.id)}
                            onCheckedChange={() => handleCategoryToggle(category.id)}
                          />
                          <Label htmlFor={`category-${category.id}`} className="text-sm">
                            {category.name}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Sub-Categories */}
                <Card className="shadow-md">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <FolderOpen className="h-5 w-5" />
                      Sub-Categories (Optional)
                    </CardTitle>
                  </CardHeader>

                  <CardContent>
                    {subCategories.length > 0 ? (
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                        {subCategories.map((sc) => (
                          <div key={sc.id} className="flex items-center gap-2">
                            <Checkbox
                              id={`subcat-${sc.id}`}
                              checked={formData.selected_subcategories.includes(sc.id)}
                              onCheckedChange={() => handleSubcategoryToggle(sc.id)}
                            />
                            <Label htmlFor={`subcat-${sc.id}`} className="text-sm">
                              {sc.name}
                            </Label>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-muted-foreground py-4">
                        No sub-categories available
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* Tags */}
                <Card className="shadow-md">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl">
                      <Tag className="h-5 w-5" />
                      Tags (Optional)
                    </CardTitle>
                  </CardHeader>

                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {tags.map((tag) => (
                        <div key={tag.id} className="flex items-center gap-2">
                          <Checkbox
                            id={`tag-${tag.id}`}
                            checked={formData.selected_tags.includes(tag.id)}
                            onCheckedChange={() => handleTagToggle(tag.id)}
                          />
                          <Label htmlFor={`tag-${tag.id}`} className="text-sm">
                            {tag.name}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Submitter Information */}
                <Card className="shadow-md">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl">
                      Submitter Information
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="submitter_name">Your Name</Label>
                        <Input
                          id="submitter_name"
                          value={formData.submitter_name}
                          onChange={(e) =>
                            handleInputChange("submitter_name", e.target.value)
                          }
                          placeholder="Enter your name"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="submitter_email">Your Email</Label>
                        <Input
                          id="submitter_email"
                          type="email"
                          value={formData.submitter_email}
                          onChange={(e) =>
                            handleInputChange("submitter_email", e.target.value)
                          }
                          placeholder="Enter your email"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="submitter_message">Message (Optional)</Label>
                      <Textarea
                        id="submitter_message"
                        value={formData.submitter_message}
                        onChange={(e) =>
                          handleInputChange("submitter_message", e.target.value)
                        }
                        placeholder="Any additional information you'd like to share..."
                        rows={4}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Submit Button */}
                <div className="flex justify-end">
                  <Button type="submit" disabled={loading} className="px-6 py-2 text-md">
                    {loading ? "Creating..." : "Create Product"}
                  </Button>
                </div>
              </fieldset>
            </form>
          </>
        )}
      </div>
    </>
  );
}
