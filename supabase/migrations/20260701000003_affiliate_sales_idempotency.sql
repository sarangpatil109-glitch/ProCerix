-- Prevent duplicate affiliate commission records for the same payment.
-- A partial unique index (WHERE payment_id IS NOT NULL) allows existing NULL rows
-- while ensuring each non-null payment_id is only credited once.
CREATE UNIQUE INDEX IF NOT EXISTS idx_affiliate_sales_payment_id_unique
  ON affiliate_sales(payment_id)
  WHERE payment_id IS NOT NULL;
