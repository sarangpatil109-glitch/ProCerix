-- Extended LMS fields for full CMS functionality

-- Extend courses table
ALTER TABLE courses ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'English';
ALTER TABLE courses ADD COLUMN IF NOT EXISTS banner_url TEXT;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS short_description TEXT;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS long_description TEXT;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS is_trending BOOLEAN DEFAULT false;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS keywords TEXT[];
ALTER TABLE courses ADD COLUMN IF NOT EXISTS supervisor_name TEXT;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS lms_status TEXT DEFAULT 'draft';
ALTER TABLE courses ADD COLUMN IF NOT EXISTS scheduled_publish_at TIMESTAMPTZ;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS passing_percentage INTEGER DEFAULT 70;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS auto_issue_certificate BOOLEAN DEFAULT true;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS qr_verification BOOLEAN DEFAULT true;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS assignment_required BOOLEAN DEFAULT false;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS project_submission_required BOOLEAN DEFAULT false;

-- Extend questions table (explanation may already exist from migration 8)
ALTER TABLE questions ADD COLUMN IF NOT EXISTS explanation TEXT;
ALTER TABLE questions ADD COLUMN IF NOT EXISTS difficulty TEXT DEFAULT 'medium';

-- LMS Categories
CREATE TABLE IF NOT EXISTS lms_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT DEFAULT '📚',
  color TEXT DEFAULT '#3B82F6',
  is_active BOOLEAN DEFAULT true,
  sequence_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Media Library
CREATE TABLE IF NOT EXISTS media_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'image',
  size_bytes INTEGER,
  mime_type TEXT,
  alt_text TEXT,
  folder TEXT DEFAULT 'general',
  tags TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- LMS Templates
CREATE TABLE IF NOT EXISTS lms_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'certificate',
  content TEXT NOT NULL DEFAULT '',
  variables JSONB DEFAULT '[]',
  preview_url TEXT,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Default categories
INSERT INTO lms_categories (name, slug, icon, color, sequence_order) VALUES
  ('Technology', 'technology', '💻', '#3B82F6', 1),
  ('Data Science', 'data-science', '📊', '#8B5CF6', 2),
  ('Marketing', 'marketing', '📢', '#EC4899', 3),
  ('Finance', 'finance', '💰', '#10B981', 4),
  ('Design', 'design', '🎨', '#F59E0B', 5),
  ('Business', 'business', '🏢', '#6366F1', 6)
ON CONFLICT (slug) DO NOTHING;

-- Default templates
INSERT INTO lms_templates (name, type, content, is_default) VALUES
  ('Default Certificate', 'certificate', 'This is to certify that {{student_name}} has successfully completed the {{course_name}} course on {{completion_date}}.', true),
  ('Offer Letter', 'offer_letter', 'Dear {{student_name}}, We are pleased to offer you a Virtual Internship at {{company_name}} for the position of {{internship_title}}.', true),
  ('Completion Letter', 'completion_letter', 'Dear {{student_name}}, This is to certify that you have successfully completed your Virtual Internship at {{company_name}}.', true)
ON CONFLICT DO NOTHING;

-- Storage bucket for media (if not exists)
INSERT INTO storage.buckets (id, name, public) VALUES ('lms-media', 'lms-media', true) ON CONFLICT (id) DO NOTHING;

-- RLS for media library (admin only)
ALTER TABLE media_library ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin can manage media" ON media_library FOR ALL USING (true);

ALTER TABLE lms_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read categories" ON lms_categories FOR SELECT USING (true);
CREATE POLICY "Admin can manage categories" ON lms_categories FOR ALL USING (true);

ALTER TABLE lms_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admin can manage templates" ON lms_templates FOR ALL USING (true);
