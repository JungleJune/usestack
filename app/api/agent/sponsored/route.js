import { NextResponse } from "next/server";
import {
  boundedString,
  parsePublicHttpUrl,
} from "@/lib/security.mjs";
import { authenticateAgentRequest } from "@/lib/server/agent";
import { getSupabaseAdmin } from "@/lib/server/supabase-admin";

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

  const { type } = body;
  if (!type || !["tool_ad", "company_ad"].includes(type)) {
    return NextResponse.json(
      { error: 'type is required: "tool_ad" or "company_ad"' },
      { status: 400 }
    );
  }

  const supabase = getSupabaseAdmin();

  // ── TYPE: tool_ad ──────────────────────────────────────────────────────
  // Sponsors an existing tool (shows it as a featured/sponsored listing)
  // Body: { type: "tool_ad", tool_slug: "cursor" }
  //    or { type: "tool_ad", tool_name: "Cursor" }
  if (type === "tool_ad") {
    const toolSlug = boundedString(body.tool_slug, 180);
    const toolName = boundedString(body.tool_name, 160);
    if (!toolSlug && !toolName) {
      return NextResponse.json(
        { error: "tool_slug or tool_name is required for type: tool_ad" },
        { status: 400 }
      );
    }

    // Look up the product
    let query = supabase.from("products").select("id, name, slug");
    if (toolSlug) query = query.eq("slug", toolSlug);
    else query = query.ilike("name", toolName);

    const { data: product, error: lookupErr } = await query.single();
    if (lookupErr || !product) {
      return NextResponse.json(
        { error: `Tool not found: ${toolSlug || toolName}` },
        { status: 404 }
      );
    }

    const { data, error } = await supabase
      .from("ads")
      .insert({ tool_id: product.id, visibility: body.visibility ?? true })
      .select()
      .single();

    if (error) {
      console.error("Agent sponsored tool_ad error:", error);
      return NextResponse.json({ error: "Unable to create sponsored listing" }, { status: 500 });
    }

    return NextResponse.json(
      { success: true, ad: data, tool: { id: product.id, name: product.name, slug: product.slug } },
      { status: 201 }
    );
  }

  // ── TYPE: company_ad ───────────────────────────────────────────────────
  // Creates a banner/company sponsored listing
  // Body: { type: "company_ad", company_name, thumbnail_url, company_url, description }
  if (type === "company_ad") {
    let companyName;
    let thumbnailUrl;
    let companyUrl;
    let description;
    try {
      companyName = boundedString(body.company_name, 160, { required: true });
      thumbnailUrl = parsePublicHttpUrl(body.thumbnail_url).toString();
      companyUrl = body.company_url
        ? parsePublicHttpUrl(body.company_url).toString()
        : null;
      description = boundedString(body.description, 1000);
    } catch (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("company_ads")
      .insert({
        company_name: companyName,
        thumbnail_url: thumbnailUrl,
        company_url: companyUrl,
        description: description || null,
        visibility: body.visibility ?? true,
      })
      .select()
      .single();

    if (error) {
      console.error("Agent sponsored company_ad error:", error);
      return NextResponse.json({ error: "Unable to create sponsored listing" }, { status: 500 });
    }

    return NextResponse.json({ success: true, ad: data }, { status: 201 });
  }
}
