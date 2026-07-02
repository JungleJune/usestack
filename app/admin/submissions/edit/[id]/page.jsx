"use client";
import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  Save,
  Building2,
  Tag,
  ExternalLink,
  Loader2,
  User,
} from "lucide-react";
import { supabase } from "@/lib/admin-supabase";
import { useToast } from "@/hooks/use-toast";

export default function EditSubmissionPage({ params }) {
  const { id } = use(params);
  const { toast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tags, setTags] = useState([]);
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
    company_id: null,
    selected_tags: [],
    submitter_name: "",
    submitter_email: "",
    submitter_message: "",
    status: "pending",
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchData();
    // The route ID is the only value that should trigger a reload.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchData = async () => {
    try {
      // Fetch submission data
      const { data: submission, error: submissionError } = await supabase
        .from("submissions")
        .select("*")
        .eq("id", id)
        .single();

      if (submissionError) throw submissionError;

      if (!submission) {
        toast({
          title: "Not Found",
          description: "Submission not found.",
          variant: "destructive",
        });
        router.push("/admin/submissions");
        return;
      }

      // Fetch tags
      const { data: tagsData, error: tagsError } = await supabase
        .from("tags")
        .select("id, name, slug")
        .order("name");

      if (tagsError) throw tagsError;
      setTags(tagsData || []);

      // Fetch companies
      const { data: companiesData, error: companiesError } = await supabase
        .from("companies")
        .select("id, name, slug, website_url")
        .order("name");

      if (companiesError) throw companiesError;
      setCompanies(companiesData || []);

      // Map submission tags (text[]) to tag IDs
      let selectedTagIds = [];
      if (submission.tags && Array.isArray(submission.tags) && tagsData) {
        selectedTagIds = tagsData
          .filter((t) => submission.tags.includes(t.name))
          .map((t) => t.id);
      }

      // Set form data
      setFormData({
        name: submission.name || "",
        tagline: submission.tagline || "",
        description: submission.description || "",
        website_url: submission.website_url || "",
        logo_url: submission.logo_url || "",
        is_verified: submission.is_verified || false,
        twitter_url: submission.twitter_url || "",
        linkedin_url: submission.linkedin_url || "",
        team_members: submission.team_members || "",
        tool_thumbnail_url: submission.tool_thumbnail_url || "",
        company_id: submission.company_id || null,
        selected_tags: selectedTagIds,
        submitter_name: submission.submitter_name || "",
        submitter_email: submission.submitter_email || "",
        submitter_message: submission.submitter_message || "",
        status: submission.status || "pending",
      });
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "Failed to load submission data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: null,
      }));
    }
  };

  const handleTagToggle = (tagId) => {
    setFormData((prev) => ({
      ...prev,
      selected_tags: prev.selected_tags.includes(tagId)
        ? prev.selected_tags.filter((id) => id !== tagId)
        : [...prev.selected_tags, tagId],
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) newErrors.name = "Tool name is required";
    if (!formData.tagline.trim()) newErrors.tagline = "Tagline is required";
    if (!formData.description.trim())
      newErrors.description = "Description is required";
    if (!formData.website_url.trim())
      newErrors.website_url = "Website URL is required";

    const urlRegex = /^https?:\/\/.+/;
    if (formData.website_url && !urlRegex.test(formData.website_url)) {
      newErrors.website_url =
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
    if (
      formData.tool_thumbnail_url &&
      !urlRegex.test(formData.tool_thumbnail_url)
    ) {
      newErrors.tool_thumbnail_url =
        "Please enter a valid URL starting with http:// or https://";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors below before saving.",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);

    try {
      // Resolve tag names from IDs
      const selectedTagNames = tags
        .filter((t) => formData.selected_tags.includes(t.id))
        .map((t) => t.name);

      const { error: updateError } = await supabase
        .from("submissions")
        .update({
          name: formData.name.trim(),
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
          submitter_name: formData.submitter_name.trim() || null,
          submitter_email: formData.submitter_email.trim() || null,
          submitter_message: formData.submitter_message.trim() || null,
          status: formData.status,
        })
        .eq("id", id);

      if (updateError) throw updateError;

      toast({
        title: "Success!",
        description: "Submission has been updated successfully.",
      });

      router.push("/admin/submissions");
    } catch (error) {
      console.error("Error updating submission:", error);
      toast({
        title: "Error",
        description:
          error.message || "Failed to update submission. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push("/admin/submissions")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold tracking-tight">Edit Submission</h1>
        </div>
        <Badge
          variant={
            formData.status === "approved"
              ? "success"
              : formData.status === "rejected"
              ? "destructive"
              : "secondary"
          }
        >
          {formData.status}
        </Badge>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Tool Information */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <ExternalLink className="h-5 w-5" />
              Tool Information
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">
                  Tool Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="Enter tool name"
                  className={errors.name ? "border-red-500" : ""}
                />
                {errors.name && (
                  <p className="text-red-500 text-sm">{errors.name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="website_url">
                  Website URL <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="website_url"
                  value={formData.website_url}
                  onChange={(e) =>
                    handleInputChange("website_url", e.target.value)
                  }
                  placeholder="https://example.com"
                  className={errors.website_url ? "border-red-500" : ""}
                />
                {errors.website_url && (
                  <p className="text-red-500 text-sm">{errors.website_url}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tagline">
                Tagline <span className="text-red-500">*</span>
              </Label>
              <Input
                id="tagline"
                value={formData.tagline}
                onChange={(e) => handleInputChange("tagline", e.target.value)}
                placeholder="A short catchy description"
                className={errors.tagline ? "border-red-500" : ""}
              />
              {errors.tagline && (
                <p className="text-red-500 text-sm">{errors.tagline}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">
                Description <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
                placeholder="Detailed description of the tool"
                rows={5}
                className={errors.description ? "border-red-500" : ""}
              />
              {errors.description && (
                <p className="text-red-500 text-sm">{errors.description}</p>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="logo_url">Logo URL</Label>
                <Input
                  id="logo_url"
                  value={formData.logo_url}
                  onChange={(e) => handleInputChange("logo_url", e.target.value)}
                  placeholder="https://example.com/logo.png"
                  className={errors.logo_url ? "border-red-500" : ""}
                />
                {errors.logo_url && (
                  <p className="text-red-500 text-sm">{errors.logo_url}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="tool_thumbnail_url">Thumbnail URL</Label>
                <Input
                  id="tool_thumbnail_url"
                  value={formData.tool_thumbnail_url}
                  onChange={(e) =>
                    handleInputChange("tool_thumbnail_url", e.target.value)
                  }
                  placeholder="https://example.com/thumbnail.png"
                  className={errors.tool_thumbnail_url ? "border-red-500" : ""}
                />
                {errors.tool_thumbnail_url && (
                  <p className="text-red-500 text-sm">
                    {errors.tool_thumbnail_url}
                  </p>
                )}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="twitter_url">Twitter URL</Label>
                <Input
                  id="twitter_url"
                  value={formData.twitter_url}
                  onChange={(e) =>
                    handleInputChange("twitter_url", e.target.value)
                  }
                  placeholder="https://twitter.com/..."
                  className={errors.twitter_url ? "border-red-500" : ""}
                />
                {errors.twitter_url && (
                  <p className="text-red-500 text-sm">{errors.twitter_url}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="linkedin_url">LinkedIn URL</Label>
                <Input
                  id="linkedin_url"
                  value={formData.linkedin_url}
                  onChange={(e) =>
                    handleInputChange("linkedin_url", e.target.value)
                  }
                  placeholder="https://linkedin.com/..."
                  className={errors.linkedin_url ? "border-red-500" : ""}
                />
                {errors.linkedin_url && (
                  <p className="text-red-500 text-sm">{errors.linkedin_url}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="team_members">Team Members</Label>
              <Input
                id="team_members"
                value={formData.team_members}
                onChange={(e) =>
                  handleInputChange("team_members", e.target.value)
                }
                placeholder="Number of team members"
              />
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="is_verified"
                checked={formData.is_verified}
                onCheckedChange={(checked) =>
                  handleInputChange("is_verified", checked)
                }
              />
              <Label htmlFor="is_verified">Mark as Verified</Label>
            </div>
          </CardContent>
        </Card>

        {/* Company Selection */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Building2 className="h-5 w-5" />
              Company
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="company_id">Select Company</Label>
              <select
                id="company_id"
                value={formData.company_id || ""}
                onChange={(e) =>
                  handleInputChange(
                    "company_id",
                    e.target.value ? parseInt(e.target.value) : null
                  )
                }
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="">No Company Selected</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Tags */}
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Tag className="h-5 w-5" />
              Tags
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
              <User className="h-5 w-5" />
              Submitter Information
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="submitter_name">Submitter Name</Label>
                <Input
                  id="submitter_name"
                  value={formData.submitter_name}
                  onChange={(e) =>
                    handleInputChange("submitter_name", e.target.value)
                  }
                  placeholder="Submitter's name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="submitter_email">Submitter Email</Label>
                <Input
                  id="submitter_email"
                  type="email"
                  value={formData.submitter_email}
                  onChange={(e) =>
                    handleInputChange("submitter_email", e.target.value)
                  }
                  placeholder="Submitter's email"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="submitter_message">Submitter Message</Label>
              <Textarea
                id="submitter_message"
                value={formData.submitter_message}
                onChange={(e) =>
                  handleInputChange("submitter_message", e.target.value)
                }
                placeholder="Any message from the submitter"
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/admin/submissions")}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={saving} className="gap-2">
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
