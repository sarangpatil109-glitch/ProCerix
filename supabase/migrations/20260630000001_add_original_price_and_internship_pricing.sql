-- Ensure courses.original_price has a default value of 0
-- (the column was added in 20260629000003 without a DEFAULT)
ALTER TABLE public.courses
  ALTER COLUMN original_price SET DEFAULT 0;

-- Update any NULL original_price rows to 0
UPDATE public.courses SET original_price = 0 WHERE original_price IS NULL;

-- Add pricing and publishing columns to internships table
ALTER TABLE public.internships
  ADD COLUMN IF NOT EXISTS price NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS original_price NUMERIC NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_published BOOLEAN NOT NULL DEFAULT false;
