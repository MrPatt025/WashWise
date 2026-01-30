# WashWise Enterprise - Database Design

## 1. Overview

WashWise uses a polyglot persistence strategy:

| Database          | Purpose                           | Key Features                     |
| ----------------- | --------------------------------- | -------------------------------- |
| **PostgreSQL 16** | Primary relational data + vectors | ACID, pgvector, full-text search |
| **MongoDB 7.x**   | AI conversation history           | Flexible schema, time-series     |
| **Redis 7.x**     | Cache, sessions, events           | Sub-ms latency, pub/sub, streams |

---

## 2. PostgreSQL Schema

### 2.1 Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                              POSTGRESQL SCHEMA                                               │
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                              │
│   ┌─────────────┐          ┌─────────────┐          ┌─────────────┐                        │
│   │   tenants   │──────────│    users    │──────────│refresh_tokens│                        │
│   │             │   1:N    │             │   1:N    │             │                        │
│   │ • id (PK)   │          │ • id (PK)   │          │ • id (PK)   │                        │
│   │ • name      │          │ • tenant_id │          │ • user_id   │                        │
│   │ • plan      │          │ • email     │          │ • family_id │                        │
│   │ • created_at│          │ • password  │          │ • revoked   │                        │
│   └──────┬──────┘          │ • role      │          │ • expires_at│                        │
│          │                 └──────┬──────┘          └─────────────┘                        │
│          │                        │                                                         │
│          │ 1:N                    │ 1:N                                                     │
│          │                        │                                                         │
│   ┌──────▼──────┐          ┌──────▼──────┐                                                 │
│   │  branches   │          │ transactions │                                                 │
│   │             │          │             │                                                 │
│   │ • id (PK)   │          │ • id (PK)   │                                                 │
│   │ • tenant_id │          │ • user_id   │                                                 │
│   │ • name      │          │ • machine_id│                                                 │
│   │ • address   │          │ • amount    │                                                 │
│   │ • hours     │          │ • status    │                                                 │
│   └──────┬──────┘          └─────────────┘                                                 │
│          │                                                                                  │
│          │ 1:N                                                                              │
│          │                                                                                  │
│   ┌──────▼──────┐          ┌─────────────┐          ┌─────────────┐                        │
│   │  machines   │──────────│  bookings   │          │  iot_logs   │                        │
│   │             │   1:N    │             │          │             │                        │
│   │ • id (PK)   │          │ • id (PK)   │          │ • id (PK)   │                        │
│   │ • branch_id │          │ • machine_id│          │ • machine_id│                        │
│   │ • serial    │          │ • user_id   │          │ • event     │                        │
│   │ • type      │          │ • start_at  │          │ • payload   │                        │
│   │ • status    │          │ • end_at    │          │ • timestamp │                        │
│   └──────┬──────┘          │ • status    │          └─────────────┘                        │
│          │                 └─────────────┘                                                 │
│          │ 1:N                                                                              │
│          │                                                                                  │
│   ┌──────▼──────┐          ┌─────────────┐                                                 │
│   │  iot_logs   │          │ audit_logs  │                                                 │
│   │  (as above) │          │             │                                                 │
│   └─────────────┘          │ • id (PK)   │                                                 │
│                            │ • tenant_id │                                                 │
│   ┌─────────────┐          │ • actor_id  │                                                 │
│   │ embeddings  │          │ • action    │                                                 │
│   │             │          │ • entity    │                                                 │
│   │ • id (PK)   │          │ • details   │                                                 │
│   │ • tenant_id │          │ • ip_address│                                                 │
│   │ • content   │          │ • timestamp │                                                 │
│   │ • embedding │          └─────────────┘                                                 │
│   │   (vector)  │                                                                           │
│   └─────────────┘                                                                           │
│                                                                                              │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 DDL Schema

