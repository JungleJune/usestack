"use client";
import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  ExternalLink,
  Building2,
  Tag,
  User,
  Loader2,
  Edit,
  Globe,
  Twitter,
  Linkedin,
  Users,
  Image,
  Mail,
  MessageSquare,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { supabase } from "@/lib/admin-supabase";
import { useToast } from "@/hooks/use-toast";

export default function ViewSubmissionPage({ params }) {
  const { id } = use(params);
  const { toast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submission, setSubmission] = useState(null);
  const [company, setCompany] = useState(null);

  useEffect(() => {
    fetchSubmission();
    // The route ID is the only value that should trigger a reload.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchSubmission = async () => {
    try {
      const { data, error } = await supabase
        .from("submissions")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      if (!data) {
        toast({
          title: "Not Found",
          description: "Submission not found.",
          variant: "destructive",
        });
        router.push("/admin/submissions");
        return;
      }

      setSubmission(data);

      // Fetch company if company_id exists
      if (data.company_id) {
        const { data: companyData } = await supabase
          .from("companies")
          .select("id, name, website_url")
          .eq("id", data.company_id)
          .single();

        setCompany(companyData);
      }
    } catch (error) {
      console.error("Error fetching submission:", error);
      toast({
        title: "Error",
        description: "Failed to load submission data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Submission not found.</p>
      </div>
    );
  }

  const InfoRow = ({ icon: Icon, label, value, isLink = false }) => (
    <div className="flex items-start gap-3 py-2">
      <Icon className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-muted-foreground">{label}</p>
        {isLink && value ? (
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline break-all"
          >
            {value}
          </a>
        ) : (
          <p className="font-medium break-words">{value || "—"}</p>
        )}
      </div>
    </div>
  );

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
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {submission.name}
            </h1>
            <p className="text-muted-foreground">{submission.tagline}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant={
              submission.status === "approved"
                ? "success"
                : submission.status === "rejected"
                ? "destructive"
                : "secondary"
            }
            className="capitalize"
          >
            {submission.status}
          </Badge>
          <Button
            variant="outline"
            onClick={() => router.push(`/admin/submissions/edit/${id}`)}
            className="gap-2"
          >
            <Edit className="h-4 w-4" />
            Edit
          </Button>
        </div>
      </div>

      {/* Tool Information */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <ExternalLink className="h-5 w-5" />
            Tool Information
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-2">
          <InfoRow icon={Globe} label="Website URL" value={submission.website_url} isLink />
          
          <div className="py-2">
            <p className="text-sm text-muted-foreground mb-1">Description</p>
            <p className="font-medium whitespace-pre-wrap">
              {submission.description || "—"}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <InfoRow icon={Image} label="Logo URL" value={submission.logo_url} isLink />
            <InfoRow icon={Image} label="Thumbnail URL" value={submission.tool_thumbnail_url} isLink />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <InfoRow icon={Twitter} label="Twitter URL" value={submission.twitter_url} isLink />
            <InfoRow icon={Linkedin} label="LinkedIn URL" value={submission.linkedin_url} isLink />
          </div>

          <InfoRow icon={Users} label="Team Members" value={submission.team_members} />

          <div className="flex items-center gap-2 py-2">
            {submission.is_verified ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <XCircle className="h-5 w-5 text-muted-foreground" />
            )}
            <span className="font-medium">
              {submission.is_verified ? "Verified" : "Not Verified"}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Company Information */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Building2 className="h-5 w-5" />
            Company
          </CardTitle>
        </CardHeader>

        <CardContent>
          {company ? (
            <div className="space-y-2">
              <InfoRow icon={Building2} label="Company Name" value={company.name} />
              <InfoRow icon={Globe} label="Company Website" value={company.website_url} isLink />
            </div>
          ) : (
            <p className="text-muted-foreground">No company associated</p>
          )}
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
          {submission.tags && submission.tags.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {submission.tags.map((tag, index) => (
                <Badge key={index} variant="outline">
                  {tag}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No tags assigned</p>
          )}
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

        <CardContent className="space-y-2">
          <InfoRow icon={User} label="Name" value={submission.submitter_name} />
          <InfoRow icon={Mail} label="Email" value={submission.submitter_email} />
          
          <div className="py-2">
            <div className="flex items-start gap-3">
              <MessageSquare className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Message</p>
                <p className="font-medium whitespace-pre-wrap">
                  {submission.submitter_message || "—"}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Metadata */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-xl">Submission Details</CardTitle>
        </CardHeader>

        <CardContent>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Submitted On</p>
              <p className="font-medium">
                {submission.created_at
                  ? new Date(submission.created_at).toLocaleString("en-US", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })
                  : "—"}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Last Updated</p>
              <p className="font-medium">
                {submission.updated_at
                  ? new Date(submission.updated_at).toLocaleString("en-US", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })
                  : "—"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => router.push("/admin/submissions")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Submissions
        </Button>
        <Button
          onClick={() => router.push(`/admin/submissions/edit/${id}`)}
          className="gap-2"
        >
          <Edit className="h-4 w-4" />
          Edit Submission
        </Button>
      </div>
    </div>
  );
}
