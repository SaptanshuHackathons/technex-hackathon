-- Alternative fix: Migrate existing data (if crawls table exists without 'id' column)
-- Run this in Supabase SQL Editor

-- First, check if crawls table exists and what columns it has
-- You can run: SELECT column_name FROM information_schema.columns WHERE table_name = 'crawls';

-- If crawls table exists but doesn't have 'id' column, we need to:
-- 1. Create a new table with correct schema
-- 2. Migrate data
-- 3. Drop old table and rename new one

-- Step 1: Create new table with correct schema
CREATE TABLE crawls_new (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    page_count INTEGER DEFAULT 0
);

-- Step 2: If you have data in old crawls table, copy it
-- (Uncomment and modify based on your actual column names)
-- INSERT INTO crawls_new (url, created_at, page_count)
-- SELECT url, created_at, page_count FROM crawls;

-- Step 3: Drop old table and rename
DROP TABLE IF EXISTS crawls CASCADE;
ALTER TABLE crawls_new RENAME TO crawls;

-- Now recreate dependent tables
CREATE TABLE IF NOT EXISTS chats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    crawl_id UUID NOT NULL REFERENCES crawls(id) ON DELETE CASCADE,
    summary TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'ai', 'assistant')),
    content TEXT NOT NULL,
    sources JSONB DEFAULT '[]',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    crawl_id UUID NOT NULL REFERENCES crawls(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    title TEXT,
    parent_id UUID REFERENCES pages(id) ON DELETE CASCADE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(crawl_id, url)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_chats_crawl_id ON chats(crawl_id);
CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_pages_crawl_id ON pages(crawl_id);
CREATE INDEX IF NOT EXISTS idx_pages_parent_id ON pages(parent_id);
