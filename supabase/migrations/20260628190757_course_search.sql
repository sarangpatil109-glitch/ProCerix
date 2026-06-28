-- Add new columns for enhanced filtering
ALTER TABLE courses ADD COLUMN IF NOT EXISTS course_type TEXT DEFAULT 'certificate';
ALTER TABLE courses ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS duration_minutes INT;

-- Add Full Text Search column and index
ALTER TABLE courses ADD COLUMN IF NOT EXISTS fts tsvector GENERATED ALWAYS AS (to_tsvector('english', title || ' ' || coalesce(description, ''))) STORED;

CREATE INDEX IF NOT EXISTS courses_fts_idx ON courses USING GIN (fts);
