-- ============================================================
-- Replace video-based learning with article-based learning.
-- Adds reading_time to lessons; video_url kept for backward
-- compatibility with any existing data but is no longer used.
-- ============================================================

ALTER TABLE lessons
  ADD COLUMN IF NOT EXISTS estimated_reading_time INTEGER DEFAULT 5,
  ADD COLUMN IF NOT EXISTS is_article             BOOLEAN DEFAULT true;

COMMENT ON COLUMN lessons.video_url IS 'DEPRECATED: platform uses article-based learning. Column retained for data safety only.';
COMMENT ON COLUMN lessons.estimated_reading_time IS 'Estimated read time in minutes shown to learners.';
