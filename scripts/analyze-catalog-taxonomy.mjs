import fs from "node:fs/promises";
import path from "node:path";
import {
  filterProducts,
  scoreProductSearch,
} from "../lib/products.mjs";

const outputDir =
  process.argv[2] ||
  path.join(process.cwd(), "outputs", "catalog-audit-2026-06-28");
const exportData = JSON.parse(
  await fs.readFile(path.join(outputDir, "catalog-export.json"), "utf8")
);
const previousAudit = JSON.parse(
  await fs.readFile(path.join(outputDir, "previous-audit.json"), "utf8")
);

const taxonomy = [
  {
    name: "Content & Writing",
    currentCategoryId: 1,
    phrases: {
      "copywriting": 12,
      "writing assistant": 12,
      "write": 5,
      "writing": 8,
      "grammar": 12,
      "proofread": 12,
      "translation": 10,
      "translate": 10,
      "article": 8,
      "blog post": 8,
      "document generation": 8,
      "text generation": 7,
    },
  },
  {
    name: "Design & Image",
    currentCategoryId: 2,
    phrases: {
      "image generation": 14,
      "text-to-image": 14,
      "photo editing": 13,
      "image editing": 13,
      "graphic design": 11,
      "visual design": 10,
      "illustration": 10,
      "logo": 9,
      "design assets": 9,
      "image": 5,
      "photo": 6,
      "design": 4,
    },
  },
  {
    name: "Video",
    currentCategoryId: 3,
    phrases: {
      "video generation": 14,
      "text-to-video": 14,
      "video editing": 12,
      "video creation": 12,
      "video avatar": 11,
      "talking avatar": 11,
      "video": 7,
      "animation": 9,
      "animate": 8,
      "footage": 7,
      "clip": 5,
    },
  },
  {
    name: "Audio & Voice",
    currentCategoryId: 4,
    phrases: {
      "text-to-speech": 14,
      "speech-to-text": 14,
      "voice agent": 10,
      "voice assistant": 10,
      "voiceover": 12,
      "transcription": 11,
      "audio editing": 11,
      "speech": 8,
      "voice": 7,
      "audio": 7,
      "music generation": 12,
      "music": 7,
      "podcast": 8,
      "noise cancellation": 11,
    },
  },
  {
    name: "Productivity & Collaboration",
    currentCategoryId: 5,
    phrases: {
      "meeting assistant": 13,
      "meeting notes": 13,
      "note taking": 10,
      "project management": 11,
      "task management": 10,
      "scheduling": 10,
      "calendar": 9,
      "email assistant": 10,
      "inbox": 8,
      "collaboration": 8,
      "workspace": 7,
      "productivity": 9,
      "documents": 5,
      "presentation": 8,
      "slides": 8,
    },
  },
  {
    name: "Agents & Automation",
    currentCategoryId: 6,
    phrases: {
      "ai agent": 13,
      "ai agents": 13,
      "autonomous agent": 14,
      "digital worker": 13,
      "digital coworker": 13,
      "workflow automation": 11,
      "task automation": 10,
      "browser automation": 11,
      "automates": 7,
      "automate": 7,
      "automation": 8,
      "agentic": 11,
      "agent": 7,
    },
  },
  {
    name: "AI Assistants & Chat",
    currentCategoryId: 10,
    phrases: {
      "personal ai": 12,
      "personal assistant": 12,
      "ai companion": 13,
      "conversational assistant": 12,
      "general-purpose assistant": 12,
      "chat assistant": 11,
      "ai chatbot": 9,
      "chat interface": 9,
      "chat characters": 10,
      "role-play": 9,
      "companion": 10,
      "personality": 8,
      "conversation": 6,
      "assistant": 4,
    },
  },
  {
    name: "Sales & Marketing",
    currentCategoryId: 7,
    phrases: {
      "sales intelligence": 13,
      "sales engagement": 13,
      "sales assistant": 12,
      "sales agent": 12,
      "lead generation": 13,
      "lead scoring": 12,
      "prospecting": 12,
      "outreach": 11,
      "advertising": 11,
      "ad creative": 12,
      "content marketing": 11,
      "social media": 10,
      "email marketing": 11,
      "search engine optimization": 13,
      "seo": 12,
      "marketing": 9,
      "crm": 9,
      "campaign": 8,
      "growth": 5,
      "leads": 7,
      "product demo": 9,
    },
  },
  {
    name: "Developer Tools",
    currentCategoryId: 8,
    phrases: {
      "code completion": 14,
      "coding assistant": 14,
      "software development": 11,
      "code review": 13,
      "developer tool": 12,
      "developer platform": 10,
      "pair programmer": 13,
      "programming": 8,
      "code generation": 11,
      "codebase": 9,
      "ide": 10,
      "sdk": 9,
      "debug": 9,
      "testing": 7,
      "frontend": 7,
      "deploy": 6,
      "developer": 8,
      "coding": 9,
      "code": 6,
    },
  },
  {
    name: "Data & Analytics",
    currentCategoryId: 9,
    phrases: {
      "business intelligence": 13,
      "data analysis": 13,
      "data analytics": 13,
      "analytics platform": 11,
      "data visualization": 11,
      "forecasting": 10,
      "predictive analytics": 12,
      "data quality": 11,
      "data pipeline": 10,
      "data orchestration": 10,
      "dashboard": 8,
      "analytics": 9,
      "insights": 5,
      "data": 4,
    },
  },
  {
    name: "Customer Support",
    currentCategoryId: 10,
    phrases: {
      "customer support": 14,
      "customer service": 13,
      "support agent": 13,
      "support automation": 12,
      "help desk": 12,
      "helpdesk": 12,
      "contact center": 12,
      "call center": 12,
      "customer experience": 9,
      "chatbot": 9,
      "live chat": 9,
    },
  },
  {
    name: "Research & Knowledge",
    currentCategoryId: 12,
    phrases: {
      "answer engine": 13,
      "knowledge management": 12,
      "knowledge base": 11,
      "research assistant": 13,
      "market research": 11,
      "scientific research": 12,
      "literature review": 12,
      "semantic search": 11,
      "enterprise search": 11,
      "search engine": 9,
      "citations": 10,
      "research": 9,
      "knowledge": 8,
      "search": 5,
      "summarize files": 8,
    },
  },
  {
    name: "Education",
    currentCategoryId: 11,
    phrases: {
      "learning platform": 12,
      "learning assistant": 13,
      "education": 12,
      "educational": 11,
      "tutor": 13,
      "tutoring": 13,
      "teacher": 10,
      "students": 9,
      "children": 8,
      "course": 8,
      "study": 8,
    },
  },
  {
    name: "AI Infrastructure & Models",
    currentCategoryId: 8,
    phrases: {
      "model hosting": 13,
      "model inference": 13,
      "inference platform": 13,
      "foundation model": 13,
      "language model": 10,
      "vector database": 13,
      "machine learning platform": 11,
      "mlops": 13,
      "model monitoring": 12,
      "model training": 11,
      "gpu cloud": 12,
      "gpu": 8,
      "embeddings": 9,
      "rag": 8,
      "llm applications": 9,
      "open-source model": 11,
      "ai infrastructure": 13,
      "api for ai": 8,
    },
  },
  {
    name: "Business Operations",
    currentCategoryId: 5,
    phrases: {
      "financial operations": 12,
      "finance workflow": 11,
      "bookkeeping": 12,
      "billing": 11,
      "accounting": 11,
      "compliance": 10,
      "due diligence": 11,
      "legal": 10,
      "contract": 8,
      "payroll": 11,
      "human resources": 10,
      "hr teams": 9,
      "recruiting": 9,
      "healthcare": 9,
      "clinical": 9,
      "insurance": 9,
      "fraud": 9,
      "identity verification": 10,
      "back office": 10,
      "operations": 7,
      "audit": 8,
    },
  },
];

