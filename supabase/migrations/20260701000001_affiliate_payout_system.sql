-- ============================================================
-- Affiliate Weekly Payout System
-- ============================================================

-- Add bank payout fields to affiliate_profiles
ALTER TABLE affiliate_profiles
  ADD COLUMN IF NOT EXISTS phone               TEXT,
  ADD COLUMN IF NOT EXISTS bank_name           TEXT,
  ADD COLUMN IF NOT EXISTS account_holder      TEXT,
  ADD COLUMN IF NOT EXISTS account_number      TEXT,
  ADD COLUMN IF NOT EXISTS ifsc_code           TEXT,
  ADD COLUMN IF NOT EXISTS upi_id              TEXT,
  ADD COLUMN IF NOT EXISTS bank_verified       BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS bank_verified_at    TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS bank_verified_by    TEXT;

-- Affiliate Wallets (running balance snapshot)
CREATE TABLE IF NOT EXISTS affiliate_wallets (
  id                UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id      UUID         NOT NULL REFERENCES affiliate_profiles(id) ON DELETE CASCADE,
  available_balance NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_earned      NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_paid        NUMERIC(12,2) NOT NULL DEFAULT 0,
  updated_at        TIMESTAMPTZ  DEFAULT now(),
  UNIQUE(affiliate_id)
);

-- Affiliate Weekly Payouts
CREATE TABLE IF NOT EXISTS affiliate_weekly_payouts (
  id                   UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id         UUID         NOT NULL REFERENCES affiliate_profiles(id) ON DELETE CASCADE,
  week_start           DATE         NOT NULL,
  week_end             DATE         NOT NULL,
  amount               NUMERIC(12,2) NOT NULL DEFAULT 0,
  status               TEXT         NOT NULL DEFAULT 'pending'
                         CHECK (status IN ('pending','approved','processing','paid','failed','rejected')),
  cashfree_transfer_id TEXT,
  remarks              TEXT,
  approved_by          TEXT,
  approved_at          TIMESTAMPTZ,
  paid_at              TIMESTAMPTZ,
  created_at           TIMESTAMPTZ  DEFAULT now(),
  UNIQUE(affiliate_id, week_start)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_affiliate_wallets_affiliate_id
  ON affiliate_wallets(affiliate_id);

CREATE INDEX IF NOT EXISTS idx_affiliate_weekly_payouts_affiliate_id
  ON affiliate_weekly_payouts(affiliate_id);

CREATE INDEX IF NOT EXISTS idx_affiliate_weekly_payouts_status
  ON affiliate_weekly_payouts(status);

CREATE INDEX IF NOT EXISTS idx_affiliate_weekly_payouts_week
  ON affiliate_weekly_payouts(week_start DESC);
