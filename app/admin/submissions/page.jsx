"use client";
import React, { useState, useMemo, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/lib/admin-supabase";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

function Page() {
  const router = useRouter();
  const [tools, setTools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [approvingTool, setApprovingTool] = useState(null);

  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState("date");
  const [sortOrder, setSortOrder] = useState("desc");

  // Fetch data
  useEffect(() => {
    async function fetchToolData() {
      try {
        const { data, error } = await supabase
          .from("submissions")
          .select()
          .eq("status", "pending");

        if (error) throw error;
        setTools(data);
      } catch (err) {
        toast({
          title: "Error Fetching Tools",
          description: "Error fetching tool data, please try again.",
          duration: 3000,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    }

    fetchToolData();
  }, []);

  // Search Filter
  const filteredData = useMemo(() => {
    return tools.filter((t) =>
      Object.values(t || {})
        .join(" ")
        .toLowerCase()
        .includes(search.toLowerCase())
    );
  }, [search, tools]);

  // Sort
  const sortedData = useMemo(() => {
    return [...filteredData].sort((a, b) => {
      let x = a[sortKey];
      let y = b[sortKey];

      if (sortKey === "date") {
        x = new Date(x);
        y = new Date(y);
      }

      if (sortOrder === "asc") return x > y ? 1 : -1;
      return x < y ? 1 : -1;
    });
  }, [filteredData, sortKey, sortOrder]);

  const toggleSort = (key) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortOrder("asc");
    }
  };
// To handle the Tool Approval;
const handleToolApproval = async (tool) => {
  setApprovingTool(tool.id);
  try {
    // Generate slug from tool name
    const slug = tool.name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();

    // Create a copy in products table
    const { data: productData, error: productError } = await supabase
      .from("products")
      .insert({
        name: tool.name,
        slug: slug,
        tagline: tool.tagline,
        description: tool.description,
        website_url: tool.website_url,
        logo_url: tool.logo_url || null,
        tool_thumbnail_url: tool.tool_thumbnail_url || null,
        company_id: tool.company_id || null,
        is_verified: !!tool.is_verified,
        twitter_url: tool.twitter_url || null,
        linkedin_url: tool.linkedin_url || null,
        team_members: tool.team_members || null,
        tags: tool.tags || null,
      })
      .select()
      .single();

    if (productError) throw productError;

    // Update submission status to approved
    const { error: updateError } = await supabase
      .from("submissions")
      .update({ status: "approved" })
      .eq("id", tool.id);

    if (updateError) throw updateError;

    // Remove the tool from local state (since it's no longer pending)
    setTools((prev) => prev.filter((t) => t.id !== tool.id));

    toast({
      title: "Success",
      description: "Tool approved and added to products successfully.",
      variant: "success",
    });
  } catch (err) {
    toast({
      title: "Error",
      description: err.message || "Error approving the tool.",
      variant: "destructive",
    });
  } finally {
    setApprovingTool(null);
  }
};
//To handle the tool rejected by the admin
const [rejectingTool, setRejectingTool] = useState(null);

const handleToolRejection = async (tool) => {
  setRejectingTool(tool.id);
  try {
    const { error } = await supabase
      .from("submissions")
      .update({ status: "rejected" })
      .eq("id", tool.id);

    if (error) throw error;

    // Remove the tool from local state (since it's no longer pending)
    setTools((prev) => prev.filter((t) => t.id !== tool.id));

    toast({
      title: "Rejected",
      description: "Tool has been rejected.",
    });
  } catch (err) {
    toast({
      title: "Error",
      description: err.message || "Error rejecting the tool.",
      variant: "destructive",
    });
  } finally {
    setRejectingTool(null);
  }
};
  // Loading State
  if (loading) {
    return (
      <div className="p-10 text-center text-gray-500">
        Loading tools...
      </div>
    );
  }

  // Empty State
  if (tools.length === 0) {
    return (
      <div className="p-10 text-center text-gray-500">
        <h3 className="text-xl font-semibold mb-2">No Submissions to Review</h3>
        <p className="text-gray-400">Tools submitted by users will appear here.</p>
      </div>
    );
  }

  return (
   <div className="overflow-x-auto rounded-lg border">
  <table className="w-full text-sm min-w-[900px]">
    <thead className="bg-gray-100">
      <tr className="text-left">
        <th className="px-4 py-3 cursor-pointer" onClick={() => toggleSort("name")}>Tool Name</th>
        <th className="px-4 py-3 cursor-pointer" onClick={() => toggleSort("website")}>Website URL</th>
        <th className="px-4 py-3 cursor-pointer" onClick={() => toggleSort("submitterName")}>Submitter Name</th>
        <th className="px-4 py-3 cursor-pointer" onClick={() => toggleSort("submitterEmail")}>Submitter Email</th>
        <th className="px-4 py-3 cursor-pointer" onClick={() => toggleSort("status")}>Status</th>
        <th className="px-4 py-3 cursor-pointer" onClick={() => toggleSort("created_at")}>Date Submitted</th>
        <th className="px-4 py-3">Actions</th>
      </tr>
    </thead>

    <tbody className="divide-y">
      {sortedData.map((tool, idx) => (
        <tr key={idx} className="hover:bg-gray-50 transition-all">
          
          {/* Tool Name */}
          <td className="px-4 py-3 font-medium">{tool.name}</td>

          {/* Website URL */}
          <td className="px-4 py-3">
            <a
              href={tool.website_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 underline break-words"
            >
              {tool.website_url}
            </a>
          </td>

          {/* Submitter Name */}
          <td className="px-4 py-3">{tool.submitter_name || "N/A"}</td>

          {/* Submitter Email */}
          <td className="px-4 py-3 break-words">{tool.submitter_email || "N/A"}</td>

          {/* Status Badge */}
          <td className="px-4 py-3">
            <span
              className={`px-2 py-1 rounded-full text-xs font-semibold
                ${
                  tool.status === "approved"
                    ? "bg-green-100 text-green-700"
                    : tool.status === "rejected"
                    ? "bg-red-100 text-red-700"
                    : "bg-yellow-100 text-yellow-700"
                }
              `}
            >
              {tool.status}
            </span>
          </td>

          {/* Date */}
          <td className="px-4 py-3">
            {tool?.created_at
              ? new Date(tool.created_at).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })
              : "—"}
          </td>

          {/* Actions */}
          <td className="px-4 py-3">
            <div className="flex flex-wrap gap-2">

              <button
                className="px-3 py-1 border rounded-md hover:bg-gray-100"
                onClick={() => window.location.href = `/admin/submissions/view/${tool.id}`}
              >
                View
              </button>

              <button
                className="px-3 py-1 border rounded-md hover:bg-gray-100"
                onClick={() => router.push(`/admin/submissions/edit/${tool.id}`)}
              >
                Edit
              </button>

              <button
                className="px-3 py-1 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                onClick={() => handleToolApproval(tool)}
                disabled={approvingTool === tool.id}
              >
                {approvingTool === tool.id ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Approving...
                  </>
                ) : (
                  "Accept"
                )}
              </button>

              <button
                className="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                onClick={() => handleToolRejection(tool)}
                disabled={rejectingTool === tool.id}
              >
                {rejectingTool === tool.id ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Rejecting...
                  </>
                ) : (
                  "Reject"
                )}
              </button>

            </div>
          </td>

        </tr>
      ))}
    </tbody>
  </table>
</div>

  );
}

export default Page;
