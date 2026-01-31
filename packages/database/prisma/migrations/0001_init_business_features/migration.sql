-- WashWise Business Features Migration
-- This migration sets up the comprehensive business schema with:
-- 1. Booking overlap protection using EXCLUDE USING GIST
-- 2. Timestamp range extension for bookings
-- 3. Partial indexes for performance
-- 4. Triggers for audit logging

-- ============================================
-- Extensions
-- ============================================
CREATE EXTENSION IF NOT EXISTS btree_gist;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================
-- Custom Types
-- ============================================

-- Enum types (Prisma will handle these, but we document for clarity)
-- TenantPlan: FREE, BASIC, PRO, ENTERPRISE
-- UserRole: SUPER_ADMIN, OWNER, STAFF, CUSTOMER
-- MachineType: WASHER, DRYER, COMBO
-- MachineStatus: AVAILABLE, BUSY, OFFLINE, MAINTENANCE, ERROR
-- BookingStatus: PENDING, CONFIRMED, CHECKED_IN, COMPLETED, CANCELLED, NO_SHOW, EXPIRED
-- PaymentMethod: CASH, CREDIT_CARD, DEBIT_CARD, PROMPTPAY, BANK_TRANSFER, LINE_PAY, TRUE_MONEY, RABBIT_LINE_PAY, WALLET
-- PaymentStatus: PENDING, PROCESSING, COMPLETED, FAILED, CANCELLED, REFUNDED, PARTIALLY_REFUNDED
-- NotificationType: BOOKING_CONFIRMED, BOOKING_REMINDER, ...
-- NotificationChannel: IN_APP, PUSH, EMAIL, LINE, SMS
-- NotificationPriority: LOW, NORMAL, HIGH, URGENT
-- AuditAction: CREATE, READ, UPDATE, DELETE, LOGIN, LOGOUT, ...

-- ============================================
-- Booking Overlap Prevention (CRITICAL for concurrency)
-- ============================================
-- This constraint ensures no two bookings for the same machine overlap in time
-- Only applies to bookings that are not cancelled/expired

-- First, add a tstzrange column to bookings for the constraint
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS time_range tstzrange 
GENERATED ALWAYS AS (tstzrange(start_time, end_time, '[)')) STORED;

-- Create the exclusion constraint
-- This prevents overlapping bookings on the same machine for active statuses
ALTER TABLE bookings
ADD CONSTRAINT bookings_no_overlap
EXCLUDE USING GIST (
    machine_id WITH =,
    time_range WITH &&
) WHERE (status NOT IN ('CANCELLED', 'EXPIRED', 'NO_SHOW'));

-- ============================================
-- Performance Indexes
-- ============================================

-- Partial index for active bookings (most queries filter by status)
CREATE INDEX IF NOT EXISTS idx_bookings_active 
ON bookings (machine_id, start_time) 
WHERE status IN ('PENDING', 'CONFIRMED', 'CHECKED_IN');

-- Index for finding available machines in a time range
CREATE INDEX IF NOT EXISTS idx_bookings_time_range 
ON bookings USING GIST (machine_id, time_range);

-- Partial index for unread notifications
CREATE INDEX IF NOT EXISTS idx_notifications_unread 
ON notifications (user_id, created_at DESC) 
WHERE read_at IS NULL;

-- Partial index for pending payments
CREATE INDEX IF NOT EXISTS idx_payments_pending 
ON payments (tenant_id, created_at) 
WHERE status IN ('PENDING', 'PROCESSING');

-- Index for audit log time-based queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_recent 
ON audit_logs (tenant_id, created_at DESC);

-- Composite index for machine health monitoring
CREATE INDEX IF NOT EXISTS idx_machines_health 
ON machines (tenant_id, status, last_heartbeat)
WHERE is_active = true;

-- ============================================
-- Helper Functions
-- ============================================

-- Function to check if a time slot is available for a machine
CREATE OR REPLACE FUNCTION check_slot_available(
    p_machine_id UUID,
    p_start_time TIMESTAMPTZ,
    p_end_time TIMESTAMPTZ,
    p_exclude_booking_id UUID DEFAULT NULL
) RETURNS BOOLEAN AS $$
BEGIN
    RETURN NOT EXISTS (
        SELECT 1 FROM bookings
        WHERE machine_id = p_machine_id
          AND status NOT IN ('CANCELLED', 'EXPIRED', 'NO_SHOW')
          AND time_range && tstzrange(p_start_time, p_end_time, '[)')
          AND (p_exclude_booking_id IS NULL OR id != p_exclude_booking_id)
    );
END;
$$ LANGUAGE plpgsql;

-- Function to get available slots for a machine on a given date
CREATE OR REPLACE FUNCTION get_available_slots(
    p_machine_id UUID,
    p_date DATE,
    p_slot_duration_mins INT DEFAULT 45
) RETURNS TABLE (
    slot_start TIMESTAMPTZ,
    slot_end TIMESTAMPTZ
) AS $$
DECLARE
    v_day_start TIMESTAMPTZ;
    v_day_end TIMESTAMPTZ;
    v_slot_start TIMESTAMPTZ;
    v_slot_end TIMESTAMPTZ;
