-- =============================================
-- Second Brain — Supabase Database Setup
-- =============================================
-- Run this SQL in the Supabase SQL Editor:
-- https://supabase.com/dashboard → SQL Editor → New Query
-- =============================================

-- 1. Create the brain_items table
CREATE TABLE IF NOT EXISTS brain_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'note' CHECK (type IN ('note', 'link', 'insight')),
  tags TEXT[] DEFAULT '{}',
  ai_summary TEXT,
  ai_tags TEXT[] DEFAULT '{}',
  ai_category TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- If you already have the table, run this to add the new column:
-- ALTER TABLE brain_items ADD COLUMN IF NOT EXISTS ai_category TEXT;

-- 2. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_brain_items_user_id ON brain_items(user_id);
CREATE INDEX IF NOT EXISTS idx_brain_items_type ON brain_items(type);
CREATE INDEX IF NOT EXISTS idx_brain_items_created_at ON brain_items(created_at DESC);

-- 3. Enable Row Level Security
ALTER TABLE brain_items ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies — users can only access their own data
CREATE POLICY "Users can view their own items"
  ON brain_items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own items"
  ON brain_items FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own items"
  ON brain_items FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own items"
  ON brain_items FOR DELETE
  USING (auth.uid() = user_id);

-- 5. Public read policy for the API route (optional — remove if you want private only)
-- This allows the public API to read items. For stricter security, use a service role key instead.
CREATE POLICY "Public can read items for API"
  ON brain_items FOR SELECT
  USING (true);

-- 6. Auto-update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_brain_items_updated_at
  BEFORE UPDATE ON brain_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
