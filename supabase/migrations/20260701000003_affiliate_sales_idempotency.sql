-- Prevent duplicate affiliate commission records for the same payment.
-- First, remove any duplicate rows keeping only the latest per payment_id.
-- Then create a partial unique index so future duplicates are rejected at DB level.

DELETE FROM affiliate_sales
WHERE id NOT IN (
  SELECT DISTINCT ON (payment_id) id
  FROM affiliate_sales
  WHERE payment_id IS NOT NULL
  ORDER BY payment_id, created_at DESC NULLS LAST
)
AND payment_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_affiliate_sales_payment_id_unique
  ON affiliate_sales(payment_id)
  WHERE payment_id IS NOT NULL;
