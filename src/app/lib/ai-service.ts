import { GoogleGenerativeAI, type GenerativeModel } from "@google/generative-ai";
import { DEFAULT_TAG_CATEGORIES } from "@/app/lib/types";

// ─── Types ───────────────────────────────────────────────────
export interface AIMetadata {
  summary: string;
  tags: string[];
  category: string;
}

// ─── Custom errors ───────────────────────────────────────────
export class AIConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AIConfigError";
  }
}

export class AIQuotaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AIQuotaError";
  }
}

// ─── Rate limiter ────────────────────────────────────────────
// Tracks timestamps of recent API calls to avoid burning quota
const callTimestamps: number[] = [];
const MAX_CALLS_PER_MINUTE = 10;
const QUOTA_COOLDOWN_MS = 60_000; // 1 minute cooldown after quota hit
let quotaExhaustedUntil = 0;

function checkRateLimit(): void {
  const now = Date.now();

  // If we recently hit a 429, enforce cooldown
  if (now < quotaExhaustedUntil) {
    const waitSec = Math.ceil((quotaExhaustedUntil - now) / 1000);
    throw new AIQuotaError(
      `AI quota temporarily exhausted. Please wait ~${waitSec}s and try again.`
    );
  }

  // Sliding window rate limit
  const oneMinuteAgo = now - 60_000;
  while (callTimestamps.length > 0 && callTimestamps[0] < oneMinuteAgo) {
    callTimestamps.shift();
  }

  if (callTimestamps.length >= MAX_CALLS_PER_MINUTE) {
    throw new AIQuotaError(
      "Too many AI requests. Please wait a minute before trying again."
    );
  }

  callTimestamps.push(now);
}

function markQuotaExhausted(): void {
  quotaExhaustedUntil = Date.now() + QUOTA_COOLDOWN_MS;
}

// ─── Gemini client (fresh per-call to avoid stale state) ─────
function getModel(): GenerativeModel {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "your_gemini_api_key") {
    throw new AIConfigError(
      "Gemini API key is not configured. Set GEMINI_API_KEY in your .env file."
    );
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    generationConfig: {
      temperature: 0.3,
      topP: 0.8,
      maxOutputTokens: 512,
    },
  });
}

// ─── Safe Gemini call with 429 handling ──────────────────────
async function safeGenerate(
  model: GenerativeModel,
  prompt: string
): Promise<string> {
  checkRateLimit();

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    if (!text) throw new Error("Empty response from Gemini");
    return text.trim();
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);

    // Detect quota/rate errors
    if (msg.includes("429") || msg.toLowerCase().includes("quota")) {
      markQuotaExhausted();
      throw new AIQuotaError(
        "Gemini API quota exceeded. The free tier has limited requests per minute. Please wait and try again."
      );
    }

    // Detect model not found
    if (msg.includes("404") || msg.includes("not found")) {
      throw new AIConfigError(
        "Gemini model not available. Check your API key permissions."
      );
    }

    throw error;
  }
}

// ─── Robust JSON extraction ─────────────────────────────────
function extractJSON<T>(text: string): T {
  // Try direct parse
  try {
    return JSON.parse(text) as T;
  } catch {
    // ignore
  }

  // Strip markdown code fences
  const fenceMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
  if (fenceMatch) {
    try {
      return JSON.parse(fenceMatch[1].trim()) as T;
    } catch {
      // ignore
    }
  }

  // Find first { ... } block
  const braceStart = text.indexOf("{");
  const braceEnd = text.lastIndexOf("}");
  if (braceStart !== -1 && braceEnd > braceStart) {
    try {
      return JSON.parse(text.slice(braceStart, braceEnd + 1)) as T;
    } catch {
      // ignore
    }
  }

  throw new Error(`Could not extract JSON from: ${text.slice(0, 200)}`);
}

// ─── Constants ───────────────────────────────────────────────
const ALL_CATEGORIES = DEFAULT_TAG_CATEGORIES.map((c) => c.name);

