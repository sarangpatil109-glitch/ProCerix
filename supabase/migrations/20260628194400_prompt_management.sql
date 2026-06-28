CREATE TABLE prompt_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE prompt_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES prompt_templates(id) ON DELETE CASCADE,
    version_number INT NOT NULL,
    content TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure only one active version per template
CREATE UNIQUE INDEX idx_active_prompt_version ON prompt_versions (template_id) WHERE is_active = true;

-- Insert defaults
INSERT INTO prompt_templates (id, name, type, description) VALUES
('11111111-1111-1111-1111-111111111111', 'Core Certificate Prompt', 'certificate', 'Generates standard skill certificates'),
('22222222-2222-2222-2222-222222222222', 'Core Internship Prompt', 'internship', 'Generates virtual internships with tasks')
ON CONFLICT (name) DO NOTHING;

INSERT INTO prompt_versions (template_id, version_number, content, is_active) VALUES
(
  '11111111-1111-1111-1111-111111111111', 
  1, 
  'Generate a comprehensive, production-ready curriculum for a {{course_type}} on the topic: "{{skill}}".\n\nRequirements:\n- Title: Professional, engaging title for the {{course_type}}.\n- Description: Detailed overview explaining what the student will learn.\n- Modules: {{module_count}} modules.\n- Lessons: {{lesson_count}} total lessons distributed evenly across the modules.\n- MCQs: Exactly {{mcq_count}} multiple-choice questions for the final assessment.\n\nConstraints:\n- The content must be highly technical, accurate, and structured.\n- Do not include any filler text.\n- Return ONLY a valid JSON object matching the requested schema.', 
  true
),
(
  '22222222-2222-2222-2222-222222222222', 
  1, 
  'Generate a comprehensive, production-ready curriculum for a {{course_type}} on the topic: "{{skill}}".\n\nRequirements:\n- Title: Professional, engaging title for the {{course_type}}.\n- Description: Detailed overview explaining what the student will learn.\n- Modules: {{module_count}} modules.\n- Lessons: {{lesson_count}} total lessons distributed evenly across the modules.\n- Tasks: Exactly {{task_count}} practical, real-world tasks for the internship.\n- MCQs: Exactly {{mcq_count}} multiple-choice questions for the final assessment.\n\nConstraints:\n- The content must be highly technical, accurate, and structured.\n- Do not include any filler text.\n- Return ONLY a valid JSON object matching the requested schema.', 
  true
);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_prompt_templates_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_prompt_templates
BEFORE UPDATE ON prompt_templates
FOR EACH ROW EXECUTE FUNCTION update_prompt_templates_timestamp();