const overrides = new Map(
  Object.entries({
    "MediaPipe": "AI Infrastructure & Models",
    "Hootsuite": "Sales & Marketing",
    "Synthesia": "Video",
    "Grammarly": "Content & Writing",
    "Otter.ai": "Productivity & Collaboration",
    "Replika": "AI Assistants & Chat",
    "Pi (Inflection)": "AI Assistants & Chat",
    "HeyGen": "Video",
    "D-ID": "Video",
    "Tome": "Productivity & Collaboration",
    "Gamma": "Productivity & Collaboration",
    "Clearscope": "Sales & Marketing",
    "Kaiber": "Video",
    "Ocoya": "Sales & Marketing",
    "Frase": "Sales & Marketing",
    "Monday.com AI": "Productivity & Collaboration",
    "Copy.ai": "Sales & Marketing",
    "You.com": "Research & Knowledge",
    "Suno": "Audio & Voice",
    "Udio": "Audio & Voice",
    "Boomy": "Audio & Voice",
    "Splash Music": "Audio & Voice",
    "Krisp": "Audio & Voice",
    "Kittl": "Design & Image",
    "Remini": "Design & Image",
    "Facetune (Lightricks)": "Design & Image",
    "Wispr Flow": "Audio & Voice",
    "Midjourney": "Design & Image",
    "DALL-E": "Design & Image",
    "Stable Diffusion": "Design & Image",
    "Microsoft Copilot": "Productivity & Collaboration",
    "Amazon Bedrock": "AI Infrastructure & Models",
    "IBM Watson": "AI Infrastructure & Models",
    "Pinecone": "AI Infrastructure & Models",
    "Weaviate": "AI Infrastructure & Models",
    "Chroma": "AI Infrastructure & Models",
    "Weights & Biases": "AI Infrastructure & Models",
    "RunPod": "AI Infrastructure & Models",
    "Tidio": "Customer Support",
    "Modal": "AI Infrastructure & Models",
    "Together AI": "AI Infrastructure & Models",
    "Fireworks AI": "AI Infrastructure & Models",
    "OctoAI": "AI Infrastructure & Models",
    "Paperspace": "AI Infrastructure & Models",
    "SambaNova": "AI Infrastructure & Models",
    "Graphcore": "AI Infrastructure & Models",
    "Habana Labs": "AI Infrastructure & Models",
    "Groq": "AI Infrastructure & Models",
    "Nvidia Omniverse": "AI Infrastructure & Models",
    "Relay.app": "Agents & Automation",
    "Apache Spark": "Data & Analytics",
    "Dask": "Data & Analytics",
    "Prisma": "Developer Tools",
    "Transformers (Hugging Face)": "AI Infrastructure & Models",
    "Pandas AI": "Data & Analytics",
    "spaCy": "AI Infrastructure & Models",
    "FastAPI AI": "Developer Tools",
    "Pydantic AI": "Developer Tools",
    "LlamaIndex": "AI Infrastructure & Models",
    "Qdrant": "AI Infrastructure & Models",
    "Milvus": "AI Infrastructure & Models",
    "Prefect": "Data & Analytics",
    "Dagster": "Data & Analytics",
    "Scale AI": "AI Infrastructure & Models",
    "Fiddler AI": "AI Infrastructure & Models",
    "Arize AI": "AI Infrastructure & Models",
    "Tecton": "AI Infrastructure & Models",
    "Feast": "AI Infrastructure & Models",
    "Hopsworks": "AI Infrastructure & Models",
    "Browserbase": "Developer Tools",
    "Perplexity AI": "Research & Knowledge",
    "DataforSEO": "Sales & Marketing",
    "Firecrawl": "Developer Tools",
    "Brain Trust": "AI Infrastructure & Models",
    "ActiveCampaign": "Sales & Marketing",
    "Botsify": "Customer Support",
    "Profound": "Sales & Marketing",
    "ClearML": "AI Infrastructure & Models",
    "Lovable": "Developer Tools",
    "Make": "Agents & Automation",
    "Manychat": "Sales & Marketing",
    "Clay": "Sales & Marketing",
    "Buffer AI Assistant": "Sales & Marketing",
    "Oboe": "Education",
    "Reforge": "Education",
    "Character.AI": "AI Assistants & Chat",
    "Runway": "Video",
    "Pika": "Video",
    "Luma AI": "Video",
    "Descript": "Video",
    "Jasper": "Content & Writing",
    "QuillBot": "Content & Writing",
    "Writesonic": "Content & Writing",
    "Leonardo.AI": "Design & Image",
    "Krea": "Design & Image",
    "Photoroom": "Design & Image",
    "Docusign": "Business Operations",
    "Supersonik": "Sales & Marketing",
    "Lensa": "Design & Image",
    "Codeium": "Developer Tools",
    "Poe by Quora": "AI Assistants & Chat",
    "Wonder Dynamics": "Video",
    "Mem": "Productivity & Collaboration",
    "Tana": "Productivity & Collaboration",
    "Notion AI": "Productivity & Collaboration",
    "Reface": "Video",
    "Voicemod": "Audio & Voice",
    "Pictory": "Video",
    "Synthesys": "Video",
    "Soundraw": "Audio & Voice",
    "Adobe Firefly": "Design & Image",
    "Loom AI": "Video",
    "AdCreative.ai": "Sales & Marketing",
    "MarketMuse": "Sales & Marketing",
    "MLflow": "AI Infrastructure & Models",
    "Kubeflow": "AI Infrastructure & Models",
    "Gradio": "Developer Tools",
    "Replicate": "AI Infrastructure & Models",
    "Persado": "Sales & Marketing",
    "Drift AI": "Customer Support",
    "Fathom AI": "Productivity & Collaboration",
    "Dovetail": "Research & Knowledge",
    "ChatGPT": "AI Assistants & Chat",
    "PhantomBuster": "Sales & Marketing",
    "Surfer AI": "Sales & Marketing",
    "Linear AI": "Productivity & Collaboration",
    "MagicPatterns": "Developer Tools",
    "Genspark": "Research & Knowledge",
    "TestSprite": "Developer Tools",
    "Claude Code": "Developer Tools",
    "Granola": "Productivity & Collaboration",
    "GitHub Copilot": "Developer Tools",
    "DeepSeek": "AI Infrastructure & Models",
    "Ideogram": "Design & Image",
    "Kling": "Video",
    "Webflow": "Developer Tools",
    "Bolt": "Developer Tools",
    "Superhuman": "Productivity & Collaboration",
    "Supabase": "Developer Tools",
    "VAPI": "Developer Tools",
    "Vercel": "Developer Tools",
    "Warp": "Developer Tools",
    "Claude": "AI Assistants & Chat",
    "v0": "Developer Tools",
    "Tavus": "Video",
    "Captions": "Video",
    "NotebookLM": "Research & Knowledge",
    "Grok": "AI Assistants & Chat",
    "OpenAI Whisper": "Audio & Voice",
    "DeepL Translator": "Content & Writing",
    "ElevenLabs": "Audio & Voice",
    "LangChain": "AI Infrastructure & Models",
    "Scikit-learn": "AI Infrastructure & Models",
    "OpenCV AI Kit": "AI Infrastructure & Models",
    "Detectron2": "AI Infrastructure & Models",
    "YOLO (You Only Look Once)": "AI Infrastructure & Models",
    "NLTK": "AI Infrastructure & Models",
    "Gensim": "AI Infrastructure & Models",
    "Apache Airflow": "Data & Analytics",
    "Great Expectations": "Data & Analytics",
    "Gumloop": "Agents & Automation",
    "Lindy": "Agents & Automation",
    "Manus": "Agents & Automation",
    "n8n": "Agents & Automation",
    "Cursor": "Developer Tools",
    "Windsurf": "Developer Tools",
    "Greptile": "Developer Tools",
    "HubSpot AI": "Sales & Marketing",
    "Avoma": "Sales & Marketing",
    "Clari": "Sales & Marketing",
    "Gong": "Sales & Marketing",
    "Lavender": "Sales & Marketing",
    "Salesforce Sales Cloud": "Sales & Marketing",
    "Salesloft": "Sales & Marketing",
    "Apollo.io": "Sales & Marketing",
    "Cognism": "Sales & Marketing",
    "Visible.vc": "Business Operations",
    "Aleph Kids": "Education",
    "AnswerThis": "Research & Knowledge",
    "Patent Watch": "Research & Knowledge",
    "Plotly": "Data & Analytics",
    "superwhisper": "Audio & Voice",
    "Artlist": "Audio & Voice",
    "Listen Labs": "Research & Knowledge",
    "Prompt Genie": "Productivity & Collaboration",
    "Arc Search": "Research & Knowledge",
    "Type.ai": "Content & Writing",
    "MailMaestro": "Productivity & Collaboration",
    "ClickUp": "Productivity & Collaboration",
    "Asana": "Productivity & Collaboration",
    "Reclaim": "Productivity & Collaboration",
    "Any.do": "Productivity & Collaboration",
    "Agent.ai": "Agents & Automation",
    "Zed": "Developer Tools",
    "Qodo": "Developer Tools",
    "Zoom": "Productivity & Collaboration",
    "Mailchimp": "Sales & Marketing",
    "Harmonic.ai": "Sales & Marketing",
    "Deel": "Business Operations",
    "Gusto": "Business Operations",
    "Brex": "Business Operations",
    "Mercury": "Business Operations",
    "Calendly": "Productivity & Collaboration",
    "Vitally": "Customer Support",
    "Pylon": "Customer Support",
    "Carta": "Business Operations",
    "Ahrefs": "Sales & Marketing",
    "Metabase": "Data & Analytics",
    "Mixpanel": "Data & Analytics",
    "Google Workspace": "Productivity & Collaboration",
    "Contentful": "Developer Tools",
    "Zuddl": "Sales & Marketing",
    "Ray": "AI Infrastructure & Models",
    "Nori AI": "Productivity & Collaboration",
    "Travo": "Productivity & Collaboration",
    "Persona": "AI Assistants & Chat",
    "Anyscale": "AI Infrastructure & Models",
    "Thesis": "Research & Knowledge",
    "Codyco": "Customer Support",
    "Articulate": "Business Operations",
    "Google Labs": "Research & Knowledge",
    "InVideo": "Video",
    "Picsart AI tools": "Design & Image",
    "Unstructured": "AI Infrastructure & Models",
    "Remix": "Developer Tools",
    "Banner Bear": "Design & Image",
    "Rosebud": "Design & Image",
    "HeyBoss": "Content & Writing",
    "Hyperspell": "Content & Writing",
    "DiaBrowser": "Data & Analytics",
    "OpenAI Platform": "AI Infrastructure & Models",
    "o11": "Business Operations",
    "Moss": "AI Infrastructure & Models",
    "Nessie Labs": "Research & Knowledge",
    "Tako": "Research & Knowledge",
    "Chronicle": "Productivity & Collaboration",
    "Curio": "Audio & Voice",
    "Luel": "AI Infrastructure & Models",
    "Bravi": "Customer Support",
    "Stratus": "Business Operations",
    "Swell AI": "Content & Writing",
    "Tonkotsu": "Customer Support",
    "Relume": "Developer Tools",
    "Playground": "Design & Image",
    "Cerebras": "AI Infrastructure & Models",
    "LogosGuard": "Business Operations",
    "Sanctum": "Developer Tools",
    "Banana": "AI Infrastructure & Models",
    "Howie": "Research & Knowledge",
    "AskDonna": "Productivity & Collaboration",
    "Arcads": "Sales & Marketing",
    "Cubby": "AI Assistants & Chat",
    "Good Inside": "AI Infrastructure & Models",
    "OpenRoll": "Business Operations",
    "FastShot": "Developer Tools",
    "Kalpa Labs AI": "Developer Tools",
    "Specific": "Developer Tools",
    "Scott": "Developer Tools",
    "Flick": "Video",
    "Hireglide": "Business Operations",
    "Inspector": "Developer Tools",
    "Tango": "Productivity & Collaboration",
    "WorkBeaver": "Agents & Automation",
    "Lately AI": "Sales & Marketing",
    "Streamlit": "Developer Tools",
    "Salesforce Einstein": "Sales & Marketing",
    "Exa": "Data & Analytics",
    "Pathway": "Data & Analytics",
    "Adobe AI Suite": "Design & Image",
    "Delphi": "Data & Analytics",
    "Cora": "Sales & Marketing",
    "DVC (Data Version Control)": "AI Infrastructure & Models",
    "Redis AI": "AI Infrastructure & Models",
    "Elasticsearch": "AI Infrastructure & Models",
    "Diligence Squared": "Business Operations",
    "Alt-X": "Business Operations",
    "PlayVision": "Data & Analytics",
    "Clad Labs": "Data & Analytics",
    "AutoMax": "Business Operations",
    "Logical": "Productivity & Collaboration",
    "Nivara": "Data & Analytics",
    "Mod AI": "Business Operations",
    "aurachat": "Sales & Marketing",
    "Co-founder AI": "Productivity & Collaboration",
    "Kanu AI": "Agents & Automation",
    "String.com": "AI Infrastructure & Models",
    "Ada Health": "Customer Support",
    "Playwright MCP": "Developer Tools",
    "DeckerMCP": "Developer Tools",
    "Overlap": "Video",
    "DataRobot": "AI Infrastructure & Models",
    "Slack AI": "Productivity & Collaboration",
    "Airtable AI": "Productivity & Collaboration",
    "Intercom AI": "Customer Support",
    "Perplexity MCP Server": "Developer Tools",
    "AnyChat": "AI Assistants & Chat",
    "Sourcebot": "Developer Tools",
    "Unsiloed": "Data & Analytics",
    "Rovr": "Productivity & Collaboration",
    "Google Antigravity": "Developer Tools",
    "Runable": "Agents & Automation",
    "Canva AI": "Design & Image",
    "Figma AI": "Design & Image",
    "Hugging Face": "AI Infrastructure & Models",
    "Comet ML": "AI Infrastructure & Models",
    "Post Bridge": "Developer Tools",
    "Sava": "Business Operations",
    "Whylabs": "AI Infrastructure & Models",
    "Notomail": "Productivity & Collaboration",
    "Flow Step Copilot": "Developer Tools",
    "Arthur AI": "AI Infrastructure & Models",
    "TensorFlow Extended (TFX)": "AI Infrastructure & Models",
    "PyTorch Lightning": "AI Infrastructure & Models",
    "Vast.ai": "AI Infrastructure & Models",
    "Markit": "Business Operations",
    "Continue": "Developer Tools",
    "Neptune AI": "AI Infrastructure & Models",
    "Framer": "Developer Tools",
    "Higgsfield AI": "Video",
    "Stability AI": "AI Infrastructure & Models",
    "Amera Health Solutions": "Business Operations",
    "Crunched": "Data & Analytics",
    "Z.ai": "AI Assistants & Chat",
    "Runway ML": "Video",
    "Mayflower": "Business Operations",
    "Primer": "Sales & Marketing",
    "Monday.com Dev": "Developer Tools",
    "Seldon": "AI Infrastructure & Models",
    "Betterdata": "Data & Analytics",
    "GenViral": "Sales & Marketing",
  })
);