// ═══════════════════════════════════════════════════════════════
// 1. COMBINED METADATA — SINGLE API CALL
//    (tags + summary + category in one prompt to save quota)
// ═══════════════════════════════════════════════════════════════
export async function generateAIMetadata(
  title: string,
  content: string
): Promise<AIMetadata> {
  try {
    const model = getModel();
    const truncated =
      content.length > 3000 ? content.slice(0, 3000) + "..." : content;

    const prompt = `You are an expert content analyst. Analyze the following content and return a JSON object with EXACTLY these 3 fields:

{
  "summary": "A clear 2-3 sentence summary",
  "tags": ["tag1", "tag2", "tag3"],
  "category": "CategoryName"
}

SUMMARY RULES (MOST IMPORTANT — follow carefully):
- Write 2-3 original sentences that explain the CORE IDEA and KEY TAKEAWAY
- Do NOT copy/repeat the title verbatim
- Do NOT copy the first sentence of the content
- Synthesize and restate in your own words what the content is about and why it matters
- If the content is about a concept, explain what the concept is
- If the content is about a task/project, describe what needs to be done and the goal
- Start with an action phrase like "Explores...", "Discusses...", "Describes...", "Outlines...", "Covers..."

TAG RULES:
- Generate 3-5 specific lowercase hyphenated topic tags (e.g. "machine-learning", "react-hooks", "api-design")
- Tags must describe the SPECIFIC topics discussed, not generic labels
- NEVER use these generic tags: "idea", "content", "note", "learning", "information", "untagged", "general", "topic", "summary"

CATEGORY — pick exactly ONE from: ${ALL_CATEGORIES.join(", ")}
- "Technology" = programming, software, AI/ML, tech tools, APIs, frameworks
- "Business" = entrepreneurship, marketing, strategy, finance, growth
- "Personal" = health, habits, self-improvement, journaling, lifestyle
- "Creative" = design, writing, art, media, photography
- "Learning" = courses, textbooks, academic material, tutorials
- "Work" = project management, meetings, tasks, deadlines, collaboration

---
Title: "${title}"
Content: "${truncated}"
---

Return ONLY valid JSON. No markdown, no explanation.`;

    const text = await safeGenerate(model, prompt);
    const parsed = extractJSON<{
      summary?: string;
      tags?: string[];
      category?: string;
    }>(text);

    // Validate summary — only reject if truly empty or too short
    let summary = parsed.summary || "";
    if (summary.length < 10) {
      // AI returned empty/garbage — build a better fallback
      summary = buildOfflineSummary(title, content);
    }

    // Validate tags
    const tags = Array.isArray(parsed.tags)
      ? parsed.tags
          .filter((t): t is string => typeof t === "string" && t.length > 0)
          .map((t) => t.toLowerCase().replace(/\s+/g, "-"))
          .filter((t) => !["idea", "content", "note", "learning", "information", "untagged"].includes(t))
          .slice(0, 5)
      : [];

    // Validate category
    let category = inferCategoryFromContent(title, content);
    if (parsed.category) {
      const match = ALL_CATEGORIES.find(
        (c) => c.toLowerCase() === parsed.category!.toLowerCase()
      );
      if (match) category = match;
    }

    return {
      summary,
      tags: tags.length > 0 ? tags : inferTagsFromContent(title, content),
      category,
    };
  } catch (error) {
    if (error instanceof AIConfigError || error instanceof AIQuotaError) {
      console.warn(`[AI] ${error.name}: ${error.message}`);
    } else {
      console.error("[AI] Metadata generation failed:", error);
    }

    // Smart offline fallback — never just "title + first 2 lines"
    return {
      summary: buildOfflineSummary(title, content),
      tags: inferTagsFromContent(title, content),
      category: inferCategoryFromContent(title, content),
    };
  }
}

// ═══════════════════════════════════════════════════════════════
// 2. EMBEDDING GENERATION (for vector search)
// ═══════════════════════════════════════════════════════════════
export async function generateEmbedding(text: string): Promise<number[] | null> {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "your_gemini_api_key") return null;

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "text-embedding-004" });
    const truncated = text.length > 2000 ? text.slice(0, 2000) : text;
    const result = await model.embedContent(truncated);
    return result.embedding.values;
  } catch (error) {
    console.error("[AI] Embedding generation failed:", error);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════
// 3. OFFLINE FALLBACKS (used when API is down / quota exceeded)
// ═══════════════════════════════════════════════════════════════

/** Build a useful summary without AI */
function buildOfflineSummary(title: string, content: string): string {
  // Extract meaningful sentences from the content
  const sentences = content
    .replace(/\n+/g, " ")
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 20 && s.length < 200);

  if (sentences.length >= 2) {
    // Pick 2 sentences that aren't just the title
    const useful = sentences.filter(
      (s) => !s.toLowerCase().startsWith(title.toLowerCase().slice(0, 15))
    );
    if (useful.length >= 2) {
      return useful[0] + ". " + useful[1] + ".";
    }
    if (useful.length === 1) {
      return useful[0] + ".";
    }
  }

  // Last resort: truncate content intelligently
  const clean = content.replace(/\n+/g, " ").trim();
  if (clean.length > 150) {
    return clean.slice(0, 150).replace(/\s\S*$/, "") + "...";
  }
  return clean || title;
}

