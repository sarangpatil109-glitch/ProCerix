-- Transaction history: one row per payment state change
CREATE TABLE IF NOT EXISTS payment_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    cashfree_order_id TEXT,
    status TEXT,
    payload JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_events_payment_id ON payment_events(payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_events_cashfree_order ON payment_events(cashfree_order_id);

ALTER TABLE payment_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payment events" ON payment_events FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM payments
            WHERE payments.id = payment_events.payment_id
              AND payments.user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can manage payment events" ON payment_events FOR ALL
    USING (is_admin());

-- Track when payment was settled
ALTER TABLE payments ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;
