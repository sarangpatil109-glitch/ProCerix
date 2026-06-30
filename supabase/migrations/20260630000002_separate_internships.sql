-- ============================================================
-- Separate internships from courses table
-- ============================================================

-- 1. Make company_name nullable (AI generation doesn't supply it)
ALTER TABLE public.internships
  ALTER COLUMN company_name DROP NOT NULL;

-- 2. Add slug for URL routing
ALTER TABLE public.internships
  ADD COLUMN IF NOT EXISTS slug TEXT;

-- 3. Add category for search/filter
ALTER TABLE public.internships
  ADD COLUMN IF NOT EXISTS category TEXT;

-- 4. Add thumbnail_url for display
ALTER TABLE public.internships
  ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;

-- 5. Migrate all internship rows from courses → internships
--    Only copy rows that don't already exist by slug (idempotent)
INSERT INTO public.internships (
  title, slug, description, price, original_price,
  is_published, company_name, category, created_at, updated_at
)
SELECT
  c.title,
  c.slug,
  c.description,
  COALESCE(c.price, 249),
  COALESCE(c.original_price, 2499),
  c.is_published,
  'ProCerix',
  c.category,
  c.created_at,
  c.updated_at
FROM public.courses c
WHERE c.course_type = 'internship'
  AND c.deleted_at IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.internships i WHERE i.slug = c.slug
  );

-- 6. Delete migrated internship rows from courses
--    Cascade will clean up learning_modules, lessons, etc.
DELETE FROM public.courses WHERE course_type = 'internship';

-- 7. Create unique index on slug
CREATE UNIQUE INDEX IF NOT EXISTS internships_slug_key
  ON public.internships (slug)
  WHERE slug IS NOT NULL;
