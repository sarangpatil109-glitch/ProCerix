ALTER TABLE public.courses
ADD COLUMN IF NOT EXISTS banner TEXT,
ADD COLUMN IF NOT EXISTS seo_title TEXT,
ADD COLUMN IF NOT EXISTS seo_description TEXT,
ADD COLUMN IF NOT EXISTS learning_outcomes JSONB,
ADD COLUMN IF NOT EXISTS requirements JSONB;

-- also update types if there's any need in the db schema...
