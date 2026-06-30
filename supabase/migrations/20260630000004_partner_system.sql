-- ============================================================
-- Referral Partner System
-- ============================================================

-- Partners table
CREATE TABLE IF NOT EXISTS partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  college_name TEXT,
  designation TEXT,
  email TEXT NOT NULL UNIQUE,
  phone TEXT NOT NULL,
  upi_id TEXT,
  bank_name TEXT,
  bank_account_number TEXT,
  bank_ifsc TEXT,
  referral_code TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_reason TEXT,
  commission_rate NUMERIC(5,2) DEFAULT 50,
  total_clicks INTEGER DEFAULT 0,
  total_purchases INTEGER DEFAULT 0,
  total_earnings NUMERIC(12,2) DEFAULT 0,
  pending_withdrawal NUMERIC(12,2) DEFAULT 0,
  total_paid NUMERIC(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Referral click tracking
CREATE TABLE IF NOT EXISTS partner_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID REFERENCES partners(id) ON DELETE CASCADE,
  referral_code TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  landing_page TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Commission records (one per successful payment)
CREATE TABLE IF NOT EXISTS referral_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,
  referral_code TEXT NOT NULL,
  purchase_amount NUMERIC(12,2) NOT NULL,
  commission_rate NUMERIC(5,2) NOT NULL,
  commission_amount NUMERIC(12,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid')),
  student_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  course_slug TEXT,
  skill_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Withdrawal requests
CREATE TABLE IF NOT EXISTS partner_withdrawals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'rejected')),
  upi_id TEXT,
  bank_name TEXT,
  bank_account_number TEXT,
  bank_ifsc TEXT,
  rejection_reason TEXT,
  payment_reference TEXT,
  requested_at TIMESTAMPTZ DEFAULT now(),
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Global partner settings (singleton row)
CREATE TABLE IF NOT EXISTS partner_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  default_commission_rate NUMERIC(5,2) NOT NULL DEFAULT 50,
  min_withdrawal_amount NUMERIC(12,2) NOT NULL DEFAULT 500,
  auto_approval BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO partner_settings (id, default_commission_rate, min_withdrawal_amount, auto_approval)
VALUES (1, 50, 500, false)
ON CONFLICT (id) DO NOTHING;

-- Add referral columns to payments
ALTER TABLE payments ADD COLUMN IF NOT EXISTS referral_code TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS partner_id UUID REFERENCES partners(id) ON DELETE SET NULL;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_partners_referral_code ON partners(referral_code);
CREATE INDEX IF NOT EXISTS idx_partners_user_id ON partners(user_id);
CREATE INDEX IF NOT EXISTS idx_partners_status ON partners(status);
CREATE INDEX IF NOT EXISTS idx_partner_clicks_partner_id ON partner_clicks(partner_id);
CREATE INDEX IF NOT EXISTS idx_referral_commissions_partner_id ON referral_commissions(partner_id);
CREATE INDEX IF NOT EXISTS idx_referral_commissions_payment_id ON referral_commissions(payment_id);
CREATE INDEX IF NOT EXISTS idx_partner_withdrawals_partner_id ON partner_withdrawals(partner_id);
CREATE INDEX IF NOT EXISTS idx_payments_partner_id ON payments(partner_id);

-- RLS
ALTER TABLE partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_settings ENABLE ROW LEVEL SECURITY;

-- Partners: can read/update own row
CREATE POLICY "partners_select_own" ON partners FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "partners_update_own" ON partners FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "partners_insert_own" ON partners FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Commissions: partners see their own
CREATE POLICY "commissions_select_own" ON referral_commissions FOR SELECT USING (
  partner_id IN (SELECT id FROM partners WHERE user_id = auth.uid())
);

-- Withdrawals: partners see their own
CREATE POLICY "withdrawals_select_own" ON partner_withdrawals FOR SELECT USING (
  partner_id IN (SELECT id FROM partners WHERE user_id = auth.uid())
);
CREATE POLICY "withdrawals_insert_own" ON partner_withdrawals FOR INSERT WITH CHECK (
  partner_id IN (SELECT id FROM partners WHERE user_id = auth.uid())
);

-- Settings: anyone can read
CREATE POLICY "settings_select_all" ON partner_settings FOR SELECT USING (true);

-- Clicks: service role only (no RLS for insert needed — we use admin client)
CREATE POLICY "clicks_select_own" ON partner_clicks FOR SELECT USING (
  partner_id IN (SELECT id FROM partners WHERE user_id = auth.uid())
);
