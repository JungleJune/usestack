import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { boundedString } from "@/lib/security.mjs";
import {
  authenticateAgentRequest,
  getAgentUserId,
} from "@/lib/server/agent";
import { getSupabaseAdmin } from "@/lib/server/supabase-admin";

function generateSlug(name) {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
}

// Use Gemini to suggest tools for a stack based on a text description
async function suggestStackFromText(description, existingTools) {
  const ai = new GoogleGenAI(process.env.GEMINI_API_KEY);
  const toolList = existingTools.map((t) => `${t.name} (slug: ${t.slug})`).join(", ");

  const prompt = `You are a stack curation assistant. Given a use case description and a list of available AI tools,
suggest the best tools to include in a stack and explain the used_for role of each tool.

Use case: "${description}"

Available tools (name and slug): ${toolList}

Return ONLY valid JSON (no markdown) in this exact structure:
{
  "name": "suggested stack name (3-6 words)",
  "description": "1-2 sentence description of this stack",
  "tools": [
    { "slug": "tool-slug", "used_for": "one sentence explaining why this tool is in the stack" }
  ]
}

Rules:
- Only suggest tools from the available list (use the exact slug)
- Choose 3-7 tools maximum
- The stack name should be descriptive and actionable`;

  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: prompt,
  });

  let raw = response.text.trim().replace(/```[\s\S]*?{/m, "{").replace(/```/g, "").trim();
  return JSON.parse(raw);
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
    let stackName = boundedString(body.name, 160);
    let stackDescription = boundedString(body.description, 2000);
    let toolList = Array.isArray(body.tools) ? body.tools.slice(0, 20) : [];

    // ── MODE: suggest ────────────────────────────────────────────────────
    // Pass free-text description; Gemini picks tools from the existing DB
    // Body: { mode: "suggest", prompt: "I need a stack for outbound sales automation" }
    if (mode === "suggest") {
      const prompt = boundedString(body.prompt, 1000);
      if (!prompt) {
        return NextResponse.json({ error: "prompt is required for mode: suggest" }, { status: 400 });
      }

      // Fetch all available tools
      const { data: allTools } = await supabase
        .from("products")
        .select("id, name, slug")
        .order("name");

      const suggestion = await suggestStackFromText(prompt, allTools || []);
      stackName = stackName || boundedString(suggestion.name, 160, { required: true });
      stackDescription =
        stackDescription ||
        boundedString(suggestion.description, 2000, { required: true });
      toolList = Array.isArray(suggestion.tools)
        ? suggestion.tools.slice(0, 20)
        : [];
    }

    // ── MODE: manual / suggest (after AI fills in name/description) ───────
    // Body: { name, description, tools: [{ slug, used_for }] }
    if (!stackName || !stackDescription) {
      return NextResponse.json(
        { error: "name and description are required (or use mode: suggest with a prompt)" },
        { status: 400 }
      );
    }

    // Create the stack
    const createdBy = await getAgentUserId();
    const { data: stack, error: stackError } = await supabase
      .from("stacks")
      .insert({
        name: stackName.trim(),
        slug: generateSlug(stackName),
        description: stackDescription.trim(),
        is_public: body.is_public ?? false,
        created_by: createdBy,
      })
      .select()
      .single();

    if (stackError) throw stackError;

    // Resolve tools and create junctions
    if (toolList.length > 0) {
      const slugsOrNames = toolList
        .map((tool) =>
          boundedString(tool?.slug || tool?.slug_or_name || tool?.name, 180)
        )
        .filter(Boolean);

      // Fetch matching products by slug first, then by name
      const { data: bySlug } = await supabase
        .from("products")
        .select("id, name, slug")
        .in("slug", slugsOrNames);

      const { data: byName } = await supabase
        .from("products")
        .select("id, name, slug")
        .in("name", slugsOrNames);

      const allMatched = [...(bySlug || []), ...(byName || [])];
      const uniqueProducts = Object.values(
        Object.fromEntries(allMatched.map((p) => [p.id, p]))
      );

      if (uniqueProducts.length > 0) {
        const junctions = uniqueProducts.map((product) => {
          const toolEntry = toolList.find(
            (t) =>
              (t.slug || t.slug_or_name || t.name) === product.slug ||
              (t.slug || t.slug_or_name || t.name) === product.name
          );
          return {
            stack_id: stack.id,
            product_id: product.id,
            stack_name: stack.name,
            product_name: product.name,
            used_for: boundedString(toolEntry?.used_for, 500) || null,
          };
        });

        const { error: jErr } = await supabase.from("product_stack_jnc").insert(junctions);
        if (jErr) throw jErr;
      }
    }

    return NextResponse.json({ success: true, stack }, { status: 201 });

  } catch (err) {
    console.error("Agent stack create error:", err);
    return NextResponse.json({ error: "Unable to create stack" }, { status: 500 });
  }
}
