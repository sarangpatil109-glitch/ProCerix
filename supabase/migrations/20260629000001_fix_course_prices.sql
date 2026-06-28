-- Fix legacy USD prices to correct INR prices from the product registry.
-- course_type column was added in 20260628190757_course_search.sql with DEFAULT 'certificate'.
UPDATE courses SET price = 99   WHERE course_type = 'certificate' AND deleted_at IS NULL;
UPDATE courses SET price = 249  WHERE course_type = 'internship'  AND deleted_at IS NULL;
UPDATE courses SET price = 49   WHERE course_type = 'resume'      AND deleted_at IS NULL;
UPDATE courses SET price = 49   WHERE course_type = 'linkedin'    AND deleted_at IS NULL;
UPDATE courses SET price = 999  WHERE course_type = 'hr'          AND deleted_at IS NULL;

-- Also fix the default currency column (was 'USD' from init)
ALTER TABLE payments ALTER COLUMN currency SET DEFAULT 'INR';
