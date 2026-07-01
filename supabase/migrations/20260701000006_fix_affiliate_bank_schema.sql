-- ============================================================
-- Ensure all affiliate bank detail columns exist on affiliate_profiles.
-- Safe to run multiple times (ADD COLUMN IF NOT EXISTS).
-- Consolidates 20260701000001 + 20260701000002 additions.
-- ============================================================

ALTER TABLE affiliate_profiles
  ADD COLUMN IF NOT EXISTS phone               TEXT,
  ADD COLUMN IF NOT EXISTS bank_name           TEXT,
  ADD COLUMN IF NOT EXISTS account_holder      TEXT,
  ADD COLUMN IF NOT EXISTS account_number      TEXT,
  ADD COLUMN IF NOT EXISTS ifsc_code           TEXT,
  ADD COLUMN IF NOT EXISTS upi_id              TEXT,
  ADD COLUMN IF NOT EXISTS bank_verified       BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS bank_verified_at    TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS bank_verified_by    TEXT,
  ADD COLUMN IF NOT EXISTS branch_name         TEXT;
