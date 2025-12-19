-- Fix for missing 'id' column in crawls table
-- Run this in Supabase SQL Editor

-- Drop existing tables if they exist (WARNING: This will delete all data!)
-- Comment out these lines if you want to preserve existing data
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS pages CASCADE;
DROP TABLE IF EXISTS chats CASCADE;
DROP TABLE IF EXISTS crawls CASCADE;

-- Recreate tables with correct schema
CREATE TABLE crawls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    page_count INTEGER DEFAULT 0
);

CREATE TABLE chats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    crawl_id UUID NOT NULL REFERENCES crawls(id) ON DELETE CASCADE,
    summary TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'ai', 'assistant')),
    content TEXT NOT NULL,
    sources JSONB DEFAULT '[]',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE pages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    crawl_id UUID NOT NULL REFERENCES crawls(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    title TEXT,
    parent_id UUID REFERENCES pages(id) ON DELETE CASCADE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(crawl_id, url)
);

-- Create indexes for better performance
CREATE INDEX idx_chats_crawl_id ON chats(crawl_id);
CREATE INDEX idx_messages_chat_id ON messages(chat_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);
CREATE INDEX idx_pages_crawl_id ON pages(crawl_id);
CREATE INDEX idx_pages_parent_id ON pages(parent_id);
