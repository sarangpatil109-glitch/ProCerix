CREATE TABLE system_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO system_settings (key, value, category, description) VALUES
('general_platform_name', '"ProCerix"', 'General', 'Platform Name'),
('general_tagline', '"Advanced Agentic Learning"', 'General', 'Tagline'),
('general_support_email', '"support@procerix.com"', 'General', 'Support Email'),
('business_certificate_price', '49.99', 'Business', 'Certificate Price'),
('business_internship_price', '99.99', 'Business', 'Internship Price'),
('business_currency', '"USD"', 'Business', 'Currency'),
('certificate_org_name', '"ProCerix Institute"', 'Certificate', 'Organization Name'),
('certificate_prefix', '"PCX-"', 'Certificate', 'Certificate Prefix'),
('certificate_verification_url', '"https://procerix.com/verify"', 'Certificate', 'Verification URL'),
('ai_default_provider', '"openai"', 'AI', 'Default AI Provider'),
('ai_generation_enabled', 'true', 'AI', 'AI Generation Enabled'),
('ai_auto_publish', 'false', 'AI', 'Auto Publish AI Courses'),
('payment_cashfree_mode', '"sandbox"', 'Payments', 'Cashfree Mode'),
('seo_default_title', '"ProCerix - Best Online Courses"', 'SEO', 'Default Meta Title')
ON CONFLICT (key) DO NOTHING;

-- Trigger to update timestamp
CREATE OR REPLACE FUNCTION update_system_settings_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_system_settings
BEFORE UPDATE ON system_settings
FOR EACH ROW EXECUTE FUNCTION update_system_settings_timestamp();
