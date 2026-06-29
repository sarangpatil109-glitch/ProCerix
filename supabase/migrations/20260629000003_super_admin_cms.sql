-- Create site_settings table
CREATE TABLE IF NOT EXISTS public.site_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    logo TEXT,
    favicon TEXT,
    site_name TEXT NOT NULL DEFAULT 'ProCerix',
    primary_color TEXT DEFAULT '#0f172a',
    secondary_color TEXT DEFAULT '#3b82f6',
    contact_email TEXT,
    contact_phone TEXT,
    footer_text TEXT,
    facebook TEXT,
    instagram TEXT,
    linkedin TEXT,
    youtube TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure only one row exists for site_settings (singleton pattern)
CREATE UNIQUE INDEX site_settings_single_row ON public.site_settings((1));

-- Create homepage_sections table
CREATE TABLE IF NOT EXISTS public.homepage_sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hero_title TEXT,
    hero_subtitle TEXT,
    hero_image TEXT,
    hero_cta TEXT,
    stats JSONB,
    features JSONB,
    testimonials JSONB,
    faq JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure only one row exists for homepage_sections
CREATE UNIQUE INDEX homepage_sections_single_row ON public.homepage_sections((1));

-- Create banners table
CREATE TABLE IF NOT EXISTS public.banners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    subtitle TEXT,
    button_text TEXT,
    image_url TEXT,
    link_url TEXT,
    priority INTEGER DEFAULT 0,
    is_published BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Alter courses table
ALTER TABLE public.courses
ADD COLUMN IF NOT EXISTS original_price NUMERIC,
ADD COLUMN IF NOT EXISTS discount NUMERIC,
ADD COLUMN IF NOT EXISTS thumbnail TEXT,
ADD COLUMN IF NOT EXISTS duration TEXT,
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS tags TEXT[];

-- Create coupons table
CREATE TABLE IF NOT EXISTS public.coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    discount_amount NUMERIC NOT NULL,
    is_percentage BOOLEAN DEFAULT false,
    expiry_date TIMESTAMP WITH TIME ZONE,
    usage_limit INTEGER,
    usage_count INTEGER DEFAULT 0,
    min_amount NUMERIC DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create certificate_settings table
CREATE TABLE IF NOT EXISTS public.certificate_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prefix TEXT DEFAULT 'PROCERIX',
    logo_url TEXT,
    signature_url TEXT,
    background_url TEXT,
    qr_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE UNIQUE INDEX certificate_settings_single_row ON public.certificate_settings((1));

-- Create posts (Blog) table
CREATE TABLE IF NOT EXISTS public.posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    content TEXT,
    excerpt TEXT,
    thumbnail TEXT,
    is_published BOOLEAN DEFAULT false,
    author_id UUID REFERENCES public.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Alter profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT false;


-- RLS Policies

-- Enable RLS
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homepage_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificate_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- Create admin check function (if it doesn't exist)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.admin_users WHERE id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Site Settings
CREATE POLICY "Allow public read of site_settings" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "Allow admin all on site_settings" ON public.site_settings FOR ALL USING (public.is_admin());

-- Homepage Sections
CREATE POLICY "Allow public read of homepage_sections" ON public.homepage_sections FOR SELECT USING (true);
CREATE POLICY "Allow admin all on homepage_sections" ON public.homepage_sections FOR ALL USING (public.is_admin());

-- Banners
CREATE POLICY "Allow public read of published banners" ON public.banners FOR SELECT USING (is_published = true);
CREATE POLICY "Allow admin all on banners" ON public.banners FOR ALL USING (public.is_admin());

-- Coupons
CREATE POLICY "Allow admin all on coupons" ON public.coupons FOR ALL USING (public.is_admin());

-- Certificate Settings
CREATE POLICY "Allow public read of certificate_settings" ON public.certificate_settings FOR SELECT USING (true);
CREATE POLICY "Allow admin all on certificate_settings" ON public.certificate_settings FOR ALL USING (public.is_admin());

-- Posts
CREATE POLICY "Allow public read of published posts" ON public.posts FOR SELECT USING (is_published = true);
CREATE POLICY "Allow admin all on posts" ON public.posts FOR ALL USING (public.is_admin());

-- Courses (Ensure admin has all rights, public has read-only. Existing policies might already exist, so just adding admin policy just in case)
CREATE POLICY "Allow admin all on courses" ON public.courses FOR ALL USING (public.is_admin());