const previousById = new Map(
  previousAudit.map((row) => [String(row["Product ID"]), row])
);
const taxonomyByName = new Map(taxonomy.map((category) => [category.name, category]));
const subcategoriesByCategory = new Map();
for (const subcategory of exportData.taxonomy.subcategories) {
  if (!subcategoriesByCategory.has(subcategory.category_id)) {
    subcategoriesByCategory.set(subcategory.category_id, []);
  }
  subcategoriesByCategory.get(subcategory.category_id).push(subcategory);
}

function normalize(value) {
  return String(value ?? "").trim().toLowerCase();
}

function scoreCategory(product, category) {
  const name = normalize(product.name);
  const tagline = normalize(product.tagline);
  const description = normalize(product.description);
  let score = 0;
  const matches = [];

  for (const [phrase, weight] of Object.entries(category.phrases)) {
    let phraseScore = 0;
    if (name.includes(phrase)) phraseScore += weight * 1.6;
    if (tagline.includes(phrase)) phraseScore += weight * 1.2;
    if (description.includes(phrase)) phraseScore += weight;
    if (phraseScore > 0) {
      score += phraseScore;
      matches.push({ phrase, score: phraseScore });
    }
  }

  return {
    category,
    score,
    matches: matches.sort((left, right) => right.score - left.score),
  };
}

