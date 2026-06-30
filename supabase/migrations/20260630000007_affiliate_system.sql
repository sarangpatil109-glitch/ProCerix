-- Affiliate Applications
CREATE TABLE IF NOT EXISTS affiliate_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  college_name TEXT,
  designation TEXT,
  phone TEXT NOT NULL,
  experience TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- Affiliate Profiles (created on approval)
CREATE TABLE IF NOT EXISTS affiliate_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  application_id UUID REFERENCES affiliate_applications(id),
  name TEXT NOT NULL,
  email TEXT,
  coupon_code TEXT UNIQUE NOT NULL,
  commission_percentage NUMERIC(5,2) NOT NULL DEFAULT 50,
  discount_type TEXT NOT NULL DEFAULT 'percentage' CHECK (discount_type IN ('percentage', 'flat')),
  discount_value NUMERIC(10,2) NOT NULL DEFAULT 10,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  total_clicks INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- Affiliate Clicks
CREATE TABLE IF NOT EXISTS affiliate_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID NOT NULL REFERENCES affiliate_profiles(id) ON DELETE CASCADE,
  coupon_code TEXT NOT NULL,
  landing_page TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Affiliate Sales (commission records)
CREATE TABLE IF NOT EXISTS affiliate_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID NOT NULL REFERENCES affiliate_profiles(id) ON DELETE CASCADE,
  payment_id UUID,
  order_id TEXT,
  student_id UUID,
  coupon_code TEXT NOT NULL,
  product_type TEXT DEFAULT 'certificate',
  purchase_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  discount_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  final_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  commission_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  commission_paid BOOLEAN DEFAULT false,
  payment_status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Affiliate Withdraw Requests
CREATE TABLE IF NOT EXISTS affiliate_withdraw_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID NOT NULL REFERENCES affiliate_profiles(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  upi_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'rejected')),
  payment_reference TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Affiliate Settings (singleton row)
CREATE TABLE IF NOT EXISTS affiliate_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  default_commission_percentage NUMERIC(5,2) NOT NULL DEFAULT 50,
  default_discount_type TEXT NOT NULL DEFAULT 'percentage',
  default_discount_value NUMERIC(10,2) NOT NULL DEFAULT 10,
  minimum_withdrawal NUMERIC(10,2) NOT NULL DEFAULT 500,
  coupon_expiry_days INTEGER,
  coupon_usage_limit INTEGER,
  auto_approve BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO affiliate_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_affiliate_applications_user_id ON affiliate_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_applications_status ON affiliate_applications(status);
CREATE INDEX IF NOT EXISTS idx_affiliate_profiles_user_id ON affiliate_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_profiles_coupon ON affiliate_profiles(coupon_code);
CREATE INDEX IF NOT EXISTS idx_affiliate_sales_affiliate_id ON affiliate_sales(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_withdraw_affiliate_id ON affiliate_withdraw_requests(affiliate_id);
