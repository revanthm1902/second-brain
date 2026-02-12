# Second Brain — AI Knowledge System

A premium AI-powered personal knowledge base built with **Next.js 16**, **Supabase**, and **Google Gemini AI**. Capture ideas, links, and insights — AI auto-summarizes, tags, and categorizes everything.

![Neobrutalism Design](https://img.shields.io/badge/Design-Neobrutalism-ff6b35?style=for-the-badge)
![Next.js 16](https://img.shields.io/badge/Next.js-16-000?style=for-the-badge)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?style=for-the-badge)

## Features

- **AI-Powered Capture** — Drop any idea, link, or insight. Gemini AI generates a detailed summary, smart tags, and a category automatically.
- **Semantic Vector Search** — Search your knowledge base using AI-powered semantic search with pgvector embeddings (Gemini text-embedding-004). Falls back to text search gracefully.
- **Knowledge Graph** — Visualize relationships between your notes using React Flow. Nodes connect via shared tags and categories.
- **File Upload** — Upload documents (.txt, .md, .csv, .json, .pdf) with automatic metadata extraction, AI summarization, and tagging.
- **Command Palette** — Power-user keyboard shortcuts (`Ctrl+K` to open, `N` to capture, `U` to upload, `G` for graph). Search notes and run actions instantly.
- **Smart Filtering** — Filter by type (notes, links, insights), by AI-generated tags, or search full-text across everything.
- **Neobrutalism UI** — Bold borders, hard shadows, vibrant colors, ruled-paper login, and smooth Framer Motion animations.
- **Accessibility** — Proper ARIA labels, keyboard navigation, focus indicators, and screen reader support throughout.
- **Auth & Security** — Email/password authentication via Supabase Auth with SSR cookie sessions and proxy middleware.
- **Embeddable Widget** — A standalone `/widget` page with browse mode for embedding your brain anywhere.
- **Responsive** — Mobile-first design with fullscreen modals, floating FABs, and adaptive layouts.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, Turbopack, Server Actions) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS v4 + custom neobrutalism design system |
| Animation | Framer Motion + Lenis smooth scroll |
| Database | Supabase (PostgreSQL + pgvector + Auth + SSR) |
| AI | Google Gemini 2.0 Flash (summarization) + text-embedding-004 (vectors) |
| Graph | React Flow (knowledge graph visualization) |
| Command Palette | cmdk (command menu) |
| UI Primitives | Radix UI (Dialog, Select, Label) |
| Components | Shadcn/UI-inspired with CVA variants |

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project
- A [Google AI Studio](https://aistudio.google.com) API key

### 1. Clone & Install

```bash
git clone https://github.com/revanthm1902/second-brain.git
cd second-brain
npm install
```

### 2. Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
GEMINI_API_KEY=your_gemini_api_key
```

### 3. Database Setup

Run this SQL in your Supabase SQL Editor:

```sql
-- Enable pgvector extension for semantic search
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE brain_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'note' CHECK (type IN ('note', 'link', 'insight')),
  tags TEXT[] DEFAULT '{}',
  ai_summary TEXT,
  ai_tags TEXT[] DEFAULT '{}',
  ai_category TEXT,
  embedding VECTOR(768),
  file_name TEXT,
  file_type TEXT,
  file_size INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE brain_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own items"
  ON brain_items FOR ALL
  USING (auth.uid() = user_id);

CREATE INDEX idx_brain_items_user ON brain_items(user_id);
CREATE INDEX idx_brain_items_type ON brain_items(type);
CREATE INDEX idx_brain_items_created ON brain_items(created_at DESC);
CREATE INDEX idx_brain_items_embedding ON brain_items USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Vector search function
CREATE OR REPLACE FUNCTION match_brain_items(
  query_embedding VECTOR(768),
  match_threshold FLOAT,
  match_count INT,
  p_user_id UUID
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  title TEXT,
  content TEXT,
  type TEXT,
  tags TEXT[],
  ai_summary TEXT,
  ai_tags TEXT[],
  ai_category TEXT,
  file_name TEXT,
  file_type TEXT,
  file_size INTEGER,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    bi.id,
    bi.user_id,
    bi.title,
    bi.content,
    bi.type,
    bi.tags,
    bi.ai_summary,
    bi.ai_tags,
    bi.ai_category,
    bi.file_name,
    bi.file_type,
    bi.file_size,
    bi.created_at,
    bi.updated_at,
    1 - (bi.embedding <=> query_embedding) AS similarity
  FROM brain_items bi
  WHERE bi.user_id = p_user_id
    AND bi.embedding IS NOT NULL
    AND 1 - (bi.embedding <=> query_embedding) > match_threshold
  ORDER BY bi.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
```

> **Note:** If you already have the `brain_items` table, run these ALTER statements instead:
>
> ```sql
> CREATE EXTENSION IF NOT EXISTS vector;
> ALTER TABLE brain_items ADD COLUMN IF NOT EXISTS embedding VECTOR(768);
> ALTER TABLE brain_items ADD COLUMN IF NOT EXISTS file_name TEXT;
> ALTER TABLE brain_items ADD COLUMN IF NOT EXISTS file_type TEXT;
> ALTER TABLE brain_items ADD COLUMN IF NOT EXISTS file_size INTEGER;
> CREATE INDEX IF NOT EXISTS idx_brain_items_embedding ON brain_items USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
> ```
> Then create the `match_brain_items` function from the SQL above.

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — sign up, and start capturing ideas.

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+K` / `Cmd+K` | Open command palette |
| `N` | Capture new idea |
| `U` | Upload document |
| `G` | Open knowledge graph |
| `Esc` | Close dialogs |
| `↑ ↓` | Navigate command palette |
| `Enter` | Select item in command palette |

## Project Structure

```
src/
├── app/
│   ├── page.tsx              # Dashboard (server component)
│   ├── login/page.tsx        # Auth page (ruled-paper background)
│   ├── widget/page.tsx       # Embeddable widget (browse mode)
│   ├── actions.ts            # Server actions (CRUD, AI, vector search, file upload)
│   ├── api/public/brain/     # Public API for widget
│   └── lib/                  # Supabase clients, types, utils
│       ├── ai-service.ts     # Gemini AI (summarization, tagging, embeddings)
│       ├── types.ts          # TypeScript types
│       └── ...
├── components/
│   ├── dashboard.tsx         # Main dashboard orchestrator
│   ├── capture-modal.tsx     # AI-powered capture form
│   ├── file-upload-modal.tsx # Document upload with drag & drop
│   ├── graph-view.tsx        # React Flow knowledge graph
│   ├── command-palette.tsx   # cmdk command palette (Ctrl+K)
│   ├── note-card.tsx         # Individual item cards
│   ├── detail-view.tsx       # Full item detail dialog
│   ├── profile-popup.tsx     # User profile dropdown
│   ├── search-bar.tsx        # Search with Ctrl+K shortcut
│   ├── smooth-scroll.tsx     # Lenis scroll provider
│   └── ui/                   # Reusable UI primitives
└── proxy.ts                  # Auth middleware (Next.js 16 proxy)
```

## Scripts

```bash
npm run dev      # Start dev server (Turbopack)
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
```

## Deployment

Deploy to [Vercel](https://vercel.com) with one click — just add your environment variables in the Vercel dashboard.

## License

MIT