```sql
-- ===========================================
-- EXTENSIONS
-- ===========================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgvector";

-- ===========================================
-- ENUMS
-- ===========================================
CREATE TYPE tenant_plan AS ENUM ('FREE', 'BASIC', 'PRO', 'ENTERPRISE');
CREATE TYPE user_role AS ENUM ('SUPER_ADMIN', 'OWNER', 'STAFF', 'CUSTOMER');
CREATE TYPE machine_type AS ENUM ('WASHER', 'DRYER');
CREATE TYPE machine_status AS ENUM ('AVAILABLE', 'BUSY', 'OFFLINE', 'MAINTENANCE');
CREATE TYPE booking_status AS ENUM ('PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW');
CREATE TYPE payment_status AS ENUM ('PENDING', 'AUTHORIZED', 'COMPLETED', 'FAILED', 'REFUNDED');

-- ===========================================
-- 1. TENANTS (Multi-tenancy root)
-- ===========================================
CREATE TABLE tenants (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            VARCHAR(100) NOT NULL,
    slug            VARCHAR(50) UNIQUE NOT NULL,
    plan            tenant_plan NOT NULL DEFAULT 'FREE',
    logo_url        VARCHAR(500),
    contact_email   VARCHAR(255),
    contact_phone   VARCHAR(20),

    -- Metadata
    settings        JSONB DEFAULT '{}',

    -- Timestamps
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    suspended_at    TIMESTAMP WITH TIME ZONE,

    -- Constraints
    CONSTRAINT tenant_slug_format CHECK (slug ~ '^[a-z0-9-]+$')
);

CREATE INDEX idx_tenants_slug ON tenants(slug);
CREATE INDEX idx_tenants_plan ON tenants(plan);

-- ===========================================
-- 2. BRANCHES (Physical locations)
-- ===========================================
CREATE TABLE branches (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    name            VARCHAR(100) NOT NULL,
    address         VARCHAR(500),
    city            VARCHAR(100),
    postal_code     VARCHAR(20),
    latitude        DECIMAL(10, 8),
    longitude       DECIMAL(11, 8),

    -- Operating hours (JSONB for flexibility)
    -- Format: {"mon": {"open": "07:00", "close": "22:00"}, ...}
    operating_hours JSONB DEFAULT '{}',

    phone           VARCHAR(20),
    is_active       BOOLEAN DEFAULT TRUE,

    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Unique branch name per tenant
    CONSTRAINT unique_branch_name_per_tenant UNIQUE (tenant_id, name)
);

CREATE INDEX idx_branches_tenant ON branches(tenant_id);
CREATE INDEX idx_branches_location ON branches USING GIST (
    point(longitude, latitude)
);

-- ===========================================
-- 3. USERS (RBAC)
-- ===========================================
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    branch_id       UUID REFERENCES branches(id) ON DELETE SET NULL,

    email           VARCHAR(255) NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    name            VARCHAR(100) NOT NULL,
    phone           VARCHAR(20),
    avatar_url      VARCHAR(500),

    role            user_role NOT NULL DEFAULT 'CUSTOMER',

    -- Security
    email_verified  BOOLEAN DEFAULT FALSE,
    failed_login_count INT DEFAULT 0,
    locked_until    TIMESTAMP WITH TIME ZONE,
    last_login_at   TIMESTAMP WITH TIME ZONE,
    last_login_ip   INET,

    -- Preferences
    preferences     JSONB DEFAULT '{}',

    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Unique email per tenant
    CONSTRAINT unique_email_per_tenant UNIQUE (tenant_id, email)
);

CREATE INDEX idx_users_tenant ON users(tenant_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_branch ON users(branch_id);

-- ===========================================
-- 4. REFRESH TOKENS (Secure rotation)
-- ===========================================
CREATE TABLE refresh_tokens (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    hashed_token    VARCHAR(255) UNIQUE NOT NULL,
    family_id       UUID NOT NULL,  -- For reuse detection

    device_info     JSONB DEFAULT '{}',
    ip_address      INET,

    revoked         BOOLEAN DEFAULT FALSE,
    revoked_at      TIMESTAMP WITH TIME ZONE,
    revoked_reason  VARCHAR(100),

    expires_at      TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Index for fast cleanup
    CONSTRAINT valid_expiry CHECK (expires_at > created_at)
);

CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_family ON refresh_tokens(family_id);
CREATE INDEX idx_refresh_tokens_expires ON refresh_tokens(expires_at);

-- ===========================================
-- 5. MACHINES (Core business entity)
-- ===========================================
CREATE TABLE machines (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    branch_id       UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,

    serial_number   VARCHAR(50) NOT NULL,
    label           VARCHAR(100) NOT NULL,
    type            machine_type NOT NULL,

    -- Specifications
    capacity_kg     DECIMAL(5, 2) NOT NULL,
    manufacturer    VARCHAR(100),
    model           VARCHAR(100),

    -- Pricing
    price_per_cycle DECIMAL(10, 2) NOT NULL DEFAULT 0,
    currency        VARCHAR(3) DEFAULT 'THB',

    -- Status
    status          machine_status NOT NULL DEFAULT 'AVAILABLE',
    last_status_change TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- IoT
    iot_device_id   VARCHAR(100),
    firmware_version VARCHAR(20),
    last_heartbeat  TIMESTAMP WITH TIME ZONE,

    -- Location within branch
    location_hint   VARCHAR(200),  -- e.g., "Row A, Position 3"
    floor           INT DEFAULT 1,

    -- Maintenance
    last_maintenance TIMESTAMP WITH TIME ZONE,
    next_maintenance TIMESTAMP WITH TIME ZONE,
    total_cycles    INT DEFAULT 0,

    -- Health metrics (updated by AI)
    health_score    DECIMAL(3, 2),  -- 0.00 to 1.00

    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Serial unique per tenant
    CONSTRAINT unique_serial_per_tenant UNIQUE (tenant_id, serial_number)
);

CREATE INDEX idx_machines_tenant ON machines(tenant_id);
CREATE INDEX idx_machines_branch ON machines(branch_id);
CREATE INDEX idx_machines_status ON machines(status);
CREATE INDEX idx_machines_type ON machines(type);

-- ===========================================
-- 6. BOOKINGS (Reservations)
-- ===========================================
CREATE TABLE bookings (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    machine_id      UUID NOT NULL REFERENCES machines(id) ON DELETE CASCADE,
    user_id         UUID REFERENCES users(id) ON DELETE SET NULL,

    -- Time slot
    start_at        TIMESTAMP WITH TIME ZONE NOT NULL,
    end_at          TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_minutes INT NOT NULL,

    status          booking_status NOT NULL DEFAULT 'PENDING',

    -- Pricing snapshot (at time of booking)
    price_snapshot  DECIMAL(10, 2) NOT NULL,
    currency        VARCHAR(3) DEFAULT 'THB',

    -- Customer info (for guest bookings)
    customer_name   VARCHAR(100),
    customer_phone  VARCHAR(20),
    customer_email  VARCHAR(255),

    -- Cancellation
    cancelled_at    TIMESTAMP WITH TIME ZONE,
    cancel_reason   VARCHAR(500),

    -- Notes
    notes           TEXT,

    -- Idempotency
    idempotency_key VARCHAR(100) UNIQUE,

    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Prevent overlapping bookings
    CONSTRAINT valid_time_range CHECK (end_at > start_at),
    CONSTRAINT valid_duration CHECK (duration_minutes > 0)
);

CREATE INDEX idx_bookings_tenant ON bookings(tenant_id);
CREATE INDEX idx_bookings_machine ON bookings(machine_id);
CREATE INDEX idx_bookings_user ON bookings(user_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_time_range ON bookings(machine_id, start_at, end_at);

-- Prevent overlapping bookings (PostgreSQL exclusion constraint)
CREATE EXTENSION IF NOT EXISTS btree_gist;
ALTER TABLE bookings ADD CONSTRAINT no_overlapping_bookings
    EXCLUDE USING GIST (
        machine_id WITH =,
        tstzrange(start_at, end_at) WITH &&
    ) WHERE (status NOT IN ('CANCELLED', 'NO_SHOW'));

-- ===========================================
-- 7. TRANSACTIONS (Payments)
-- ===========================================
CREATE TABLE transactions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    booking_id      UUID REFERENCES bookings(id) ON DELETE SET NULL,
    user_id         UUID REFERENCES users(id) ON DELETE SET NULL,
    machine_id      UUID REFERENCES machines(id) ON DELETE SET NULL,

    -- Amount in minor units (satang/cents)
    amount          BIGINT NOT NULL,
    currency        VARCHAR(3) DEFAULT 'THB',

    status          payment_status NOT NULL DEFAULT 'PENDING',

    -- Payment provider
    provider        VARCHAR(50),  -- 'stripe', 'promptpay', etc.
    provider_tx_id  VARCHAR(200),
    provider_data   JSONB DEFAULT '{}',

    -- Payment method
    payment_method  VARCHAR(50),  -- 'card', 'promptpay', 'cash'
    card_last_four  VARCHAR(4),
    card_brand      VARCHAR(20),

    -- Refund
    refund_amount   BIGINT DEFAULT 0,
    refunded_at     TIMESTAMP WITH TIME ZONE,
    refund_reason   VARCHAR(500),

    -- Metadata
    description     VARCHAR(500),
    metadata        JSONB DEFAULT '{}',

    -- Idempotency
    idempotency_key VARCHAR(100) UNIQUE,

    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT valid_amount CHECK (amount >= 0),
    CONSTRAINT valid_refund CHECK (refund_amount <= amount)
);

CREATE INDEX idx_transactions_tenant ON transactions(tenant_id);
CREATE INDEX idx_transactions_booking ON transactions(booking_id);
CREATE INDEX idx_transactions_user ON transactions(user_id);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_provider_tx ON transactions(provider_tx_id);
CREATE INDEX idx_transactions_created ON transactions(created_at);

-- ===========================================
-- 8. IOT_LOGS (Machine telemetry)
-- ===========================================
CREATE TABLE iot_logs (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    machine_id      UUID NOT NULL REFERENCES machines(id) ON DELETE CASCADE,

    event_type      VARCHAR(50) NOT NULL,  -- 'heartbeat', 'cycle_start', 'error', etc.

    -- Telemetry data
    payload         JSONB NOT NULL DEFAULT '{}',

    -- Common fields extracted for indexing
    error_code      VARCHAR(20),
    water_temp      DECIMAL(5, 2),
    spin_speed      INT,
    cycle_phase     VARCHAR(50),

    timestamp       TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    -- Partitioning key
    partition_key   DATE GENERATED ALWAYS AS (DATE(timestamp)) STORED
);

-- Partition by month for efficient cleanup
CREATE INDEX idx_iot_logs_machine ON iot_logs(machine_id);
CREATE INDEX idx_iot_logs_tenant ON iot_logs(tenant_id);
CREATE INDEX idx_iot_logs_event ON iot_logs(event_type);
CREATE INDEX idx_iot_logs_timestamp ON iot_logs(timestamp);
CREATE INDEX idx_iot_logs_error ON iot_logs(error_code) WHERE error_code IS NOT NULL;

-- ===========================================
-- 9. AUDIT_LOGS (Compliance)
-- ===========================================
CREATE TABLE audit_logs (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    -- Actor
    actor_id        UUID REFERENCES users(id) ON DELETE SET NULL,
    actor_type      VARCHAR(50) NOT NULL,  -- 'user', 'system', 'api_key'
    actor_name      VARCHAR(100),

    -- Action
    action          VARCHAR(100) NOT NULL,  -- 'user.login', 'machine.create', etc.

    -- Target
    entity_type     VARCHAR(50),  -- 'machine', 'booking', 'user', etc.
    entity_id       UUID,

    -- Details
    old_values      JSONB,
    new_values      JSONB,
    description     TEXT,

    -- Request context
    ip_address      INET,
    user_agent      VARCHAR(500),
    request_id      VARCHAR(100),

    -- Classification
    severity        VARCHAR(20) DEFAULT 'INFO',  -- 'INFO', 'WARNING', 'CRITICAL'

    timestamp       TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_audit_tenant ON audit_logs(tenant_id);
CREATE INDEX idx_audit_actor ON audit_logs(actor_id);
CREATE INDEX idx_audit_action ON audit_logs(action);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_timestamp ON audit_logs(timestamp);
CREATE INDEX idx_audit_severity ON audit_logs(severity);

-- ===========================================
-- 10. EMBEDDINGS (AI RAG)
-- ===========================================
CREATE TABLE embeddings (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    -- Source
    source_type     VARCHAR(50) NOT NULL,  -- 'faq', 'policy', 'manual', 'support_ticket'
    source_id       VARCHAR(200),

    -- Content
    content         TEXT NOT NULL,
    title           VARCHAR(200),
    metadata        JSONB DEFAULT '{}',

    -- Vector (OpenAI ada-002 = 1536 dimensions)
    embedding       vector(1536),

    -- Version control
    version         INT DEFAULT 1,
    is_active       BOOLEAN DEFAULT TRUE,

    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_embeddings_tenant ON embeddings(tenant_id);
CREATE INDEX idx_embeddings_source ON embeddings(source_type);
CREATE INDEX idx_embeddings_active ON embeddings(is_active);

-- Vector similarity search index (IVFFlat)
CREATE INDEX idx_embeddings_vector ON embeddings
    USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);

-- ===========================================
-- 11. NOTIFICATIONS (Queue)
-- ===========================================
CREATE TABLE notifications (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id         UUID REFERENCES users(id) ON DELETE CASCADE,

    channel         VARCHAR(20) NOT NULL,  -- 'email', 'line', 'push', 'sms'

    -- Recipient
    recipient       VARCHAR(255) NOT NULL,  -- email, LINE ID, device token, etc.

    -- Content
    template        VARCHAR(100) NOT NULL,
    subject         VARCHAR(200),
    body            TEXT,
    data            JSONB DEFAULT '{}',

    -- Status
    status          VARCHAR(20) DEFAULT 'PENDING',  -- 'PENDING', 'SENT', 'FAILED', 'DELIVERED'
    attempts        INT DEFAULT 0,
    last_attempt    TIMESTAMP WITH TIME ZONE,
    error_message   TEXT,

    -- Scheduling
    scheduled_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sent_at         TIMESTAMP WITH TIME ZONE,

    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_notifications_tenant ON notifications(tenant_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_status ON notifications(status);
CREATE INDEX idx_notifications_scheduled ON notifications(scheduled_at) WHERE status = 'PENDING';

-- ===========================================
-- TRIGGERS
-- ===========================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON tenants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_branches_updated_at BEFORE UPDATE ON branches
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_machines_updated_at BEFORE UPDATE ON machines
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_embeddings_updated_at BEFORE UPDATE ON embeddings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Machine status change tracking
CREATE OR REPLACE FUNCTION track_machine_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        NEW.last_status_change = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER track_machine_status BEFORE UPDATE ON machines
    FOR EACH ROW EXECUTE FUNCTION track_machine_status_change();
```