/** Infer tags from content using keyword extraction */
function inferTagsFromContent(title: string, content: string): string[] {
  const text = `${title} ${content}`.toLowerCase();
  const found: string[] = [];

  const tagPatterns: Record<string, RegExp> = {
    "web-development": /\b(html|css|javascript|react|nextjs|vue|angular|frontend|web.?dev)\b/,
    "machine-learning": /\b(ml|machine.?learning|neural|deep.?learning|model|training|dataset)\b/,
    "artificial-intelligence": /\b(ai|artificial.?intelligence|gpt|llm|chatbot|nlp)\b/,
    "programming": /\b(code|coding|programming|developer|software|algorithm|function)\b/,
    "api-design": /\b(api|rest|graphql|endpoint|http|request|response)\b/,
    "database": /\b(database|sql|nosql|postgres|mongo|supabase|firebase)\b/,
    "devops": /\b(devops|docker|kubernetes|ci.?cd|deploy|aws|azure|cloud)\b/,
    "mobile-dev": /\b(mobile|ios|android|react.?native|flutter|swift|kotlin)\b/,
    "productivity": /\b(productivity|workflow|automat|efficiency|tool|process)\b/,
    "finance": /\b(finance|invest|money|budget|revenue|profit|stock|crypto)\b/,
    "health-wellness": /\b(health|fitness|exercise|nutrition|sleep|meditat|wellness)\b/,
    "writing": /\b(writing|blog|article|content.?creation|copywriting|storytell)\b/,
    "design": /\b(design|ux|ui|figma|prototype|wireframe|visual)\b/,
    "project-management": /\b(project|sprint|agile|kanban|scrum|milestone|deadline)\b/,
    "startup": /\b(startup|entrepreneur|mvp|founder|venture|pitch|growth)\b/,
    "marketing": /\b(marketing|seo|social.?media|brand|campaign|analytics|growth.?hack)\b/,
  };

  for (const [tag, regex] of Object.entries(tagPatterns)) {
    if (regex.test(text)) found.push(tag);
    if (found.length >= 4) break;
  }

  return found.length > 0 ? found : ["general"];
}

/** Infer category from content keywords */
function inferCategoryFromContent(title: string, content: string): string {
  const text = `${title} ${content}`.toLowerCase();

  const patterns: [string, RegExp][] = [
    ["Technology", /\b(code|programming|api|javascript|typescript|python|react|database|software|deploy|server|ai\b|machine.?learning|algorithm|github|docker|cloud|devops|frontend|backend|css|html|framework)\b/],
    ["Business", /\b(revenue|startup|market|strategy|customer|growth|sales|invest|profit|business|entrepreneur|product.?market|kpi|roi|branding|competitor)\b/],
    ["Personal", /\b(health|fitness|meditation|habit|journal|mindful|wellness|exercise|sleep|diet|goal.?setting|self.?improve|gratitude|mental.?health)\b/],
    ["Creative", /\b(design|illustration|photography|video|music|art|creative|typography|sketch|animation|writing|storytell|branding|ux|ui)\b/],
    ["Learning", /\b(course|tutorial|textbook|lecture|syllabus|exam|study|curriculum|academic|university|certificate|mooc|edx|coursera|udemy)\b/],
    ["Work", /\b(meeting|deadline|sprint|standup|project.?manage|jira|task|kanban|scrum|agile|collaboration|stakeholder|milestone|okr)\b/],
  ];

  for (const [category, regex] of patterns) {
    if (regex.test(text)) return category;
  }

  return "Technology";
}
