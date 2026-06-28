-- LinkedIn Profile Optimizer Tables

CREATE TABLE linkedin_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT 'Untitled Profile',
    basic_info JSONB DEFAULT '{}'::jsonb,
    headline TEXT DEFAULT '',
    about TEXT DEFAULT '',
    experience JSONB DEFAULT '[]'::jsonb,
    education JSONB DEFAULT '[]'::jsonb,
    projects JSONB DEFAULT '[]'::jsonb,
    skills JSONB DEFAULT '[]'::jsonb,
    certifications JSONB DEFAULT '[]'::jsonb,
    recommendations JSONB DEFAULT '[]'::jsonb,
    custom_url TEXT DEFAULT '',
    profile_score INT DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_linkedin_user_id ON linkedin_profiles(user_id);

ALTER TABLE linkedin_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own linkedin profiles" 
    ON linkedin_profiles 
    FOR ALL 
    USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all linkedin profiles" 
    ON linkedin_profiles 
    FOR SELECT 
    USING (EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid()));