BEGIN
    -- Assume operating hours 6:00 AM to 10:00 PM
    v_day_start := p_date + INTERVAL '6 hours';
    v_day_end := p_date + INTERVAL '22 hours';
    
    v_slot_start := v_day_start;
    
    WHILE v_slot_start < v_day_end LOOP
        v_slot_end := v_slot_start + (p_slot_duration_mins || ' minutes')::INTERVAL;
        
        IF v_slot_end <= v_day_end AND check_slot_available(p_machine_id, v_slot_start, v_slot_end) THEN
            slot_start := v_slot_start;
            slot_end := v_slot_end;
            RETURN NEXT;
        END IF;
        
        v_slot_start := v_slot_end;
    END LOOP;
    
    RETURN;
END;
$$ LANGUAGE plpgsql;

-- Function to generate idempotency key
CREATE OR REPLACE FUNCTION generate_idempotency_key() 
RETURNS VARCHAR(100) AS $$
BEGIN
    RETURN 'PAY-' || encode(gen_random_bytes(16), 'hex');
END;
$$ LANGUAGE plpgsql;

-- Function to generate receipt number
CREATE OR REPLACE FUNCTION generate_receipt_number(p_tenant_id UUID) 
RETURNS VARCHAR(50) AS $$
DECLARE
    v_prefix VARCHAR(10);
    v_date_part VARCHAR(8);
    v_seq INT;
BEGIN
    v_date_part := to_char(CURRENT_DATE, 'YYYYMMDD');
    
    -- Get sequence for today
    SELECT COALESCE(MAX(CAST(SUBSTRING(receipt_number FROM 'RCP-\d{8}-(\d+)') AS INT)), 0) + 1
    INTO v_seq
    FROM payments
    WHERE tenant_id = p_tenant_id
      AND receipt_number LIKE 'RCP-' || v_date_part || '-%';
    
    RETURN 'RCP-' || v_date_part || '-' || LPAD(v_seq::TEXT, 5, '0');
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Audit Trigger Function
-- ============================================

CREATE OR REPLACE FUNCTION audit_trigger_func()
RETURNS TRIGGER AS $$
DECLARE
    v_old_data JSONB;
    v_new_data JSONB;
    v_tenant_id UUID;
    v_user_id UUID;
BEGIN
    -- Try to get tenant_id from the record
    IF TG_OP = 'DELETE' THEN
        v_old_data := to_jsonb(OLD);
        v_tenant_id := (OLD).tenant_id;
    ELSE
        v_new_data := to_jsonb(NEW);
        v_tenant_id := (NEW).tenant_id;
    END IF;
    
    IF TG_OP = 'UPDATE' THEN
        v_old_data := to_jsonb(OLD);
    END IF;

    -- Get current user from session (if available)
    v_user_id := NULLIF(current_setting('app.current_user_id', true), '')::UUID;

    INSERT INTO audit_logs (
        id,
        tenant_id,
        user_id,
        action,
        entity_type,
        entity_id,
        old_values,
        new_values,
        ip_address,
        request_id,
        created_at
    ) VALUES (
        gen_random_uuid(),
        v_tenant_id,
        v_user_id,
        CASE TG_OP
            WHEN 'INSERT' THEN 'CREATE'
            WHEN 'UPDATE' THEN 'UPDATE'
            WHEN 'DELETE' THEN 'DELETE'
        END::"AuditAction",
        TG_TABLE_NAME,
        COALESCE((NEW).id::TEXT, (OLD).id::TEXT),
        v_old_data,
        v_new_data,
        NULLIF(current_setting('app.client_ip', true), ''),
        NULLIF(current_setting('app.request_id', true), ''),
        NOW()
    );

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Apply Audit Triggers to Critical Tables
-- ============================================

-- Machines audit
DROP TRIGGER IF EXISTS machines_audit_trigger ON machines;
CREATE TRIGGER machines_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON machines
FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

-- Bookings audit
DROP TRIGGER IF EXISTS bookings_audit_trigger ON bookings;
CREATE TRIGGER bookings_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON bookings
FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

-- Payments audit
DROP TRIGGER IF EXISTS payments_audit_trigger ON payments;
CREATE TRIGGER payments_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON payments
FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

-- Users audit (exclude password changes in log)
DROP TRIGGER IF EXISTS users_audit_trigger ON users;
CREATE TRIGGER users_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON users
FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

-- ============================================
-- Row Level Security (RLS) Policies
-- ============================================

-- Enable RLS on key tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE machines ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see data from their tenant
-- Note: app.current_tenant_id should be set in session

-- Tenants RLS
CREATE POLICY tenant_isolation ON tenants
    USING (id::TEXT = current_setting('app.current_tenant_id', true));

