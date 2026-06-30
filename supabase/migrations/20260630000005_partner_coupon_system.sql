-- ============================================================
-- Teacher Affiliate / Coupon Extension
-- ============================================================

-- Extend partners table with discount + commission fields
ALTER TABLE partners
  ADD COLUMN IF NOT EXISTS commission_percentage NUMERIC(5,2) DEFAULT 50,
  ADD COLUMN IF NOT EXISTS discount_type TEXT DEFAULT 'percentage' CHECK (discount_type IN ('percentage', 'flat')),
  ADD COLUMN IF NOT EXISTS discount_value NUMERIC(10,2) DEFAULT 10;

-- Back-fill commission_percentage from existing commission_rate
UPDATE partners SET commission_percentage = commission_rate WHERE commission_percentage = 50 AND commission_rate != 50;

-- partner_sales: tracks each successful coupon-based purchase
CREATE TABLE IF NOT EXISTS partner_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,
  order_id TEXT,
  student_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  product_type TEXT DEFAULT 'certificate',
  product_id UUID,
  coupon_code TEXT NOT NULL,
  purchase_amount NUMERIC(12,2) NOT NULL,
  discount_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  commission_amount NUMERIC(12,2) NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- withdraw_requests: simplified withdrawal tracking
CREATE TABLE IF NOT EXISTS withdraw_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'rejected')),
  requested_at TIMESTAMPTZ DEFAULT now(),
  paid_at TIMESTAMPTZ,
  payment_reference TEXT,
  rejection_reason TEXT,
  upi_id TEXT,
  bank_name TEXT,
  bank_account_number TEXT,
  bank_ifsc TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add discount columns to payments
ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS final_amount NUMERIC(12,2);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_partner_sales_partner_id ON partner_sales(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_sales_payment_id ON partner_sales(payment_id);
CREATE INDEX IF NOT EXISTS idx_partner_sales_coupon_code ON partner_sales(coupon_code);
CREATE INDEX IF NOT EXISTS idx_partner_sales_created_at ON partner_sales(created_at);
CREATE INDEX IF NOT EXISTS idx_withdraw_requests_partner_id ON withdraw_requests(partner_id);
CREATE INDEX IF NOT EXISTS idx_withdraw_requests_status ON withdraw_requests(status);

-- RLS
ALTER TABLE partner_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdraw_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "partner_sales_own" ON partner_sales FOR SELECT USING (
  partner_id IN (SELECT id FROM partners WHERE user_id = auth.uid())
);
CREATE POLICY "withdraw_requests_own_select" ON withdraw_requests FOR SELECT USING (
  partner_id IN (SELECT id FROM partners WHERE user_id = auth.uid())
);
CREATE POLICY "withdraw_requests_own_insert" ON withdraw_requests FOR INSERT WITH CHECK (
  partner_id IN (SELECT id FROM partners WHERE user_id = auth.uid())
);