---

## 3. MongoDB Collections

### 3.1 Conversations Collection

```javascript
// Collection: conversations
{
  _id: ObjectId("..."),

  // Multi-tenant
  tenantId: "550e8400-e29b-41d4-a716-446655440000",

  // Session info
  sessionId: "session_abc123",
  userId: "user_xyz789",  // Can be null for anonymous

  // Channel
  channel: "web_chat",  // "web_chat", "line", "api"

  // Status
  status: "active",  // "active", "closed", "escalated"

  // Messages array
  messages: [
    {
      id: "msg_001",
      role: "user",
      content: "What are your operating hours?",
      timestamp: ISODate("2026-01-15T10:30:00Z")
    },
    {
      id: "msg_002",
      role: "assistant",
      content: "Our laundromat at Sukhumvit branch is open daily from 7:00 AM to 10:00 PM...",
      timestamp: ISODate("2026-01-15T10:30:02Z"),
      // RAG context used
      sources: [
        {
          type: "faq",
          id: "faq_hours_001",
          relevance: 0.92
        }
      ],
      // Token usage
      tokens: {
        prompt: 150,
        completion: 80,
        total: 230
      }
    }
  ],

  // Context
  context: {
    branchId: "branch_123",
    machineId: null,
    bookingId: null,
    intentHistory: ["inquiry", "hours"]
  },

  // Metadata
  metadata: {
    userAgent: "Mozilla/5.0...",
    ipAddress: "203.150.x.x",
    language: "th"
  },

  // Analytics
  analytics: {
    messageCount: 2,
    avgResponseTime: 2000,  // ms
    resolved: false,
    escalated: false,
    sentiment: "neutral"
  },

  // Timestamps
  createdAt: ISODate("2026-01-15T10:30:00Z"),
  updatedAt: ISODate("2026-01-15T10:30:02Z"),
  closedAt: null
}

// Indexes
db.conversations.createIndex({ "tenantId": 1, "createdAt": -1 })
db.conversations.createIndex({ "tenantId": 1, "userId": 1 })
db.conversations.createIndex({ "sessionId": 1 }, { unique: true })
db.conversations.createIndex({ "status": 1 })
db.conversations.createIndex({ "createdAt": 1 }, { expireAfterSeconds: 7776000 }) // 90 days TTL
```

