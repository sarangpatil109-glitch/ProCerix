-- LMS CMS: add explanation to MCQs, add certificate & internship-specific fields

ALTER TABLE questions ADD COLUMN IF NOT EXISTS explanation TEXT;

-- Certificate-specific fields on courses
ALTER TABLE courses ADD COLUMN IF NOT EXISTS validity_period TEXT DEFAULT 'lifetime';
ALTER TABLE courses ADD COLUMN IF NOT EXISTS badge_url TEXT;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS certificate_template TEXT DEFAULT 'default';

-- Internship-specific fields on courses
ALTER TABLE courses ADD COLUMN IF NOT EXISTS company_name TEXT;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS offer_letter_template TEXT;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS completion_letter_template TEXT;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS internship_letter_template TEXT;
