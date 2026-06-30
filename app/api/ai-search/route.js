import { GoogleGenAI } from "@google/genai";
import { boundedString } from "@/lib/security.mjs";
import {
  checkRateLimit,
  rateLimitResponse,
} from "@/lib/server/rate-limit";
import { getSupabaseAdmin } from "@/lib/server/supabase-admin";
import { isProductVisible } from "@/lib/products.mjs";

const groundingTool = {
  googleSearch: {},
};
const config = {
  tools: [groundingTool],
};

async function getAllTools(){
   const { data, error } = await getSupabaseAdmin()
    .from("products")
    .select("id, name, slug, tagline, description, website_url, logo_url, tool_thumbnail_url");

  if (error) throw error;

  return (data || []).filter(isProductVisible);
}
async function getRelevantTools(query, toolList){
    const prompt = `
You are an expert AI workflow architect and tool recommendation engine.

You are given:
1) A user problem statement
2) A catalog of tools (~400). Each tool contains:
   - id (INTEGER database id)
   - tool_id (string slug)
   - name
   - description
   - tagline

GOAL:
Generate a step-by-step workflow that solves the user's problem using the most simplest tools realted to users query. Just Focus on what user's Query is about rather than thinking inDepth.
Each workflow step MUST include at least 1 tool that performs real work in that step.

STRICT THINKING PROCESS (internal only, DO NOT reveal):
1) Identify the user's primary goal and constraints.
2) Break the solution into logical steps from start to finish.
3) For each step, pick the best tool(s) from the provided list.
4) Prefer a coherent stack: tools should integrate logically across steps.
5) Avoid redundant tools. Choose the smallest set that fully solves the problem.
6) Use the Goolge Search tool provided for your reference.
IMPORTANT RULES:
- ONLY choose tools from the provided list.
- Use ONLY the tool database integer id in steps.tools[].id
- Do NOT invent tools or ids.
- Every step MUST include tools.length >= 1
- Every tool included MUST have a clear reason tied to the step.

OUTPUT RULES:
- Return ONLY valid JSON (no markdown, no explanation text, no comments).
- Follow the exact schema below (do not add or remove keys).
- The workflow must have 3-5 steps depending on complexity.
- Focus mainly on what the user has asked not everything that is related to the query.
- stepDescription MUST explain WHY the tool is chosen + WHAT it does in that step.

REQUIRED JSON SCHEMA:
{
  "workflow": {
    "title": "Short, clear workflow title",
    "description": "1–2 sentences describing the overall workflow outcome",
    "steps": [
      {
        "stepNumber": 1,
        "title": "Clear action-based step title",
        "description": "What happens in this step and why it matters",
        "tools": [
          {
            "id": 0,
            "stepDescription": "Explain exactly what this tool does in this step AND why it is the best match."
          }
        ],
      }
    ]
  }
}

NOW GENERATE THE WORKFLOW FOR THIS USER QUERY:
${query}

TOOLS CATALOG (use only these tools, ids must match exactly):
${toolList}
`;
  const ai = new GoogleGenAI(process.env.GEMINI_API_KEY);
  const response = await ai.models.generateContent({
  model: "gemini-2.0-flash",
  contents: prompt,
  config,
});
  return JSON.parse(
    cleanJsonString(response.text)
  );
}
async function getAiSearchResponse(query, allTools) {
  try {
    const data = await getRelevantTools(query, allTools);
    return data;
  } catch (err) {
    console.error("AI Search Error:", err);
    throw new Error("AI search failed");
  }
}


// Helper Function to remove any extra backtics(```) begore json
function cleanJsonString(str) {
  if (!str) return str;
  str = str.replace(/```[\s\S]*?{/m, "{"); 
  str = str.replace(/```/g, "");
  return str.trim();
}

export async function POST(request) {
  const rateLimit = checkRateLimit(request, {
    namespace: "ai-search",
    limit: 10,
    windowMs: 15 * 60 * 1000,
  });
  if (!rateLimit.allowed) return rateLimitResponse(rateLimit);

  if (!process.env.GEMINI_API_KEY) {
    return Response.json({ error: "Server configuration error" }, { status: 500 });
  }

  try {
    const body = await request.json();
    const query = boundedString(body.decodedQuery, 500, { required: true });
    const tools = await getAllTools();
     const toolList = tools
    .map(
      (t, i) =>
        `${i + 1}. id: ${t.id}, name: ${t.name} ,tagline: ${t.tagline} , description: ${t.description}, `
    )
    .join("\n");
    const workflowData = await getAiSearchResponse(query, toolList);
  
    // Check if workflow was generated
    if (!workflowData?.workflow) {
      return Response.json(
        { error: "Failed to generate workflow", workflowId: null },
        { status: 502 }
      );
    }
    // Step 4: Enrich workflow steps with full tool data
    const workflow = workflowData.workflow;
    const allToolIds = new Set();
    // Ensure steps exist
    if (!workflow.steps || !Array.isArray(workflow.steps)) {
      workflow.steps = [];
    }
    workflow.steps = workflow.steps.map((step) => {
      // Handle new format with tools array containing {id, stepDescription}
      const stepToolsData = step.tools || [];
      const enrichedTools = stepToolsData
        .map((toolRef) => {
          const toolId = typeof toolRef === 'object' ? toolRef.id : toolRef;
          const stepDescription = typeof toolRef === 'object' ? toolRef.stepDescription : null;
          const tool = tools.find((t) => t.id === parseInt(toolId, 10));
          if (tool) {
            allToolIds.add(tool.id);
            return {
              ...tool,
              stepDescription: stepDescription || tool.tagline || tool.description?.substring(0, 60),
            };
          }
          return null;
        })
        .filter(Boolean);
      
      return {
        ...step,
        tools: enrichedTools,
      };
    });

    // Get all unique tools used in the workflow
    const allTools = Array.from(allToolIds)
      .map((id) => tools.find((t) => t.id === id))
      .filter(Boolean);

    // Step 5: Save workflow to database
    const workflowResponse = {
      workflow,
      tools: allTools,
    };

    const { data: savedWorkflow, error: insertError } = await getSupabaseAdmin()
      .from("workflows")
      .insert({
        query: query,
        response: workflowResponse,
      })
      .select("id")
      .single();

    if (insertError) {
      console.error("DB Insert Error:", insertError);
      // Still return the workflow even if save fails
      return Response.json({
        ...workflowResponse,
        workflowId: null,
        saved: false,
      });
    }
    return Response.json({
      workflowId: savedWorkflow.id,
      saved: true,
    });
  } catch (err) {
    console.error("AI search route error:", err);
    const isValidationError =
      err instanceof SyntaxError ||
      /required|characters/i.test(err?.message || "");
    return Response.json(
      { error: isValidationError ? "A valid search query is required" : "AI search failed" },
      { status: isValidationError ? 400 : 500 }
    );
  }
}