### 3.2 AI Insights Collection

```javascript
// Collection: ai_insights
{
  _id: ObjectId("..."),

  tenantId: "550e8400-e29b-41d4-a716-446655440000",
  branchId: "branch_123",

  // Insight type
  type: "anomaly_detection",  // "anomaly_detection", "demand_forecast", "revenue_insight"

  // Target
  entityType: "machine",
  entityId: "machine_456",

  // Insight data
  insight: {
    title: "Unusual Error Pattern Detected",
    description: "Machine WM-001 showing 3x more E05 errors than average",
    severity: "warning",  // "info", "warning", "critical"
    confidence: 0.87,

    // Structured data
    data: {
      errorCode: "E05",
      occurrences: 15,
      timeframe: "24h",
      avgOccurrences: 5,
      trend: "increasing"
    },

    // Recommendations
    recommendations: [
      {
        action: "schedule_maintenance",
        priority: "high",
        reason: "Drain pump may need replacement"
      }
    ]
  },

  // Status
  status: "new",  // "new", "acknowledged", "resolved", "dismissed"
  acknowledgedBy: null,
  acknowledgedAt: null,

  // Timestamps
  createdAt: ISODate("2026-01-15T08:00:00Z"),
  expiresAt: ISODate("2026-01-22T08:00:00Z")  // 7 day expiry
}

// Indexes
db.ai_insights.createIndex({ "tenantId": 1, "createdAt": -1 })
db.ai_insights.createIndex({ "tenantId": 1, "type": 1, "status": 1 })
db.ai_insights.createIndex({ "entityType": 1, "entityId": 1 })
db.ai_insights.createIndex({ "expiresAt": 1 }, { expireAfterSeconds: 0 })
```

