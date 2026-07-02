import { NextResponse } from "next/server";
import { parseToolData } from "@/lib/aiParser";
import { GoogleGenAI } from "@google/genai";
import { captureScreenshot } from "@/lib/screenshotter";
import {
  assertPublicHttpUrl,
  boundedString,
  fetchPublicResource,
  parsePublicHttpUrl,
} from "@/lib/security.mjs";
import { authenticateAgentRequest } from "@/lib/server/agent";
import { getSupabaseAdmin } from "@/lib/server/supabase-admin";

export const runtime = "nodejs";

function generateSlug(name) {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
}

// Use Gemini Vision to extract tool info from a screenshot/image
async function parseToolFromImage(imageUrl, imageBase64, mimeType = "image/jpeg") {
  const ai = new GoogleGenAI(process.env.GEMINI_API_KEY);

  const prompt = `You are an AI tool information extractor. Analyze this screenshot of an AI tool's website or product page and extract structured information.

Return ONLY valid JSON in this exact structure (no markdown, no explanation):
{"name":"","tagline":"","description":"","website_url":"","logo_url":"","tool_thumbnail_url":"","twitter_url":"","linkedin_url":"","company_name":"","tags":[],"categories":[]}

Rules:
- name: the tool/product name
- tagline: one-line value proposition (max 15 words)
- description: 2-3 sentences about what it does
- website_url: if visible in the screenshot
- tags: pick relevant tags from the UI/content visible
- categories: broad category like "developer-coding-tools", "productivity-workflow-tools", etc.
- If a field is not visible, use ""`;

  let imagePart;
  if (imageBase64) {
    if (!["image/jpeg", "image/png", "image/webp"].includes(mimeType)) {
      throw new Error("Unsupported image type");
    }
    if (imageBase64.length > 8_000_000) {
      throw new Error("Image exceeds the 6 MB limit");
    }
    imagePart = { inlineData: { mimeType, data: imageBase64 } };
  } else if (imageUrl) {
    const resource = await fetchPublicResource(imageUrl, {
      timeoutMs: 10_000,
      maxBytes: 6_000_000,
      headers: { "User-Agent": "UseStackBot/1.0" },
    });
    const contentType = resource.contentType.split(";")[0].trim();
    if (!["image/jpeg", "image/png", "image/webp"].includes(contentType)) {
      throw new Error("Remote URL did not return a supported image");
    }
    imagePart = {
      inlineData: {
        mimeType: contentType,
        data: resource.buffer.toString("base64"),
      },
    };
  }

  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: [{ role: "user", parts: [imagePart, { text: prompt }] }],
  });

  let raw = response.text.trim().replace(/```[\s\S]*?{/m, "{").replace(/```/g, "").trim();
  return JSON.parse(raw);
}

function normalizeOptionalUrl(value) {
  return value ? parsePublicHttpUrl(value).toString() : null;
}

function normalizeIds(values, maximumId) {
  if (!Array.isArray(values)) return [];
  return [
    ...new Set(
      values
        .map((value) => Number(typeof value === "object" ? value.id : value))
        .filter(
          (value) =>
            Number.isInteger(value) && value > 0 && value <= maximumId
        )
    ),
  ];
}

function normalizeProductInput(parsed) {
  const name = boundedString(parsed.name, 160, { required: true });
  const websiteUrl = parsePublicHttpUrl(parsed.website_url).toString();

  return {
    ...parsed,
    name,
    tagline: boundedString(parsed.tagline, 300),
    description: boundedString(parsed.description, 5000),
    website_url: websiteUrl,
    logo_url: normalizeOptionalUrl(parsed.logo_url),
    tool_thumbnail_url: normalizeOptionalUrl(parsed.tool_thumbnail_url),
    twitter_url: normalizeOptionalUrl(parsed.twitter_url),
    linkedin_url: normalizeOptionalUrl(parsed.linkedin_url),
    company_name: boundedString(parsed.company_name, 160),
    company_website: normalizeOptionalUrl(parsed.company_website),
    company_logo: normalizeOptionalUrl(parsed.company_logo),
    categories: normalizeIds(parsed.categories, 12),
    subcategories: normalizeIds(parsed.subcategories, 39),
    tags: Array.isArray(parsed.tags)
      ? parsed.tags
          .slice(0, 30)
          .map((tag) =>
            boundedString(typeof tag === "string" ? tag : tag?.type, 40)
          )
          .filter(Boolean)
      : [],
  };
}

