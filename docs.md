# Architecture Documentation

Four key architectural concepts that power Second Brain — a modern AI-powered knowledge management system.

## 1. Portable Architecture

Second Brain is built with a **clear separation of concerns** where every layer is independently swappable without affecting others.

```text
┌──────────────────────────────────────────────────┐
│                 PRESENTATION LAYER                │
│   React Components (Dashboard, Cards, Modals)     │
│   ↕ Swap: Any UI framework (Vue, Svelte, etc.)   │
├──────────────────────────────────────────────────┤
│                 APPLICATION LAYER                 │
│   Server Actions (actions.ts)                     │
│   ↕ Swap: REST API, tRPC, GraphQL                │
├──────────────────────────────────────────────────┤
│                   AI LAYER                        │
│   Gemini AI Service (ai-service.ts)               │
│   ↕ Swap: OpenAI, Claude, Ollama, any LLM        │
├──────────────────────────────────────────────────┤
│                  DATA LAYER                       │
│   Supabase (PostgreSQL + Auth)                    │
│   ↕ Swap: Firebase, PlanetScale, Prisma+any DB   │
├──────────────────────────────────────────────────┤
│              INFRASTRUCTURE LAYER                 │
│   Vercel / Next.js                                │
│   ↕ Swap: AWS, Railway, Docker, self-hosted       │
└──────────────────────────────────────────────────┘
```

### Key swappable components:
*   **AI Provider:** `ai-service.ts` — encapsulates all AI logic behind a clean interface (`generateAIMetadata`). Swap Gemini for OpenAI/Claude by changing one file.
*   **Database:** `supabase-server.ts` & `supabase.ts` — all DB calls go through these. Replace with any ORM or database client.
*   **Auth:** `supabase-middleware.ts` — session management isolated in middleware. Swap for NextAuth, Clerk, or custom JWT.
*   **UI Components:** Radix primitives + Tailwind — headless UI components that can be themed or replaced entirely.

## 2. Principles-Based UX

Every AI interaction in Second Brain follows these five design principles:

### 1. Zero-Friction Capture
Capturing an idea should take under 5 seconds. The modal opens instantly, only title + content are required, and AI handles all metadata generation (tags, category, summary) automatically. No manual tagging burden.

### 2. AI as Silent Partner
AI enriches content behind the scenes — never blocking or interrupting. Summaries, tags, and categories appear after save, not before. The user never waits for AI to "think" before they can move on.

### 3. Graceful Degradation
If the AI quota is exhausted or the API is down, the app still works perfectly. Offline fallbacks generate tags from keyword extraction and summaries from content analysis. The user experience never breaks.

### 4. Progressive Disclosure
Cards show title + preview. Click to reveal full content, AI summary, tags, and actions. The command palette (Ctrl+K) offers power-user access without cluttering the main UI.

### 5. Keyboard-First, Mouse-Friendly
Every action has a keyboard shortcut (N, U, Ctrl+K, Esc). But the UI is equally optimized for mouse/touch — large click targets, hover states, and mobile FABs ensure accessibility for all input methods.

## 3. Agent Thinking

Second Brain employs **autonomous AI agents** that continuously improve the system without manual intervention:

```text
User writes content
       ↓
┌─ AI Agent Pipeline (single API call) ─────────┐
│                                                 │
│  1. SUMMARIZER AGENT                            │
│     → Reads full content, extracts key points   │
│     → Generates 2-3 sentence synthesis          │
│     → Avoids copying first paragraph            │
│                                                 │
│  2. TAGGER AGENT                                │
│     → Identifies specific topic keywords        │
│     → Maps to standardized tag taxonomy          │
│     → Filters out generic/useless tags           │
│                                                 │
│  3. CATEGORIZER AGENT                           │
│     → Classifies into one of 6 categories       │
│     → Uses keyword pattern matching as fallback  │
│                                                 │
│  All 3 agents run in ONE prompt for efficiency  │
└─────────────────────────────────────────────────┘
       ↓
  Result stored → UI auto-updates
```

### Self-improving mechanisms:
*   **Rate Limiting:** Sliding window rate limiter with auto-cooldown prevents API abuse and manages quota intelligently.
*   **Fallback Intelligence:** When AI is unavailable, keyword extraction and pattern matching provide reasonable approximations, ensuring the system degrades gracefully.
*   **Tag Deduplication:** AI-generated tags are automatically deduplicated and normalized (lowercased, hyphenated) preventing tag proliferation.
*   **Content-Aware Typing:** File uploads are auto-classified based on MIME type and content analysis — PDFs become notes, JSON becomes data, etc.

## 4. Infrastructure Mindset

Second Brain exposes its functionality through **APIs and embeddable widgets**, making it a platform — not just an app:

### Public REST API
`GET /api/public/brain/query?user_id=UUID&search=react&limit=10`

Returns brain items as JSON with CORS headers. Supports search, pagination, and filtering. Cacheable with `s-maxage=60`.

### Embeddable Widget
```html
<iframe src="https://your-app.vercel.app/widget?user_id=UUID" width="400" height="600" />
```
A self-contained widget page at `/widget` that can be embedded in any website via iframe. Includes search, browsing, and the full neobrutalist design.

### Architecture for Scale
*   **Edge-first:** Next.js middleware handles auth at the edge — before requests hit the server.
*   **Server Components:** Initial page render is a Server Component — zero client-side JS for the first paint.
*   **Streaming:** Server Actions enable progressive data loading without full page reloads.
*   **CDN-cacheable API:** Public API responses include cache headers for CDN edge caching.