### 3.3 Daily Summaries Collection

```javascript
// Collection: daily_summaries
{
  _id: ObjectId("..."),

  tenantId: "550e8400-e29b-41d4-a716-446655440000",
  branchId: "branch_123",

  // Date (one per branch per day)
  date: ISODate("2026-01-15T00:00:00Z"),

  // Generated summary
  summary: {
    // Natural language summary
    narrative: "Today was a busy day with 87 completed cycles. Revenue was 15% above average at ฿4,350. Machine WM-003 had 2 brief offline periods but recovered automatically...",

    // Key metrics
    metrics: {
      totalCycles: 87,
      revenue: 435000,  // satang
      uniqueCustomers: 45,
      avgWaitTime: 12,  // minutes
      machineUtilization: 0.72,
      peakHour: 14
    },

    // Highlights
    highlights: [
      {
        type: "positive",
        message: "Revenue 15% above weekly average"
      },
      {
        type: "warning",
        message: "WM-003 offline twice (auto-recovered)"
      }
    ],

    // Action items
    actionItems: [
      {
        priority: "medium",
        action: "Check WM-003 water inlet filter",
        reason: "Offline events may indicate clogging"
      }
    ],

    // Comparison
    comparison: {
      vsYesterday: {
        revenue: 0.08,  // +8%
        cycles: 0.05    // +5%
      },
      vsWeekAgo: {
        revenue: 0.15,
        cycles: 0.12
      }
    }
  },

  // Generation metadata
  generatedAt: ISODate("2026-01-16T00:30:00Z"),
  modelVersion: "gpt-4-0125",
  tokensUsed: 850
}

// Indexes
db.daily_summaries.createIndex({ "tenantId": 1, "branchId": 1, "date": -1 }, { unique: true })
db.daily_summaries.createIndex({ "date": 1 })
```

