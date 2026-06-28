CREATE TYPE generation_status AS ENUM ('pending', 'queued', 'generating', 'reviewing', 'ready', 'failed');

CREATE TABLE course_generation_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    skill_name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    status generation_status NOT NULL DEFAULT 'pending',
    payment_count INT NOT NULL DEFAULT 1,
    requested_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    failed_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- For tracking multiple users waiting for the same generation to complete
CREATE TABLE generation_waitlist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    generation_id UUID NOT NULL REFERENCES course_generation_requests(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(generation_id, user_id)
);

CREATE INDEX idx_generation_slug ON course_generation_requests(slug);
CREATE INDEX idx_generation_status ON course_generation_requests(status);