// Insert product + category/subcategory junctions from parsed data
async function insertProduct(supabase, parsed) {
  parsed = normalizeProductInput(parsed);
  const slug = generateSlug(parsed.name);

  // Resolve or create company
  let companyId = null;
  if (parsed.company_name) {
    const companySlug = generateSlug(parsed.company_name);
    const { data: existing } = await supabase
      .from("companies")
      .select("id")
      .eq("slug", companySlug)
      .single();

    if (existing) {
      companyId = existing.id;
    } else {
      const { data: newCo } = await supabase
        .from("companies")
        .insert({
          name: parsed.company_name,
          slug: companySlug,
          website_url: parsed.company_website || parsed.website_url || null,
          logo_url: parsed.company_logo || parsed.logo_url || null,
          verified: !!parsed.company_verified,
        })
        .select("id")
        .single();
      if (newCo) companyId = newCo.id;
    }
  }

  const { data: product, error } = await supabase
    .from("products")
    .insert({
      name: parsed.name,
      slug,
      tagline: parsed.tagline || "",
      description: parsed.description || "",
      website_url: parsed.website_url || "",
      logo_url: parsed.logo_url || null,
      tool_thumbnail_url: parsed.tool_thumbnail_url || null,
      company_id: companyId,
      is_verified: !!parsed.is_verified,
      twitter_url: parsed.twitter_url || null,
      linkedin_url: parsed.linkedin_url || null,
      tags: parsed.tags.length > 0 ? parsed.tags : null,
    })
    .select()
    .single();

  if (error) throw error;

  // Category junctions
  if (Array.isArray(parsed.categories) && parsed.categories.length > 0) {
    const catInserts = parsed.categories.map((categoryId, index) => ({
      product_id: product.id,
      category_id: categoryId,
      sort_order: index,
    }));
    await supabase.from("product_category_jnc").insert(catInserts);
  }

  // Subcategory junctions
  if (Array.isArray(parsed.subcategories) && parsed.subcategories.length > 0) {
    const subInserts = parsed.subcategories.map((subcategoryId, index) => ({
      product_id: product.id,
      subcategory_id: subcategoryId,
      sort_order: index,
    }));
    await supabase.from("product_subcategory_jnc").insert(subInserts);
  }

  return product;
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

  const supabase = getSupabaseAdmin();
  const mode = body.mode || "manual";

  try {
    // ── MODE: screenshot ──────────────────────────────────────────────────
    // Server visits the URL, takes a screenshot, Gemini Vision extracts info
    // Best for visually rich homepages or sites that block scrapers
    // Body: { mode: "screenshot", url: "https://cursor.com" }
    if (mode === "screenshot") {
      if (!body.url) {
        return NextResponse.json({ error: "url is required for mode: screenshot" }, { status: 400 });
      }
      const publicUrl = await assertPublicHttpUrl(body.url);
      const { base64, mimeType } = await captureScreenshot(publicUrl.toString());
      const parsed = await parseToolFromImage(null, base64, mimeType);
      // Fill in the website_url from the provided URL if Vision didn't catch it
      if (!parsed.website_url) parsed.website_url = publicUrl.toString();
      const merged = { ...parsed, ...(body.overrides || {}) };
      const product = await insertProduct(supabase, merged);
      return NextResponse.json({ success: true, tool: product, parsed: merged }, { status: 201 });
    }

    // ── MODE: url ─────────────────────────────────────────────────────────
    // Pass a tool URL; scraper + AI fills in all fields automatically
    // Body: { mode: "url", url: "https://cursor.com" }
    if (mode === "url") {
      if (!body.url) {
        return NextResponse.json({ error: "url is required for mode: url" }, { status: 400 });
      }
      const publicUrl = await assertPublicHttpUrl(body.url);
      const parsed = await parseToolData(publicUrl.toString());
      const product = await insertProduct(supabase, parsed);
      return NextResponse.json({ success: true, tool: product, parsed }, { status: 201 });
    }

    // ── MODE: image ────────────────────────────────────────────────────────
    // Pass a screenshot URL or base64; Gemini Vision extracts the tool info
    // Body: { mode: "image", image_url: "https://..." }
    //    or { mode: "image", image_base64: "<base64>", mime_type: "image/png" }
    if (mode === "image") {
      if (!body.image_url && !body.image_base64) {
        return NextResponse.json(
          { error: "image_url or image_base64 is required for mode: image" },
          { status: 400 }
        );
      }
      const parsed = await parseToolFromImage(
        body.image_url,
        body.image_base64,
        body.mime_type || "image/jpeg"
      );
      // Allow caller to override any extracted fields
      const merged = { ...parsed, ...(body.overrides || {}) };
      const product = await insertProduct(supabase, merged);
      return NextResponse.json({ success: true, tool: product, parsed: merged }, { status: 201 });
    }

    // ── MODE: manual ───────────────────────────────────────────────────────
    // Pass all fields directly
    // Body: { mode: "manual", name, tagline, description, website_url, ... }
    const { name, tagline, description, website_url, logo_url, tool_thumbnail_url,
            tags, twitter_url, linkedin_url, categories, subcategories } = body;

    if (!name || !tagline || !description || !website_url) {
      return NextResponse.json(
        { error: "Missing required fields: name, tagline, description, website_url" },
        { status: 400 }
      );
    }

    const product = await insertProduct(supabase, {
      name, tagline, description, website_url,
      logo_url, tool_thumbnail_url, tags,
      twitter_url, linkedin_url,
      categories: categories || [],
      subcategories: subcategories || [],
    });

    return NextResponse.json({ success: true, tool: product }, { status: 201 });

  } catch (err) {
    console.error("Agent tool create error:", err);
    const isValidationError =
      /required|invalid|unsupported|limit|URL|image|characters/i.test(
        err?.message || ""
      );
    return NextResponse.json(
      { error: isValidationError ? err.message : "Unable to create tool" },
      { status: isValidationError ? 400 : 500 }
    );
  }
}