---

## 4. Redis Data Structures

### 4.1 Key Naming Convention

```
{namespace}:{tenant}:{entity}:{id}:{attribute}

Examples:
- cache:tenant:550e8400:machine:123:status
- session:tenant:550e8400:user:456:data
- lock:tenant:550e8400:booking:slot:789
- stream:tenant:550e8400:events:iot
```

### 4.2 Cache Keys

```redis
# Machine status cache (TTL: 30s)
HSET cache:t:550e8400:machine:123:status
    status "BUSY"
    progress 45
    cycle_id "cycle_789"
    updated_at "2026-01-15T10:30:00Z"
EXPIRE cache:t:550e8400:machine:123:status 30

# Dashboard summary cache (TTL: 5min)
HSET cache:t:550e8400:branch:456:dashboard
    total_machines 12
    available 8
    busy 3
    offline 1
    revenue_today 435000
    cycles_today 87
EXPIRE cache:t:550e8400:branch:456:dashboard 300

# User session (TTL: 15min sliding)
HSET session:t:550e8400:user:789:data
    user_id "789"
    email "user@example.com"
    role "OWNER"
    branch_ids '["branch_1","branch_2"]'
    last_activity "2026-01-15T10:30:00Z"
EXPIRE session:t:550e8400:user:789:data 900
```

