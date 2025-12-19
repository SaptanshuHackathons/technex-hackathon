-- Migration: Add deep scraping support
-- Description: Adds status tracking and depth management for recursive link crawling
-- Date: 2025-12-19

-- Add columns to crawls table for tracking scraping progress
ALTER TABLE crawls 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'completed' 
    CHECK (status IN ('queued', 'scraping', 'indexing', 'completed', 'failed', 'cancelled'));

ALTER TABLE crawls 
ADD COLUMN IF NOT EXISTS current_depth INTEGER DEFAULT 0;

ALTER TABLE crawls 
ADD COLUMN IF NOT EXISTS total_links_found INTEGER DEFAULT 0;

ALTER TABLE crawls 
ADD COLUMN IF NOT EXISTS max_depth INTEGER DEFAULT 1;

-- Add index for efficient status queries
CREATE INDEX IF NOT EXISTS idx_crawls_status ON crawls(status);

-- Add index for efficient pending page queries using JSONB metadata
-- This allows us to quickly find pages that need to be scraped
CREATE INDEX IF NOT EXISTS idx_pages_crawl_status 
ON pages(crawl_id, ((metadata->>'status')));

-- Add index for depth queries
CREATE INDEX IF NOT EXISTS idx_pages_depth 
ON pages(((metadata->>'depth')::INTEGER));

-- Comment on new columns
COMMENT ON COLUMN crawls.status IS 'Current status of the crawling process';
COMMENT ON COLUMN crawls.current_depth IS 'Current depth level being processed (0 = initial page)';
COMMENT ON COLUMN crawls.total_links_found IS 'Total number of unique links discovered';
COMMENT ON COLUMN crawls.max_depth IS 'Maximum depth to crawl (1 = initial page only, 2 = initial + linked pages, etc.)';
