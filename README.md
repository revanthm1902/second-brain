# Second Brain — AI Knowledge System

A premium AI-powered personal knowledge base built with **Next.js 16**, **Supabase**, and **Google Gemini AI**. Capture ideas, links, and insights — AI auto-summarizes, tags, and categorizes everything.

![Neobrutalism Design](https://img.shields.io/badge/Design-Neobrutalism-ff6b35?style=for-the-badge)
![Next.js 16](https://img.shields.io/badge/Next.js-16-000?style=for-the-badge)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6?style=for-the-badge)

## Features

- **AI-Powered Capture** — Drop any idea, link, or insight. Gemini AI generates a detailed summary, smart tags, and a category automatically.
- **Conversational Brain Query** — Ask your knowledge base questions in natural language. AI finds answers and cites sources from your notes.
- **Smart Filtering** — Filter by type (notes, links, insights), by AI-generated tags, or search full-text across everything.
- **Neobrutalism UI** — Bold borders, hard shadows, vibrant colors, ruled-paper login, and smooth Framer Motion animations.
- **Auth & Security** — Email/password authentication via Supabase Auth with SSR cookie sessions and proxy middleware.
- **Embeddable Widget** — A standalone `/widget` page with Browse and Ask modes for embedding your brain anywhere.
- **Responsive** — Mobile-first design with fullscreen modals, floating FABs, and adaptive layouts.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, Turbopack, Server Actions) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS v4 + custom neobrutalism design system |
| Animation | Framer Motion + Lenis smooth scroll |
| Database | Supabase (PostgreSQL + Auth + SSR) |
| AI | Google Gemini 2.0 Flash |
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
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — sign up, and start capturing ideas.

## Project Structure

```
src/
├── app/
│   ├── page.tsx              # Dashboard (server component)
│   ├── login/page.tsx        # Auth page (ruled-paper background)
│   ├── widget/page.tsx       # Embeddable widget
│   ├── actions.ts            # Server actions (CRUD, AI, auth)
│   ├── api/public/brain/     # Public API for widget
│   └── lib/                  # Supabase clients, types, utils
├── components/
│   ├── dashboard.tsx         # Main dashboard orchestrator
│   ├── capture-modal.tsx     # AI-powered capture form
│   ├── brain-query.tsx       # Conversational AI chatbot
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