### 4.3 Distributed Locks

```redis
# Booking slot lock (TTL: 10s, auto-release)
SET lock:t:550e8400:booking:machine:123:slot:2026-01-15T14:00
    owner:request_abc123
    NX
    EX 10

# Payment processing lock (TTL: 30s)
SET lock:t:550e8400:payment:booking:456
    owner:request_def456
    NX
    EX 30

# Idempotency key (TTL: 24h)
SET idempotency:t:550e8400:key:req_xyz789
    '{"status":"completed","booking_id":"booking_123"}'
    NX
    EX 86400
```

### 4.4 Redis Streams (Event Bus)

```redis
# Stream: IoT events
XADD stream:events:iot MAXLEN ~10000 *
    tenant_id "550e8400"
    machine_id "123"
    event_type "status_change"
    payload '{"from":"AVAILABLE","to":"BUSY"}'
    timestamp "2026-01-15T10:30:00Z"

# Stream: AI tasks
XADD stream:ai:tasks *
    tenant_id "550e8400"
    task_type "chat_response"
    session_id "session_abc"
    payload '{"message":"What are your hours?"}'
    priority "normal"

# Stream: AI results
XADD stream:ai:results *
    tenant_id "550e8400"
    task_id "task_123"
    status "completed"
    result '{"response":"We are open 7AM-10PM..."}'

# Consumer groups
XGROUP CREATE stream:events:iot ai-worker-group $ MKSTREAM
XGROUP CREATE stream:ai:tasks ai-worker-group $ MKSTREAM

# Reading (consumer)
XREADGROUP GROUP ai-worker-group worker-1
    COUNT 10
    BLOCK 5000
    STREAMS stream:ai:tasks >
```