function suggestSubcategory(product, currentCategoryId) {
  const candidates = subcategoriesByCategory.get(currentCategoryId) || [];
  const text = normalize(
    [product.name, product.tagline, product.description].filter(Boolean).join(" ")
  );
  const aliases = {
    "Copywriting": ["copywriting", "marketing copy", "sales copy"],
    "Article generation": ["article", "blog", "long-form"],
    "Translation": ["translation", "translate", "localization"],
    "Proofreading": ["proofread", "grammar", "spelling"],
    "Illustrations": ["illustration", "artwork"],
    "Design assets": ["design asset", "graphic design", "logo"],
    "Style transfer": ["style transfer", "stylize"],
    "Image editing": ["image editing", "photo editing", "retouch"],
    "Video creation": ["video generation", "video creation", "text-to-video"],
    "Avatars": ["avatar", "digital human", "talking head"],
    "Video summarization": ["video summarization", "summarize video"],
    "Voiceover generation": ["voiceover", "text-to-speech", "voice generation"],
    "Music synthesis": ["music generation", "music creation", "song"],
    "Speech enhancement": ["noise cancellation", "speech enhancement", "audio enhancement"],
    "Task automation": ["task automation", "automate tasks"],
    "Meeting assistants": ["meeting assistant", "meeting notes", "transcription"],
    "Project planning": ["project management", "project planning"],
    "Chatbots": ["chatbot"],
    "Digital coworkers": ["digital worker", "digital coworker"],
    "Agentic task automation": ["ai agent", "agentic", "autonomous agent"],
    "SEO tools": ["seo", "search engine optimization"],
    "Advertising assistants": ["advertising", "ad creative", "campaign"],
    "Lead scoring": ["lead scoring", "prospecting", "lead generation"],
    "Dashboards": ["dashboard", "reporting"],
    "Code completion": ["code completion", "autocomplete"],
    "AI pair programming": ["pair programmer", "coding assistant"],
    "Code review": ["code review", "pull request"],
    "Data forecasting": ["forecasting", "predictive"],
    "Analytics dashboards": ["analytics dashboard", "business intelligence"],
    "Trend prediction": ["trend prediction", "market trend"],
    "Customer support bots": ["customer support", "customer service"],
    "Proposal assistants": ["proposal", "rfp"],
    "FAQs": ["faq", "knowledge base"],
    "Tutoring": ["tutor", "tutoring"],
    "Educational content generators": ["educational content", "lesson"],
    "Learning assistants": ["learning assistant", "study"],
    "File summarizers": ["file summar", "document summar"],
    "Prompt engineering": ["prompt engineering", "prompt"],
    "Niche AI utilities": [],
  };

  for (const candidate of candidates) {
    if ((aliases[candidate.name] || []).some((phrase) => text.includes(phrase))) {
      return candidate.name;
    }
  }
  return candidates.find((candidate) => candidate.name === "Niche AI utilities")
    ?.name || "";
}

