-- ========================================================
-- Hapini Database Migration 002: Price Alerts Enhancement
-- Adds retailer target, notification idempotency tracking,
-- and scheduled execution audit logs.
-- ========================================================

-- 1. Extend price_alerts table
ALTER TABLE price_alerts 
    ADD COLUMN IF NOT EXISTS retailer_id UUID REFERENCES retailers(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS retailer_name VARCHAR(100),
    ADD COLUMN IF NOT EXISTS triggered_price NUMERIC(12, 2),
    ADD COLUMN IF NOT EXISTS last_notified_at TIMESTAMPTZ;

-- 2. Audit logs for background scheduled price checking jobs
CREATE TABLE IF NOT EXISTS alert_job_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_name VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL, -- 'SUCCESS', 'FAILED', 'PARTIAL'
    alerts_evaluated INTEGER DEFAULT 0 NOT NULL,
    alerts_triggered INTEGER DEFAULT 0 NOT NULL,
    details JSONB DEFAULT '{}'::jsonb NOT NULL,
    duration_ms INTEGER,
    executed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 3. Idempotent notification record table to strictly prevent duplicate dispatches
CREATE TABLE IF NOT EXISTS alert_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alert_id UUID NOT NULL REFERENCES price_alerts(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    triggered_price NUMERIC(12, 2) NOT NULL,
    target_price NUMERIC(12, 2) NOT NULL,
    retailer_name VARCHAR(100),
    notification_channel VARCHAR(50) DEFAULT 'local_dev_console' NOT NULL,
    sent_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    idempotency_key VARCHAR(255) UNIQUE NOT NULL
);

-- Indexes for efficient alert checking
CREATE INDEX IF NOT EXISTS idx_price_alerts_user_active ON price_alerts(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_alert_notifications_alert_id ON alert_notifications(alert_id);
CREATE INDEX IF NOT EXISTS idx_alert_job_logs_executed ON alert_job_logs(executed_at DESC);