### 4.5 Pub/Sub Channels

```redis
# Real-time machine status updates (WebSocket relay)
PUBLISH pubsub:t:550e8400:machine:123:status
    '{"status":"BUSY","progress":50}'

# Notification triggers
PUBLISH pubsub:notifications:send
    '{"tenant_id":"550e8400","channel":"line","user_id":"456","template":"cycle_complete"}'

# Admin broadcasts
PUBLISH pubsub:admin:announcements
    '{"type":"maintenance","message":"Scheduled maintenance at 2AM"}'
```

---

## 5. Indexing Strategy

### 5.1 PostgreSQL Indexes

| Table        | Index                          | Type    | Purpose                      |
| ------------ | ------------------------------ | ------- | ---------------------------- |
| machines     | tenant_id                      | B-tree  | Tenant filter (most queries) |
| machines     | (tenant_id, status)            | B-tree  | Available machines lookup    |
| machines     | branch_id                      | B-tree  | Branch filter                |
| bookings     | (machine_id, start_at, end_at) | B-tree  | Time slot availability       |
| bookings     | tenant_id, status              | B-tree  | Dashboard queries            |
| transactions | created_at                     | B-tree  | Revenue reports              |
| iot_logs     | (machine_id, timestamp)        | B-tree  | Telemetry analysis           |
| embeddings   | embedding                      | IVFFlat | Vector similarity            |

### 5.2 Query Optimization Examples

```sql
-- Most common: List available machines for a branch
-- Uses: idx_machines_branch, idx_machines_status
EXPLAIN ANALYZE
SELECT * FROM machines
WHERE branch_id = $1 AND status = 'AVAILABLE'
ORDER BY label;

-- Booking availability check
-- Uses: idx_bookings_time_range with exclusion constraint
EXPLAIN ANALYZE
SELECT EXISTS (
    SELECT 1 FROM bookings
    WHERE machine_id = $1
    AND status NOT IN ('CANCELLED', 'NO_SHOW')
    AND tstzrange($2, $3) && tstzrange(start_at, end_at)
);

-- Revenue report
-- Uses: idx_transactions_created, idx_transactions_tenant
EXPLAIN ANALYZE
SELECT
    DATE(created_at) as date,
    SUM(amount) as revenue,
    COUNT(*) as transactions
FROM transactions
WHERE tenant_id = $1
    AND status = 'COMPLETED'
    AND created_at >= $2
GROUP BY DATE(created_at)
ORDER BY date;
```

---

## 6. Data Retention Policy

| Data Type         | Retention     | Archive      | Reason     |
| ----------------- | ------------- | ------------ | ---------- |
| **Transactions**  | 7 years       | Cold storage | Legal/Tax  |
| **Audit Logs**    | 2 years       | Cold storage | Compliance |
| **IoT Logs**      | 90 days       | Delete       | Volume     |
| **Bookings**      | 2 years       | Archive      | Analytics  |
| **Conversations** | 90 days       | Summarize    | Privacy    |
| **AI Insights**   | 7 days        | Delete       | Freshness  |
| **Embeddings**    | Until updated | Replace      | Accuracy   |

### 6.1 Cleanup Jobs

```sql
-- Daily: Clean expired refresh tokens
DELETE FROM refresh_tokens WHERE expires_at < NOW() - INTERVAL '7 days';

-- Daily: Archive old IoT logs (90 days)
INSERT INTO iot_logs_archive SELECT * FROM iot_logs WHERE timestamp < NOW() - INTERVAL '90 days';
DELETE FROM iot_logs WHERE timestamp < NOW() - INTERVAL '90 days';

-- Monthly: Archive old transactions
INSERT INTO transactions_archive SELECT * FROM transactions WHERE created_at < NOW() - INTERVAL '2 years';
```
