import { getJson } from 'serpapi';
import { GoogleGenAI } from "@google/genai";
import {
  assertPublicHttpUrl,
  fetchPublicResource,
} from "@/lib/security.mjs";


// Receives the Tool URL and then uses AI Models to get the relevant info by scrapping and parsing

export async function parseToolData(url){
      const normalizedUrl = (await assertPublicHttpUrl(url)).toString();

      // Try direct page fetch first (fast & reliable), fall back to SerpAPI
      let scrapedData;
      try {
        scrapedData = await fetchPageMeta(normalizedUrl);
      } catch {
        scrapedData = await scrapeURL(normalizedUrl);
        scrapedData = scrapedData?.[0] ?? null;
      }

      if(!scrapedData){
        throw new Error('Could not fetch any data for this URL');
      }
      const refinedToolData = await refineToolData(normalizedUrl, scrapedData);
      if(!refinedToolData){
         throw new Error('AI parsing failed');
      }
      return refinedToolData;
}


   async function refineToolData(url, scrappedData) {
 const prompt = `You are an information extraction system for an AI tools directory. You will be given a tool website URL and scraped data (page meta tags or search results). Your task is to extract structured, factual information about the AI tool. You MUST rely ONLY on the provided scraped data and clear logical interpretation of that data. You may use very limited general knowledge only to fill very small missing gaps, but ONLY if the information is clearly implied by the scraped text. Do NOT infer features, use cases, or classifications that are not explicitly supported.

CRITICAL OUTPUT RULES:
1. Return ONLY valid JSON
2. No markdown, no explanations, no comments
3. Response MUST start with { and end with }
4. Missing values: strings -> "", arrays -> [], booleans -> false
5. NEVER hallucinate or guess
6. If unsure, leave the field empty

FIELD RULES:
"name" must come directly from the scraped result title (tool name only, no tagline). If unclear, infer only from the URL domain.
"tagline" must be a short sentence derived ONLY from scraped snippet text.
"description" must be taken directly from one scraped snippet. Do NOT rewrite or enhance. Choose the most descriptive snippet.
"website_url" must come from scraped link or provided URL.
"logo_url" only if explicitly present in metadata.
"tool_thumbnail_url" prefer og:image, otherwise reuse logo_url.
"twitter_url" and "linkedin_url" only if confidently identifiable.
"team_members" only real individual names explicitly mentioned.

CATEGORIES:
Select categories ONLY if the core purpose of the tool clearly matches the category based on title and description. Do NOT select categories based on secondary features or vague wording. Choose the minimum required (prefer 1). Use ONLY IDs from:
[{id:1,type:"text-writing-tools"},{id:2,type:"image-art-generators"},{id:3,type:"video-animation-tools"},{id:4,type:"audio-voice-tools"},{id:5,type:"productivity-workflow-tools"},{id:6,type:"automation-agents"},{id:7,type:"business-marketing-tools"},{id:8,type:"developer-coding-tools"},{id:9,type:"analytics-data-tools"},{id:10,type:"chat-conversational-assistants"},{id:11,type:"education-tutoring-tools"},{id:12,type:"misc-tools-utilities"}]
If no category is strongly justified by the scraped text, return [].

SUBCATEGORIES (OPTIONAL):
Select ONLY if the tool explicitly performs that function as a primary capability. Do NOT select subcategories that are indirect, implied, or potential use cases. If not clearly supported, return [].
[{id:1,type:"copywriting"},{id:2,type:"article-generation"},{id:3,type:"translation"},{id:4,type:"proofreading"},{id:5,type:"illustrations"},{id:6,type:"design-assets"},{id:7,type:"style-transfer"},{id:8,type:"image-editing"},{id:9,type:"video-creation"},{id:10,type:"avatars"},{id:11,type:"video-summarization"},{id:12,type:"voiceover-generation"},{id:13,type:"music-synthesis"},{id:14,type:"speech-enhancement"},{id:15,type:"task-automation"},{id:16,type:"meeting-assistants"},{id:17,type:"project-planning"},{id:18,type:"chatbots"},{id:19,type:"digital-coworkers"},{id:20,type:"agentic-task-automation"},{id:21,type:"seo-tools"},{id:22,type:"advertising-assistants"},{id:23,type:"lead-scoring"},{id:24,type:"dashboards"},{id:25,type:"code-completion"},{id:26,type:"ai-pair-programming"},{id:27,type:"code-review"},{id:28,type:"data-forecasting"},{id:29,type:"analytics-dashboards"},{id:30,type:"trend-prediction"},{id:31,type:"customer-support-bots"},{id:32,type:"proposal-assistants"},{id:33,type:"faqs"},{id:34,type:"tutoring"},{id:35,type:"educational-content-generators"},{id:36,type:"learning-assistants"},{id:37,type:"file-summarizers"},{id:38,type:"prompt-engineering"},{id:39,type:"niche-ai-utilities"}]

TAGS (OPTIONAL):
Select ONLY tags that directly describe what the tool actually does. Tags must be concrete, functional, and clearly stated or implied in the scraped text. Do NOT add generic, marketing, or ecosystem tags. If relevance is weak or indirect, return [].
[{id:1,type:"3d"},{id:2,type:"ads"},{id:3,type:"answers"},{id:4,type:"art"},{id:5,type:"art-filters"},{id:6,type:"assets"},{id:7,type:"assistant"},{id:8,type:"autocomplete"},{id:9,type:"avatar"},{id:10,type:"avatars"},{id:11,type:"background-removal"},{id:12,type:"beauty"},{id:13,type:"blog"},{id:14,type:"calls"},{id:15,type:"character"},{id:16,type:"chat"},{id:17,type:"citations"},{id:18,type:"clarity"},{id:19,type:"code-completion"},{id:20,type:"companion"},{id:21,type:"composition"},{id:22,type:"compositions"},{id:23,type:"compositing"},{id:24,type:"content"},{id:25,type:"conversation"},{id:26,type:"copy"},{id:27,type:"copywriting"},{id:28,type:"creators"},{id:29,type:"creative"},{id:30,type:"decks"},{id:31,type:"design"},{id:32,type:"docs"},{id:33,type:"dubbing"},{id:34,type:"editing"},{id:35,type:"effect"},{id:36,type:"enhance"},{id:37,type:"explain"},{id:38,type:"face-swap"},{id:39,type:"games"},{id:40,type:"generative"},{id:41,type:"grammar"},{id:42,type:"graphics"},{id:43,type:"ide"},{id:44,type:"image"},{id:45,type:"instant"},{id:46,type:"knowledge"},{id:47,type:"layout"},{id:48,type:"lip-sync"},{id:49,type:"live"},{id:50,type:"noise-cancel"},{id:51,type:"llm"},{id:52,type:"localization"},{id:53,type:"marketing"},{id:54,type:"meetings"},{id:55,type:"memes"},{id:56,type:"multi-model"},{id:57,type:"music"},{id:58,type:"music-creation"},{id:59,type:"music-video"},{id:60,type:"narration"},{id:61,type:"notes"},{id:62,type:"organization"},{id:63,type:"overdub"},{id:64,type:"paraphrase"},{id:65,type:"personas"},{id:66,type:"photo"},{id:67,type:"planning"},{id:68,type:"portraits"},{id:69,type:"privacy"},{id:70,type:"product"},{id:71,type:"prompts"},{id:72,type:"publishing"},{id:73,type:"real-time"},{id:74,type:"realtime"},{id:75,type:"recall"},{id:76,type:"restore"},{id:77,type:"retouch"},{id:78,type:"retrieval"},{id:79,type:"roleplay"},{id:80,type:"royalty-free"},{id:81,type:"search"},{id:82,type:"selfie"},{id:83,type:"seo"},{id:84,type:"slides"},{id:85,type:"social"},{id:86,type:"songs"},{id:87,type:"storytelling"},{id:88,type:"streaming"},{id:89,type:"stylization"},{id:90,type:"summarize"},{id:91,type:"talking-head"},{id:92,type:"tasks"},{id:93,type:"tests"},{id:94,type:"text-to-video"},{id:95,type:"tone"},{id:96,type:"tools"},{id:97,type:"transcription"},{id:98,type:"tts"},{id:99,type:"upscaling"},{id:100,type:"vector"}]

COMPANY RULES:
Extract company info only if explicitly mentioned. If missing, reuse tool name, website, or logo. Never invent funding, team size, or verification.

RETURN JSON IN THIS EXACT STRUCTURE:
{"name":"","tagline":"","description":"","website_url":"","logo_url":"","is_verified":false,"twitter_url":"","linkedin_url":"","team_members":[],"tool_thumbnail_url":"","company_name":"","company_website":"","company_logo":"","company_verified":false,"company_team_size":"","company_funding_round":"","company_funding_amount":"","company_funding_info":"","categories":[],"subcategories":[],"tags":[]}

URL:${url}
SCRAPED DATA:${JSON.stringify(scrappedData)}
`;



  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY is not configured");
    }
    const ai = new GoogleGenAI(process.env.GEMINI_API_KEY);
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
    });

    const data = cleanJsonString(response.text);
    const parsedJSON = JSON.parse(data);
    return parsedJSON;
  } catch (error) {
    console.error("Gemini Error:", error.message);
    throw new Error(`AI parsing failed: ${error.message}`);
  }
}



