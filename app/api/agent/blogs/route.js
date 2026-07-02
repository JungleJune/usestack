import { NextResponse } from "next/server";
import {
  boundedString,
  parsePublicHttpUrl,
} from "@/lib/security.mjs";
import {
  authenticateAgentRequest,
  getAgentUserId,
} from "@/lib/server/agent";
import { getSupabaseAdmin } from "@/lib/server/supabase-admin";

function generateSlug(title) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export async function POST(request) {
  if (!authenticateAgentRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  let title;
  let summary;
  let content;
  let category;
  let slug;
  let status;
  let thumbnailUrl;
  let metaDescription;

  try {
    title = boundedString(body.title, 160, { required: true });
    summary = boundedString(body.summary, 500, { required: true });
    content = boundedString(body.content, 100_000, { required: true });
    category = boundedString(body.category, 30, { required: true });
    slug = boundedString(body.slug, 180);
    status = boundedString(body.status, 20) || "pending";
    metaDescription = boundedString(body.meta_description, 320);
    thumbnailUrl = body.thumbnail_url
      ? parsePublicHttpUrl(body.thumbnail_url).toString()
      : null;
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const VALID_CATEGORIES = ["Tool", "Stack", "News"];
  if (!VALID_CATEGORIES.includes(category)) {
    return NextResponse.json(
      { error: `category must be one of: ${VALID_CATEGORIES.join(", ")}` },
      { status: 400 }
    );
  }

  const validStatuses = ["pending", "published"];
  if (!validStatuses.includes(status)) {
    return NextResponse.json(
      { error: `status must be one of: ${validStatuses.join(", ")}` },
      { status: 400 }
    );
  }

  const tags = Array.isArray(body.tags)
    ? body.tags
        .slice(0, 20)
        .map((tag) => boundedString(tag, 40))
        .filter(Boolean)
    : [];
  const createdBy = await getAgentUserId();
  const finalSlug = generateSlug(slug || title);

  const { data, error } = await getSupabaseAdmin()
    .from("blogs")
    .insert({
      title,
      slug: finalSlug,
      summary,
      content,
      category,
      status: status || "pending",
      tags,
      thumbnail_url: thumbnailUrl,
      meta_description: metaDescription || null,
      created_by: createdBy,
    })
    .select()
    .single();

  if (error) {
    console.error("Agent blog create error:", error);
    return NextResponse.json({ error: "Unable to create blog post" }, { status: 500 });
  }

  return NextResponse.json({ success: true, blog: data }, { status: 201 });
}
