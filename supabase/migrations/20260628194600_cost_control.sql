CREATE TABLE ai_cost_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    generation_request_id UUID REFERENCES course_generation_requests(id),
    skill_name TEXT NOT NULL,
    provider TEXT NOT NULL,
    prompt_tokens INT NOT NULL DEFAULT 0,
    completion_tokens INT NOT NULL DEFAULT 0,
    estimated_cost_usd DECIMAL(10, 4) NOT NULL DEFAULT 0,
    generation_time_ms INT NOT NULL DEFAULT 0,
    was_reused BOOLEAN NOT NULL DEFAULT false,
    reused_course_id UUID REFERENCES courses(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE ai_governance_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL
);

INSERT INTO ai_governance_settings (key, value) VALUES
('generation_paused', 'false');