function classifyProduct(product) {
  const overriddenName = overrides.get(product.name);
  let ranked = taxonomy
    .map((category) => scoreCategory(product, category))
    .sort((left, right) => right.score - left.score);
  let selected = ranked[0];
  let confidence;
  let evidence;
  let rule;

  if (overriddenName) {
    selected = {
      category: taxonomyByName.get(overriddenName),
      score: 100,
      matches: [],
    };
    confidence = 0.97;
    evidence = "Known product reviewed against its primary user job.";
    rule = "manual_known_product";
  } else if (selected.score > 0) {
    const runnerUp = ranked[1]?.score || 0;
    const margin = selected.score - runnerUp;
    confidence = Math.min(
      0.92,
      0.55 + Math.min(0.2, selected.score / 150) + Math.min(0.17, margin / 100)
    );
    evidence = selected.matches
      .slice(0, 3)
      .map((match) => match.phrase)
      .join(", ");
    rule = "metadata_keyword_score";
  } else {
    const currentCategoryId = product.categories[0]?.id || 12;
    selected = {
      category:
        taxonomy.find((category) => category.currentCategoryId === currentCategoryId) ||
        taxonomyByName.get("Business Operations"),
      score: 0,
      matches: [],
    };
    confidence = 0.4;
    evidence = "Insufficient metadata signal; retained closest current category.";
    rule = "fallback_needs_review";
  }

  const targetCategoryId = selected.category.currentCategoryId;
  const currentIds = product.categories.map((category) => category.id);
  const currentNames = product.categories.map((category) => category.name);
  const targetCurrentCategory = exportData.taxonomy.categories.find(
    (category) => category.id === targetCategoryId
  );
  const removedCategories = product.categories
    .filter((category) => category.id !== targetCategoryId)
    .map((category) => category.name);
  const removedCategoryIds = product.categories
    .filter((category) => category.id !== targetCategoryId)
    .map((category) => category.id);
  const needsAdd = !currentIds.includes(targetCategoryId);
  let decision;

  if (confidence < 0.7) decision = "Needs human review";
  else if (currentIds.length === 1 && currentIds[0] === targetCategoryId) {
    decision = "Correct";
  } else if (currentIds.includes(targetCategoryId)) {
    decision = "Keep primary; remove extra categories";
  } else {
    decision = "Change primary category";
  }

  const previous = previousById.get(String(product.id)) || {};
  return {
    productId: product.id,
    product: product.name,
    slug: product.slug,
    tagline: product.tagline,
    description: product.description,
    websiteUrl: product.website_url,
    currentCategories: currentNames,
    currentPrimary: currentNames[0] || "",
    suggestedPrimaryV2: selected.category.name,
    suggestedCurrentCategory: targetCurrentCategory?.name || "",
    suggestedCurrentCategoryId: targetCategoryId,
    suggestedSubcategory: suggestSubcategory(product, targetCategoryId),
    categoriesToRemove: removedCategories,
    categoryIdsToRemove: removedCategoryIds,
    categoryToAdd: needsAdd ? targetCurrentCategory?.name || "" : "",
    decision,
    confidence: Number(confidence.toFixed(2)),
    evidence,
    classificationRule: rule,
    directoryRecommendation: previous.Recommendation || "",
    directoryReason: previous.Reason || "",
    metadataIssue: previous["Metadata Issue"] || "",
    sourceUrl: previous["Source URL"] || product.website_url,
  };
}

