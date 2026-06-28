-- Resume Builder Tables

CREATE TABLE resumes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT 'Untitled Resume',
    template_id TEXT NOT NULL DEFAULT 'modern',
    personal_details JSONB DEFAULT '{}'::jsonb,
    education JSONB DEFAULT '[]'::jsonb,
    experience JSONB DEFAULT '[]'::jsonb,
    projects JSONB DEFAULT '[]'::jsonb,
    skills JSONB DEFAULT '[]'::jsonb,
    certifications JSONB DEFAULT '[]'::jsonb,
    languages JSONB DEFAULT '[]'::jsonb,
    ats_score INT DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_resumes_user_id ON resumes(user_id);

ALTER TABLE resumes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own resumes" 
    ON resumes 
    FOR ALL 
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all resumes" 
    ON resumes 
    FOR SELECT 
    USING (EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid()));

-- Insert seed templates into settings (configuration-driven)
INSERT INTO settings (key, value)
VALUES (
    'resume_templates',
    '[
        {"id": "modern", "name": "Modern", "active": true},
        {"id": "minimal", "name": "Minimal", "active": true},
        {"id": "professional", "name": "Professional", "active": true},
        {"id": "corporate", "name": "Corporate", "active": true},
        {"id": "fresher", "name": "Fresher", "active": true},
        {"id": "pm", "name": "Product Manager", "active": true},
        {"id": "swe", "name": "Software Engineer", "active": true},
        {"id": "data", "name": "Data Analyst", "active": true},
        {"id": "marketing", "name": "Marketing", "active": true},
        {"id": "fintech", "name": "FinTech", "active": true}
    ]'::jsonb
) ON CONFLICT (key) DO NOTHING;