-- Branches RLS
CREATE POLICY branch_isolation ON branches
    USING (tenant_id::TEXT = current_setting('app.current_tenant_id', true));

-- Users RLS
CREATE POLICY user_isolation ON users
    USING (tenant_id::TEXT = current_setting('app.current_tenant_id', true));

-- Machines RLS
CREATE POLICY machine_isolation ON machines
    USING (tenant_id::TEXT = current_setting('app.current_tenant_id', true));

-- Bookings RLS
CREATE POLICY booking_isolation ON bookings
    USING (tenant_id::TEXT = current_setting('app.current_tenant_id', true));

-- Payments RLS
CREATE POLICY payment_isolation ON payments
    USING (tenant_id::TEXT = current_setting('app.current_tenant_id', true));

-- Notifications RLS
CREATE POLICY notification_isolation ON notifications
    USING (tenant_id::TEXT = current_setting('app.current_tenant_id', true));

-- Audit Logs RLS
CREATE POLICY audit_isolation ON audit_logs
    USING (tenant_id::TEXT = current_setting('app.current_tenant_id', true));

-- ============================================
-- Statistics Aggregation Functions
-- ============================================

-- Function to update daily tenant stats
CREATE OR REPLACE FUNCTION update_daily_tenant_stats(
    p_tenant_id UUID,
    p_date DATE DEFAULT CURRENT_DATE
) RETURNS VOID AS $$
DECLARE
    v_stats RECORD;
BEGIN
    SELECT
        COUNT(*) FILTER (WHERE status != 'CANCELLED') as total_bookings,
        COUNT(*) FILTER (WHERE status = 'COMPLETED') as completed_bookings,
        COUNT(*) FILTER (WHERE status = 'CANCELLED') as cancelled_bookings,
        COUNT(*) FILTER (WHERE status = 'NO_SHOW') as no_show_bookings,
        COALESCE(SUM(p.amount) FILTER (WHERE p.status = 'COMPLETED'), 0) as total_revenue
    INTO v_stats
    FROM bookings b
    LEFT JOIN payments p ON p.booking_id = b.id
    WHERE b.tenant_id = p_tenant_id
      AND b.created_at::DATE = p_date;

    INSERT INTO daily_tenant_stats (
        id, tenant_id, date,
        total_bookings, completed_bookings, cancelled_bookings, no_show_bookings,
        total_revenue, created_at, updated_at
    ) VALUES (
        gen_random_uuid(), p_tenant_id, p_date,
        v_stats.total_bookings, v_stats.completed_bookings, 
        v_stats.cancelled_bookings, v_stats.no_show_bookings,
        v_stats.total_revenue, NOW(), NOW()
    )
    ON CONFLICT (tenant_id, date) DO UPDATE SET
        total_bookings = EXCLUDED.total_bookings,
        completed_bookings = EXCLUDED.completed_bookings,
        cancelled_bookings = EXCLUDED.cancelled_bookings,
        no_show_bookings = EXCLUDED.no_show_bookings,
        total_revenue = EXCLUDED.total_revenue,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Machine Health Check Function
-- ============================================

-- Function to flag machines as potentially offline
CREATE OR REPLACE FUNCTION check_machine_health() 
RETURNS INTEGER AS $$
DECLARE
    v_offline_count INTEGER;
BEGIN
    -- Mark machines as offline if no heartbeat in 5 minutes
    UPDATE machines
    SET status = 'OFFLINE',
        anomaly_flag = true,
        anomaly_details = jsonb_build_object(
            'reason', 'no_heartbeat',
            'last_heartbeat', last_heartbeat,
            'detected_at', NOW()
        )
    WHERE is_active = true
      AND status NOT IN ('OFFLINE', 'MAINTENANCE')
      AND last_heartbeat < NOW() - INTERVAL '5 minutes';
    
    GET DIAGNOSTICS v_offline_count = ROW_COUNT;
    
    RETURN v_offline_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Booking Expiration Function
-- ============================================

-- Function to expire old pending bookings
CREATE OR REPLACE FUNCTION expire_old_bookings() 
RETURNS INTEGER AS $$
DECLARE
    v_expired_count INTEGER;
BEGIN
    UPDATE bookings
    SET status = 'EXPIRED',
        updated_at = NOW()
    WHERE status = 'PENDING'
      AND start_time < NOW() - INTERVAL '15 minutes';
    
    GET DIAGNOSTICS v_expired_count = ROW_COUNT;
    
    -- Also mark confirmed bookings as no-show if past end time + grace period
    UPDATE bookings
    SET status = 'NO_SHOW',
        updated_at = NOW()
    WHERE status = 'CONFIRMED'
      AND end_time < NOW() - INTERVAL '30 minutes'
      AND checked_in_at IS NULL;
    
    RETURN v_expired_count;
END;
$$ LANGUAGE plpgsql;