const audit = exportData.products.map(classifyProduct);
const summary = audit.reduce(
  (result, row) => {
    result[row.decision] = (result[row.decision] || 0) + 1;
    result.bySuggestedCategory[row.suggestedPrimaryV2] =
      (result.bySuggestedCategory[row.suggestedPrimaryV2] || 0) + 1;
    return result;
  },
  { bySuggestedCategory: {} }
);

const benchmarkQueries = [
  "marketing",
  "video",
  "voice",
  "coding",
  "meeting",
  "research",
  "sales",
];
const searchBenchmark = benchmarkQueries.map((query) => {
  const oldMatches = exportData.products.filter((product) => {
    const haystack = [
      product.name,
      product.tagline,
      product.description,
      ...product.categories.map((category) => category.name),
      ...(Array.isArray(product.tags) ? product.tags : []),
      ...product.relationalTags.map((tag) => tag.name),
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(query);
  });
  const searchableProducts = exportData.products.map((product) => ({
    ...product,
    product_categories: product.categories.map((category) => ({ category })),
    product_tags: product.relationalTags.map((tag) => ({ tag })),
  }));
  const newMatches = filterProducts(searchableProducts, {
    searchQuery: query,
  });

  return {
    query,
    oldCount: oldMatches.length,
    newCount: newMatches.length,
    topResults: newMatches.slice(0, 10).map((product) => ({
      product: product.name,
      score: scoreProductSearch(product, query),
    })),
  };
});

await fs.mkdir(outputDir, { recursive: true });
await Promise.all([
  fs.writeFile(
    path.join(outputDir, "taxonomy-audit.json"),
    JSON.stringify({ summary, audit }, null, 2)
  ),
  fs.writeFile(
    path.join(outputDir, "search-benchmark.json"),
    JSON.stringify(searchBenchmark, null, 2)
  ),
]);

console.log(
  JSON.stringify({
    products: audit.length,
    summary,
    searchBenchmark,
  })
);
