# 🧠 Second Brain — AI-Powered Knowledge Management

> **Capture ideas instantly. Let AI organize them for you.**

 **Check it out here:** (https://second-brain-notes-ai.vercel.app/)

Second Brain is a modern, AI-powered personal knowledge management system built with **Next.js 16**, **Supabase**, and **Google Gemini AI**. It features a distinctive **neobrutalist design**, automatic AI-generated summaries/tags/categories, and a public API + embeddable widget.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8?logo=tailwindcss)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ecf8e?logo=supabase)
![Gemini AI](https://img.shields.io/badge/Gemini-2.0_Flash-4285f4?logo=google)

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| **AI Auto-Tagging** | Gemini AI generates tags, categories, and summaries for every capture |
| **Multiple Content Types** | Note, Article, Insight, Link, or custom types |
| **File Upload** | Drag-and-drop support for `.txt`, `.md`, `.csv`, `.json`, `.pdf` |
| **Smart Summarization** | AI extracts key points across the entire content — not just the first paragraph |
| **Command Palette** | `Ctrl+K` for instant search and quick actions |
| **Keyboard Shortcuts** | `N` (new capture), `U` (upload), `Esc` (close) |
| **Public REST API** | JSON API at `/api/public/brain/query` with CORS support |
| **Embeddable Widget** | Iframe-ready widget at `/widget?user_id=UUID` |
| **Graceful Degradation** | Offline fallbacks when AI quota is exhausted |
| **Neobrutalist UI** | Bold borders, chunky shadows, vibrant accents |

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** ≥ 18.x
- **npm** or **pnpm**
- A **Supabase** project (free tier works)
- A **Google Gemini API** key (free tier: 15 RPM)

### 1. Clone & Install

```bash
git clone https://github.com/your-username/second-brain.git
cd second-brain
npm install
```

### 2. Environment Variables

Create a `.env.local` file in the project root:

```env
# ─── Supabase ──────────────────────────────────
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# ─── Google Gemini AI ──────────────────────────
GEMINI_API_KEY=your_gemini_api_key
```

<details>
<summary><strong>📋 How to get these keys</strong></summary>

#### Supabase
1. Go to [supabase.com](https://supabase.com) → Create a new project
2. Go to **Settings → API** → Copy the `URL` and `anon` key
3. Run the SQL below in the **SQL Editor** to create the table

#### Gemini API
1. Go to [aistudio.google.com](https://aistudio.google.com/apikey)
2. Click **"Create API Key"**
3. Copy the key into your `.env.local`

</details>

### 3. Database Setup

Run this SQL in your Supabase **SQL Editor**:

```sql
-- Brain items table
CREATE TABLE brain_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT DEFAULT 'note',
  tags TEXT[] DEFAULT '{}',
  ai_summary TEXT,
  ai_tags TEXT[] DEFAULT '{}',
  ai_category TEXT,
  file_name TEXT,
  file_type TEXT,
  file_size INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE brain_items ENABLE ROW LEVEL SECURITY;

-- Users can only access their own items
CREATE POLICY "Users can read own items"
  ON brain_items FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own items"
  ON brain_items FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own items"
  ON brain_items FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own items"
  ON brain_items FOR DELETE USING (auth.uid() = user_id);

-- Public read access for the widget/API (optional)
CREATE POLICY "Public can read items"
  ON brain_items FOR SELECT USING (true);

-- Index for faster queries
CREATE INDEX idx_brain_items_user_id ON brain_items(user_id);
CREATE INDEX idx_brain_items_type ON brain_items(type);
CREATE INDEX idx_brain_items_created_at ON brain_items(created_at DESC);
```

### 4. Supabase Auth Setup

1. In Supabase Dashboard → **Authentication → Providers**
2. Enable **Email** provider (or Google/GitHub OAuth)
3. Set the **Site URL** to `http://localhost:3000`
4. Add `http://localhost:3000/auth/callback` to **Redirect URLs**

### 5. Run the App

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — sign up, and start capturing!

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────┐
│              PRESENTATION LAYER                   │
│  React 19 + Tailwind 4 + Framer Motion           │
│  Components: Dashboard, Cards, Modals, Palette   │
├──────────────────────────────────────────────────┤
│              APPLICATION LAYER                    │
│  Next.js 16 Server Actions (actions.ts)          │
│  Auth middleware at the edge                      │
├──────────────────────────────────────────────────┤
│                 AI LAYER                          │
│  Google Gemini 2.0 Flash (ai-service.ts)         │
│  Summarization · Tagging · Categorization        │
├──────────────────────────────────────────────────┤
│                DATA LAYER                         │
│  Supabase (PostgreSQL + Row Level Security)      │
│  Auth via Supabase SSR                            │
├──────────────────────────────────────────────────┤
│            INFRASTRUCTURE LAYER                   │
│  Vercel Edge Network · CDN-cached API            │
└──────────────────────────────────────────────────┘
```

> Every layer is **independently swappable**. See [`docs.md`](docs.md) for detailed architecture documentation.

### Project Structure

```
src/
├── app/
│   ├── page.tsx                  # Main dashboard (Server Component)
│   ├── actions.ts                # Server Actions (CRUD, file upload)
│   ├── layout.tsx                # Root layout with smooth scroll
│   ├── globals.css               # Neobrutalist theme & variables
│   ├── api/public/brain/query/
│   │   └── route.ts              # Public REST API endpoint
│   ├── auth/callback/
│   │   └── route.ts              # OAuth callback handler
│   ├── lib/
│   │   ├── ai-service.ts         # Gemini AI: summaries, tags, categories
│   │   ├── supabase.ts           # Supabase browser client
│   │   ├── supabase-server.ts    # Supabase server client
│   │   ├── supabase-middleware.ts # Auth middleware
│   │   ├── types.ts              # TypeScript interfaces
│   │   └── utils.ts              # Helpers (cn, formatDate, truncate)
│   ├── login/
│   │   └── page.tsx              # Login page
│   └── widget/
│       ├── layout.tsx            # Widget layout (minimal)
│       └── page.tsx              # Embeddable widget
├── components/
│   ├── capture-modal.tsx         # New capture dialog (with custom types)
│   ├── command-palette.tsx       # Ctrl+K command palette
│   ├── dashboard.tsx             # Main dashboard with filters
│   ├── detail-view.tsx           # Item preview with edit/copy/delete
│   ├── file-upload-modal.tsx     # Drag-and-drop file uploader
│   ├── note-card.tsx             # Brain item card
│   ├── profile-popup.tsx         # User profile dropdown
│   ├── search-bar.tsx            # Search input
│   ├── smooth-scroll.tsx         # Lenis smooth scroll (dialog-aware)
│   └── ui/                       # Radix + Tailwind primitives
│       ├── button.tsx
│       ├── dialog.tsx
│       ├── input.tsx
│       ├── label.tsx
│       ├── select.tsx
│       ├── skeleton.tsx
│       └── textarea.tsx
└── proxy.ts                      # Middleware config
```

---

## 🔌 API Reference

### Public Query Endpoint

```
GET /api/public/brain/query
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `user_id` | `string` | — | Filter by user UUID |
| `search` | `string` | — | Full-text search across title, content, summary |
| `limit` | `number` | `10` | Max results (capped at 50) |

**Example Response:**

```json
{
  "count": 2,
  "items": [
    {
      "id": "uuid",
      "title": "React Server Components",
      "type": "article",
      "ai_summary": "Explores how RSC changes data fetching patterns...",
      "ai_tags": ["react", "server-components", "web-development"],
      "ai_category": "Technology",
      "created_at": "2026-02-13T10:30:00Z"
    }
  ],
  "timestamp": "2026-02-13T12:00:00Z"
}
```

### Embeddable Widget

```html
<iframe
  src="https://your-app.vercel.app/widget?user_id=YOUR_UUID"
  width="400"
  height="600"
  style="border: none; border-radius: 16px;"
></iframe>
```

---

## 🎨 Design System

Second Brain uses a **neobrutalist** design language:

| Token | Value | Usage |
|-------|-------|-------|
| `--accent` | `#ff6b35` | Primary actions, buttons, highlights |
| `--border` | `#1a1a1a` | Thick borders (2.5px) |
| `--shadow` | `#1a1a1a` | Offset drop shadows (4px) |
| `--bg` | `#f0e6d3` | Warm paper background |
| `--purple` | `#a855f7` | Categories, article type |
| `--radius` | `12px` | Rounded corners |

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl + K` | Open command palette |
| `N` | New capture |
| `U` | Upload file |
| `Esc` | Close dialog |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, Server Actions) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4 |
| Animation | Framer Motion |
| UI Primitives | Radix UI (Dialog, Select, Label) |
| Database | Supabase (PostgreSQL + Auth + RLS) |
| AI | Google Gemini 2.0 Flash |
| Smooth Scroll | Lenis |
| Command Palette | cmdk |
| Icons | Lucide React |

---

## 📄 Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase anonymous key |
| `GEMINI_API_KEY` | ✅ | Google Gemini API key |

---

## 🧩 Key Design Decisions

1. **Single AI Call** — Tags, summary, and category are generated in one prompt to save API quota
2. **Offline Fallbacks** — Keyword extraction + pattern matching when AI is unavailable
3. **Rate Limiting** — Client-side sliding window rate limiter prevents quota exhaustion
4. **Server Actions** — No separate API layer; form submissions go directly to server functions
5. **Lenis Dialog Awareness** — Smooth scroll auto-pauses when modals open, enabling native scroll in dialogs
6. **Custom Types** — Users can define their own capture types beyond the built-in note/article/insight/link

---

## 📖 Documentation

See [`docs.md`](docs.md) for detailed architecture documentation covering:

- **Portable Architecture** — Swappable components at every layer
- **Principles-Based UX** — 5 design principles for AI interactions
- **Agent Thinking** — Autonomous AI pipeline for content enrichment
- **Infrastructure Mindset** — API-first design with embeddable widgets

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push: `git push origin feature/amazing-feature`
5. Open a Pull Request

---


<p align="center">
  Made with ❤️ by <a href="https://revanthm.vercel.app/">Revanth Modalavalasa</a>
</p>