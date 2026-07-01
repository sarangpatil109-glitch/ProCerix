-- ============================================================
-- Affiliate Bank Details: add branch_name column
-- (other bank columns added in 20260701000001)
-- ============================================================

ALTER TABLE affiliate_profiles
  ADD COLUMN IF NOT EXISTS branch_name TEXT;