async function fetchPageMeta(url) {
  const { buffer } = await fetchPublicResource(url, {
    timeoutMs: 10_000,
    maxBytes: 2_000_000,
    maxRedirects: 3,
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; UseStackBot/1.0)' },
  });
  const html = buffer.toString("utf8");

  const getMeta = (name) => {
    const ogMatch = html.match(new RegExp(`<meta[^>]+property=["']og:${name}["'][^>]+content=["']([^"']+)["']`, 'i'))
      || html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:${name}["']`, 'i'));
    if (ogMatch) return ogMatch[1];
    const metaMatch = html.match(new RegExp(`<meta[^>]+name=["']${name}["'][^>]+content=["']([^"']+)["']`, 'i'))
      || html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${name}["']`, 'i'));
    return metaMatch ? metaMatch[1] : '';
  };

  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const title = getMeta('title') || (titleMatch ? titleMatch[1].trim() : '');
  const description = getMeta('description');
  const image = getMeta('image');

  if (!title && !description) {
    throw new Error('Page returned no useful meta tags');
  }

  return {
    title,
    snippet: description,
    link: url,
    thumbnail: image,
  };
}

async function scrapeURL(url) {
  const normalizedUrl = /^https?:\/\//i.test(url) ? url : `https://${url}`;
  const domain = new URL(normalizedUrl).hostname;
  // e.g. "supersonik.ai" → "supersonik"
  const toolName = domain.split(".")[0];

  const serpQuery = (q) =>
    new Promise((resolve, reject) => {
      getJson(
        {
          engine: "google",
          api_key: process.env.SERP_API_KEY,
          q,
          num: 10,
        },
        (json) => {
          if (json?.error) return reject(new Error(`SerpAPI error: ${json.error}`));
          if (json?.organic_results?.length > 0) return resolve(json.organic_results);
          reject(new Error("No organic results found"));
        }
      );
    });

  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error("SerpAPI request timed out")), 15000)
  );

  // Try queries in order of reliability: name-based → domain → site:
  const search = serpQuery(`${toolName} AI tool`)
    .catch(() => serpQuery(domain))
    .catch(() => serpQuery(`site:${domain}`));

  return Promise.race([search, timeout]);
}

// Helper Function to remove any extra backtics(```) begore json
function cleanJsonString(str) {
  if (!str) return str;
  str = str.replace(/```[\s\S]*?{/m, "{"); 
  str = str.replace(/```/g, "");
  return str.trim();
}
