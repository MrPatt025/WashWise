# WashWise Enterprise - API Design

## 1. API Overview

### 1.1 Design Principles

| Principle      | Implementation                              |
| -------------- | ------------------------------------------- |
| **RESTful**    | Resource-oriented URLs, standard HTTP verbs |
| **Versioned**  | `/api/v1/` prefix, backwards compatibility  |
| **Consistent** | Unified error format, pagination, filtering |
| **Secure**     | OAuth2, rate limiting, CORS                 |
| **Documented** | OpenAPI 3.1 with examples                   |

### 1.2 Base URL

```
Production: https://api.washwise.io/api/v1
Staging:    https://api.staging.washwise.io/api/v1
Local:      http://localhost:8080/api/v1
```

### 1.3 Authentication

```http
Authorization: Bearer <access_token>
X-Tenant-ID: <tenant_id>  # Optional, derived from token
```

---

## 2. Common Standards

### 2.1 Request/Response Format

```http
Content-Type: application/json
Accept: application/json
```

### 2.2 Standard Response Envelope

**Success Response:**

```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "requestId": "req_abc123",
    "timestamp": "2026-01-15T10:30:00Z"
  }
}
```

**Paginated Response:**

```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "totalItems": 156,
    "totalPages": 8,
    "hasNext": true,
    "hasPrev": false
  },
  "meta": {
    "requestId": "req_abc123",
    "timestamp": "2026-01-15T10:30:00Z"
  }
}
```

**Error Response:**

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request parameters",
    "details": [
      {
        "field": "email",
        "message": "Invalid email format",
        "code": "INVALID_FORMAT"
      }
    ],
    "requestId": "req_abc123"
  },
  "meta": {
    "timestamp": "2026-01-15T10:30:00Z"
  }
}
```

### 2.3 Error Codes

| HTTP Status | Error Code            | Description                         |
| ----------- | --------------------- | ----------------------------------- |
| 400         | `VALIDATION_ERROR`    | Invalid request parameters          |
| 400         | `INVALID_REQUEST`     | Malformed request                   |
| 401         | `UNAUTHORIZED`        | Missing or invalid token            |
| 401         | `TOKEN_EXPIRED`       | Access token expired                |
| 403         | `FORBIDDEN`           | Insufficient permissions            |
| 404         | `NOT_FOUND`           | Resource not found                  |
| 409         | `CONFLICT`            | Resource conflict (e.g., duplicate) |
| 409         | `BOOKING_CONFLICT`    | Time slot already booked            |
| 422         | `UNPROCESSABLE`       | Business rule violation             |
| 429         | `RATE_LIMITED`        | Too many requests                   |
| 500         | `INTERNAL_ERROR`      | Server error                        |
| 503         | `SERVICE_UNAVAILABLE` | Service temporarily down            |

### 2.4 Pagination Parameters

```http
GET /api/v1/machines?page=1&pageSize=20&sort=createdAt&order=desc
```

| Parameter  | Type    | Default   | Description              |
| ---------- | ------- | --------- | ------------------------ |
| `page`     | integer | 1         | Page number (1-indexed)  |
| `pageSize` | integer | 20        | Items per page (max 100) |
| `sort`     | string  | createdAt | Sort field               |
| `order`    | string  | desc      | Sort order: asc/desc     |

### 2.5 Filtering

```http
GET /api/v1/machines?status=AVAILABLE&type=WASHER&branchId=123
```

### 2.6 Rate Limiting Headers

```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640000000
```

---

## 3. Authentication API

### 3.1 Register Tenant & Owner

```http
POST /api/v1/auth/register
```

**Request:**

```json
{
  "tenantName": "CleanWave Laundromat",
  "ownerName": "Somchai Jaidee",
  "email": "somchai@cleanwave.co.th",
  "password": "SecurePass123!",
  "phone": "+66812345678",
  "plan": "FREE"
}
```

**Response (201 Created):**

```json
{
  "success": true,
  "data": {
    "tenant": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "CleanWave Laundromat",
      "slug": "cleanwave-laundromat",
      "plan": "FREE"
    },
    "user": {
      "id": "660e8400-e29b-41d4-a716-446655440000",
      "email": "somchai@cleanwave.co.th",
      "name": "Somchai Jaidee",
      "role": "OWNER"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJSUzI1NiIs...",
      "expiresIn": 900,
      "tokenType": "Bearer"
    }
  }
}
```

### 3.2 Login

```http
POST /api/v1/auth/login
```

**Request:**

```json
{
  "email": "somchai@cleanwave.co.th",
  "password": "SecurePass123!"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "660e8400-e29b-41d4-a716-446655440000",
      "email": "somchai@cleanwave.co.th",
      "name": "Somchai Jaidee",
      "role": "OWNER",
      "tenantId": "550e8400-e29b-41d4-a716-446655440000"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJSUzI1NiIs...",
      "expiresIn": 900,
      "tokenType": "Bearer"
    }
  }
}
```

> **Note:** Refresh token is set as HttpOnly cookie automatically

### 3.3 Refresh Token

```http
POST /api/v1/auth/refresh
```

**Request:** (Cookie sent automatically)

```
Cookie: refreshToken=eyJhbGciOiJSUzI1NiIs...
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJSUzI1NiIs...",
    "expiresIn": 900,
    "tokenType": "Bearer"
  }
}
```

### 3.4 Logout

```http
POST /api/v1/auth/logout
Authorization: Bearer <access_token>
```

**Response (204 No Content)**

### 3.5 Get Current User

```http
GET /api/v1/auth/me
Authorization: Bearer <access_token>
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "id": "660e8400-e29b-41d4-a716-446655440000",
    "email": "somchai@cleanwave.co.th",
    "name": "Somchai Jaidee",
    "role": "OWNER",
    "tenant": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "CleanWave Laundromat",
      "plan": "PRO"
    },
    "branches": [
      {
        "id": "770e8400-e29b-41d4-a716-446655440000",
        "name": "Sukhumvit Branch"
      }
    ]
  }
}
```

---

## 4. Machines API

### 4.1 List Machines

```http
GET /api/v1/machines
Authorization: Bearer <access_token>
```

**Query Parameters:** | Parameter | Type | Description | |-----------|------|-------------| |
`branchId` | uuid | Filter by branch | | `status` | enum | AVAILABLE, BUSY, OFFLINE, MAINTENANCE | |
`type` | enum | WASHER, DRYER |

**Response (200 OK):**

```json
{
  "success": true,
  "data": [
    {
      "id": "880e8400-e29b-41d4-a716-446655440000",
      "serialNumber": "WM-001",
      "label": "Washer 1",
      "type": "WASHER",
      "capacityKg": 8.0,
      "status": "AVAILABLE",
      "pricePerCycle": 35.0,
      "branch": {
        "id": "770e8400-e29b-41d4-a716-446655440000",
        "name": "Sukhumvit Branch"
      },
      "locationHint": "Row A, Position 1",
      "healthScore": 0.95,
      "lastMaintenance": "2026-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "totalItems": 12,
    "totalPages": 1
  }
}
```

### 4.2 Get Machine Details

```http
GET /api/v1/machines/{machineId}
Authorization: Bearer <access_token>
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "id": "880e8400-e29b-41d4-a716-446655440000",
    "serialNumber": "WM-001",
    "label": "Washer 1",
    "type": "WASHER",
    "capacityKg": 8.0,
    "manufacturer": "LG",
    "model": "WM-F1234",
    "status": "AVAILABLE",
    "pricePerCycle": 35.0,
    "currency": "THB",
    "branch": {
      "id": "770e8400-e29b-41d4-a716-446655440000",
      "name": "Sukhumvit Branch"
    },
    "locationHint": "Row A, Position 1",
    "floor": 1,
    "iotDeviceId": "iot_abc123",
    "firmwareVersion": "2.1.0",
    "lastHeartbeat": "2026-01-15T10:29:00Z",
    "healthScore": 0.95,
    "totalCycles": 1523,
    "lastMaintenance": "2026-01-01T00:00:00Z",
    "nextMaintenance": "2026-02-01T00:00:00Z",
    "createdAt": "2025-06-01T00:00:00Z",
    "updatedAt": "2026-01-15T10:30:00Z"
  }
}
```

### 4.3 Create Machine

```http
POST /api/v1/machines
Authorization: Bearer <access_token>
```

**Request:**

```json
{
  "branchId": "770e8400-e29b-41d4-a716-446655440000",
  "serialNumber": "WM-013",
  "label": "Washer 13",
  "type": "WASHER",
  "capacityKg": 10.0,
  "manufacturer": "Samsung",
  "model": "WF-5678",
  "pricePerCycle": 40.0,
  "locationHint": "Row C, Position 1",
  "floor": 2
}
```

**Response (201 Created):**

```json
{
  "success": true,
  "data": {
    "id": "990e8400-e29b-41d4-a716-446655440000",
    "serialNumber": "WM-013",
    "label": "Washer 13",
    "status": "AVAILABLE",
    ...
  }
}
```

### 4.4 Update Machine

```http
PATCH /api/v1/machines/{machineId}
Authorization: Bearer <access_token>
```

**Request:**

```json
{
  "label": "Washer 13 - Large",
  "pricePerCycle": 45.0,
  "status": "MAINTENANCE"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "id": "990e8400-e29b-41d4-a716-446655440000",
    "label": "Washer 13 - Large",
    "pricePerCycle": 45.00,
    "status": "MAINTENANCE",
    ...
  }
}
```

### 4.5 Delete Machine

```http
DELETE /api/v1/machines/{machineId}
Authorization: Bearer <access_token>
```

**Response (204 No Content)**

### 4.6 Get Machine Status (Real-time)

```http
GET /api/v1/machines/{machineId}/status
Authorization: Bearer <access_token>
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "machineId": "880e8400-e29b-41d4-a716-446655440000",
    "status": "BUSY",
    "currentCycle": {
      "id": "cycle_abc123",
      "startedAt": "2026-01-15T10:00:00Z",
      "estimatedEndAt": "2026-01-15T10:45:00Z",
      "progress": 67,
      "phase": "SPIN",
      "remainingMinutes": 15
    },
    "lastHeartbeat": "2026-01-15T10:30:00Z",
    "online": true
  }
}
```

---

## 5. Bookings API

### 5.1 List Bookings

```http
GET /api/v1/bookings
Authorization: Bearer <access_token>
```

**Query Parameters:** | Parameter | Type | Description | |-----------|------|-------------| |
`machineId` | uuid | Filter by machine | | `branchId` | uuid | Filter by branch | | `status` | enum
| PENDING, CONFIRMED, IN_PROGRESS, COMPLETED, CANCELLED | | `startDate` | date | Filter by date
range start | | `endDate` | date | Filter by date range end |

**Response (200 OK):**

```json
{
  "success": true,
  "data": [
    {
      "id": "booking_abc123",
      "machine": {
        "id": "880e8400-e29b-41d4-a716-446655440000",
        "label": "Washer 1",
        "type": "WASHER"
      },
      "user": {
        "id": "user_xyz789",
        "name": "Ploy Customer"
      },
      "startAt": "2026-01-15T14:00:00Z",
      "endAt": "2026-01-15T14:45:00Z",
      "durationMinutes": 45,
      "status": "CONFIRMED",
      "priceSnapshot": 35.00,
      "createdAt": "2026-01-15T10:00:00Z"
    }
  ],
  "pagination": { ... }
}
```

### 5.2 Check Availability

```http
GET /api/v1/bookings/availability
Authorization: Bearer <access_token>
```

**Query Parameters:** | Parameter | Type | Required | Description |
|-----------|------|----------|-------------| | `machineId` | uuid | Yes | Machine to check | |
`date` | date | Yes | Date to check |

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "machineId": "880e8400-e29b-41d4-a716-446655440000",
    "date": "2026-01-15",
    "slots": [
      {
        "startAt": "2026-01-15T07:00:00Z",
        "endAt": "2026-01-15T08:00:00Z",
        "available": true
      },
      {
        "startAt": "2026-01-15T08:00:00Z",
        "endAt": "2026-01-15T09:00:00Z",
        "available": false,
        "bookedBy": "existing_booking"
      },
      ...
    ]
  }
}
```

### 5.3 Create Booking

```http
POST /api/v1/bookings
Authorization: Bearer <access_token>
X-Idempotency-Key: unique_key_abc123
```

**Request:**

```json
{
  "machineId": "880e8400-e29b-41d4-a716-446655440000",
  "startAt": "2026-01-15T14:00:00Z",
  "durationMinutes": 45,
  "notes": "Will arrive 5 min early"
}
```

**Response (201 Created):**

```json
{
  "success": true,
  "data": {
    "id": "booking_def456",
    "machine": {
      "id": "880e8400-e29b-41d4-a716-446655440000",
      "label": "Washer 1"
    },
    "startAt": "2026-01-15T14:00:00Z",
    "endAt": "2026-01-15T14:45:00Z",
    "durationMinutes": 45,
    "status": "PENDING",
    "priceSnapshot": 35.0,
    "qrCode": "data:image/png;base64,...",
    "bookingCode": "WW-ABC123"
  }
}
```

**Error (409 Conflict):**

```json
{
  "success": false,
  "error": {
    "code": "BOOKING_CONFLICT",
    "message": "The requested time slot is no longer available",
    "details": {
      "conflictingBooking": {
        "startAt": "2026-01-15T13:30:00Z",
        "endAt": "2026-01-15T14:15:00Z"
      },
      "suggestedSlots": [
        {
          "startAt": "2026-01-15T14:30:00Z",
          "endAt": "2026-01-15T15:15:00Z"
        }
      ]
    }
  }
}
```

### 5.4 Cancel Booking

```http
POST /api/v1/bookings/{bookingId}/cancel
Authorization: Bearer <access_token>
```

**Request:**

```json
{
  "reason": "Change of plans"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "id": "booking_def456",
    "status": "CANCELLED",
    "cancelledAt": "2026-01-15T11:00:00Z",
    "cancelReason": "Change of plans",
    "refundEligible": true,
    "refundAmount": 35.0
  }
}
```

---

## 6. Payments API

### 6.1 Create Payment Intent

```http
POST /api/v1/payments/intents
Authorization: Bearer <access_token>
X-Idempotency-Key: unique_key_xyz789
```

**Request:**

```json
{
  "bookingId": "booking_def456",
  "paymentMethod": "card",
  "currency": "THB"
}
```

**Response (201 Created):**

```json
{
  "success": true,
  "data": {
    "id": "pi_abc123",
    "bookingId": "booking_def456",
    "amount": 3500,
    "currency": "THB",
    "status": "PENDING",
    "clientSecret": "pi_abc123_secret_xyz",
    "paymentMethods": ["card", "promptpay"],
    "expiresAt": "2026-01-15T11:30:00Z"
  }
}
```

### 6.2 Confirm Payment

```http
POST /api/v1/payments/intents/{paymentIntentId}/confirm
Authorization: Bearer <access_token>
```

**Request:**

```json
{
  "paymentMethodId": "pm_card_visa_4242"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "id": "pi_abc123",
    "status": "COMPLETED",
    "transactionId": "txn_def456",
    "receipt": {
      "id": "rcpt_ghi789",
      "url": "https://receipts.washwise.io/rcpt_ghi789"
    },
    "booking": {
      "id": "booking_def456",
      "status": "CONFIRMED"
    }
  }
}
```

### 6.3 Payment Webhook

```http
POST /api/v1/payments/webhooks/stripe
X-Stripe-Signature: t=1640000000,v1=...
```

**Request (from Stripe):**

```json
{
  "type": "payment_intent.succeeded",
  "data": {
    "object": {
      "id": "pi_stripe_123",
      "amount": 3500,
      "currency": "thb",
      "metadata": {
        "bookingId": "booking_def456",
        "tenantId": "550e8400-e29b-41d4-a716-446655440000"
      }
    }
  }
}
```

**Response (200 OK):**

```json
{
  "received": true
}
```

### 6.4 Request Refund

```http
POST /api/v1/payments/transactions/{transactionId}/refund
Authorization: Bearer <access_token>
```

**Request:**

```json
{
  "amount": 3500,
  "reason": "Customer cancelled within policy window"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "id": "refund_jkl012",
    "transactionId": "txn_def456",
    "amount": 3500,
    "status": "PENDING",
    "estimatedArrival": "2026-01-17T00:00:00Z"
  }
}
```

---

## 7. Notifications API

### 7.1 Subscribe to Notifications

```http
POST /api/v1/notifications/subscribe
Authorization: Bearer <access_token>
```

**Request:**

```json
{
  "channel": "line",
  "token": "U1234567890abcdef",
  "events": ["cycle_complete", "machine_error", "booking_reminder"]
}
```

**Response (201 Created):**

```json
{
  "success": true,
  "data": {
    "subscriptionId": "sub_abc123",
    "channel": "line",
    "events": ["cycle_complete", "machine_error", "booking_reminder"],
    "status": "active"
  }
}
```

### 7.2 Send Test Notification

```http
POST /api/v1/notifications/test
Authorization: Bearer <access_token>
```

**Request:**

```json
{
  "channel": "line",
  "template": "cycle_complete"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "sent": true,
    "channel": "line",
    "template": "cycle_complete"
  }
}
```

---

## 8. AI API

### 8.1 Chat with AI Assistant

```http
POST /api/v1/ai/chat
Authorization: Bearer <access_token>
```

**Request:**

```json
{
  "sessionId": "session_abc123",
  "message": "What are your opening hours?",
  "context": {
    "branchId": "770e8400-e29b-41d4-a716-446655440000"
  }
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "sessionId": "session_abc123",
    "response": "Our Sukhumvit branch is open daily from 7:00 AM to 10:00 PM. Is there anything else I can help you with?",
    "sources": [
      {
        "type": "faq",
        "title": "Operating Hours",
        "relevance": 0.95
      }
    ],
    "suggestedActions": [
      {
        "type": "booking",
        "label": "Book a machine now"
      }
    ]
  }
}
```

### 8.2 Get AI Insights

```http
GET /api/v1/ai/insights
Authorization: Bearer <access_token>
```

**Query Parameters:** | Parameter | Type | Description | |-----------|------|-------------| |
`branchId` | uuid | Filter by branch | | `type` | enum | anomaly, forecast, recommendation | |
`severity` | enum | info, warning, critical |

**Response (200 OK):**

```json
{
  "success": true,
  "data": [
    {
      "id": "insight_xyz789",
      "type": "anomaly",
      "severity": "warning",
      "title": "Unusual Error Pattern",
      "description": "Machine WM-003 showing 3x more E05 errors than average",
      "entityType": "machine",
      "entityId": "880e8400-e29b-41d4-a716-446655440000",
      "confidence": 0.87,
      "recommendations": [
        {
          "action": "Schedule maintenance check",
          "priority": "high"
        }
      ],
      "createdAt": "2026-01-15T08:00:00Z"
    }
  ]
}
```

### 8.3 Get Daily Summary

```http
GET /api/v1/ai/summary
Authorization: Bearer <access_token>
```

**Query Parameters:** | Parameter | Type | Description | |-----------|------|-------------| |
`branchId` | uuid | Branch to summarize | | `date` | date | Date for summary (default: yesterday) |

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "date": "2026-01-14",
    "branch": {
      "id": "770e8400-e29b-41d4-a716-446655440000",
      "name": "Sukhumvit Branch"
    },
    "narrative": "Yesterday was a busy day with 87 completed cycles, generating ฿4,350 in revenue (15% above average)...",
    "metrics": {
      "totalCycles": 87,
      "revenue": 435000,
      "uniqueCustomers": 45,
      "machineUtilization": 0.72
    },
    "highlights": [
      {
        "type": "positive",
        "message": "Revenue 15% above weekly average"
      }
    ],
    "actionItems": [
      {
        "priority": "medium",
        "action": "Check WM-003 water inlet filter"
      }
    ]
  }
}
```

---

## 9. Admin API

### 9.1 List Tenants (Super Admin)

```http
GET /api/v1/admin/tenants
Authorization: Bearer <access_token>
X-Admin-Key: <admin_api_key>
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "CleanWave Laundromat",
      "plan": "PRO",
      "status": "active",
      "stats": {
        "branches": 3,
        "machines": 45,
        "users": 12,
        "monthlyRevenue": 125000
      },
      "createdAt": "2025-06-01T00:00:00Z"
    }
  ],
  "pagination": { ... }
}
```

### 9.2 Upgrade Tenant Plan

```http
POST /api/v1/admin/tenants/{tenantId}/upgrade
Authorization: Bearer <access_token>
```

**Request:**

```json
{
  "plan": "ENTERPRISE",
  "effectiveDate": "2026-02-01"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "tenantId": "550e8400-e29b-41d4-a716-446655440000",
    "previousPlan": "PRO",
    "newPlan": "ENTERPRISE",
    "effectiveDate": "2026-02-01T00:00:00Z"
  }
}
```

---

## 10. Analytics API

Business intelligence and analytics endpoints for real-time insights, machine performance tracking, revenue analysis, and usage patterns.

### 10.1 Dashboard Analytics

Get comprehensive dashboard metrics including overview, machine status, revenue, and utilization.

```http
GET /api/v1/analytics/dashboard
Authorization: Bearer <access_token>
```

**Query Parameters:**
| Parameter  | Type | Description                      |
| ---------- | ---- | -------------------------------- |
| `period`   | enum | DAY, WEEK, MONTH (default: WEEK) |
| `branchId` | uuid | Filter by branch (optional)      |

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "overview": {
      "totalMachines": 24,
      "activeMachines": 18,
      "totalBranches": 3,
      "totalUsers": 156,
      "healthScore": 92.5,
      "uptime": 99.2
    },
    "machineStats": {
      "byStatus": {
        "AVAILABLE": 12,
        "BUSY": 6,
        "MAINTENANCE": 4,
        "OFFLINE": 2
      },
      "byType": {
        "WASHER": 14,
        "DRYER": 10
      },
      "healthScore": 92.5
    },
    "revenueMetrics": {
      "today": 4500.00,
      "todayTrend": 12.5,
      "thisWeek": 28500.00,
      "weekTrend": 8.3,
      "thisMonth": 125000.00,
      "monthTrend": 15.2,
      "currency": "THB"
    },
    "utilizationMetrics": {
      "currentRate": 75.0,
      "averageDaily": 68.5,
      "peakHours": ["10:00", "14:00", "18:00"],
      "lowHours": ["06:00", "22:00"]
    }
  }
}
```

### 10.2 Machine Statistics

Get detailed machine status distribution and health metrics.

```http
GET /api/v1/analytics/machines/stats
Authorization: Bearer <access_token>
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "byStatus": {
      "AVAILABLE": 12,
      "BUSY": 6,
      "MAINTENANCE": 4,
      "OFFLINE": 2
    },
    "byType": {
      "WASHER": 14,
      "DRYER": 10
    },
    "healthScore": 92.5
  }
}
```

### 10.3 Utilization Metrics

Get machine utilization rates, peak hours, and capacity analysis.

```http
GET /api/v1/analytics/utilization
Authorization: Bearer <access_token>
```

**Query Parameters:**
| Parameter | Type | Description                      |
| --------- | ---- | -------------------------------- |
| `period`  | enum | DAY, WEEK, MONTH (default: WEEK) |

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "currentRate": 75.0,
    "averageDaily": 68.5,
    "peakHours": ["10:00", "14:00", "18:00"],
    "lowHours": ["06:00", "22:00"],
    "hourlyDistribution": [
      { "hour": 6, "rate": 15.0 },
      { "hour": 7, "rate": 25.0 },
      { "hour": 8, "rate": 45.0 },
      { "hour": 9, "rate": 65.0 },
      { "hour": 10, "rate": 85.0 }
    ]
  }
}
```

### 10.4 Revenue Metrics

Get revenue analytics with trend analysis across different time periods.

```http
GET /api/v1/analytics/revenue
Authorization: Bearer <access_token>
```

**Query Parameters:**
| Parameter  | Type | Description                             |
| ---------- | ---- | --------------------------------------- |
| `period`   | enum | DAY, WEEK, MONTH, YEAR (default: MONTH) |
| `branchId` | uuid | Filter by branch (optional)             |

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "today": 4500.00,
    "todayTrend": 12.5,
    "thisWeek": 28500.00,
    "weekTrend": 8.3,
    "thisMonth": 125000.00,
    "monthTrend": 15.2,
    "thisYear": 1450000.00,
    "yearTrend": 22.8,
    "currency": "THB",
    "breakdown": {
      "byMachineType": {
        "WASHER": 85000.00,
        "DRYER": 40000.00
      },
      "byBranch": [
        { "branchId": "uuid", "name": "Sukhumvit", "revenue": 65000.00 },
        { "branchId": "uuid", "name": "Silom", "revenue": 60000.00 }
      ]
    }
  }
}
```

### 10.5 Performance Metrics

Get machine performance, uptime statistics, and error rates.

```http
GET /api/v1/analytics/performance
Authorization: Bearer <access_token>
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "uptime": 99.2,
    "avgCycleTime": 42.5,
    "errorRate": 0.8,
    "mtbf": 720.5,
    "maintenanceCompliance": 95.0,
    "customerSatisfaction": 4.7
  }
}
```

### 10.6 Machine Rankings

Get top-performing or problematic machines ranked by various metrics.

```http
GET /api/v1/analytics/machines/rankings
Authorization: Bearer <access_token>
```

**Query Parameters:**
| Parameter | Type    | Description                                |
| --------- | ------- | ------------------------------------------ |
| `metric`  | enum    | REVENUE, CYCLES, ERRORS (default: REVENUE) |
| `limit`   | integer | Number of results (default: 10, max: 50)   |
| `order`   | enum    | ASC, DESC (default: DESC)                  |

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "rankings": [
      {
        "rank": 1,
        "machine": {
          "id": "uuid",
          "label": "Washer 1",
          "type": "WASHER",
          "branchName": "Sukhumvit Branch"
        },
        "value": 45000.00,
        "trend": 15.2
      },
      {
        "rank": 2,
        "machine": {
          "id": "uuid",
          "label": "Washer 3",
          "type": "WASHER",
          "branchName": "Silom Branch"
        },
        "value": 42500.00,
        "trend": 8.7
      }
    ],
    "metric": "REVENUE",
    "currency": "THB"
  }
}
```

### 10.7 Usage Patterns

Get hourly and daily usage pattern analysis for capacity planning.

```http
GET /api/v1/analytics/usage-pattern
Authorization: Bearer <access_token>
```

**Query Parameters:**
| Parameter | Type | Description                      |
| --------- | ---- | -------------------------------- |
| `period`  | enum | DAY, WEEK, MONTH (default: WEEK) |

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "hourlyPattern": [
      { "hour": 0, "avgUsage": 5.2, "peakUsage": 12.0 },
      { "hour": 1, "avgUsage": 3.1, "peakUsage": 8.0 },
      { "hour": 6, "avgUsage": 15.5, "peakUsage": 28.0 },
      { "hour": 10, "avgUsage": 85.2, "peakUsage": 98.0 },
      { "hour": 14, "avgUsage": 78.5, "peakUsage": 95.0 },
      { "hour": 18, "avgUsage": 82.3, "peakUsage": 96.0 }
    ],
    "dailyPattern": [
      { "day": "Monday", "avgUsage": 65.0 },
      { "day": "Tuesday", "avgUsage": 58.5 },
      { "day": "Wednesday", "avgUsage": 62.3 },
      { "day": "Thursday", "avgUsage": 60.8 },
      { "day": "Friday", "avgUsage": 72.5 },
      { "day": "Saturday", "avgUsage": 88.2 },
      { "day": "Sunday", "avgUsage": 82.7 }
    ],
    "recommendations": [
      "Consider extending hours on Saturday - high demand detected",
      "Peak hours identified: 10:00-12:00 and 17:00-20:00",
      "Low utilization between 01:00-05:00 - consider reduced hours"
    ]
  }
}
```

---

## 11. Reports API

Advanced reporting and export endpoints with multiple formats for comprehensive business analysis.

### 11.1 Revenue Report

Generate comprehensive revenue reports with breakdowns by time period, branch, and payment method.

```http
GET /api/v1/reports/revenue
Authorization: Bearer <access_token>
```

**Query Parameters:**
| Parameter   | Type | Description                                                                               |
| ----------- | ---- | ----------------------------------------------------------------------------------------- |
| `period`    | enum | today, yesterday, last7days, last30days, thisWeek, thisMonth, lastMonth, thisYear, custom |
| `startDate` | date | Start date for custom period (required if period=custom)                                  |
| `endDate`   | date | End date for custom period (required if period=custom)                                    |
| `branchId`  | uuid | Filter by branch (optional)                                                               |
| `groupBy`   | enum | day, week, month (default: day)                                                           |
| `format`    | enum | json, csv (default: json)                                                                 |

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "summary": {
      "totalRevenue": 125000.00,
      "transactionCount": 2450,
      "avgTransactionValue": 51.02,
      "growth": 15.2,
      "period": {
        "start": "2025-01-01T00:00:00Z",
        "end": "2025-01-31T23:59:59Z"
      }
    },
    "breakdown": [
      {
        "date": "2025-01-01",
        "totalRevenue": 4250.00,
        "transactionCount": 85,
        "avgTransactionValue": 50.00,
        "byPaymentMethod": { "PROMPTPAY": 2500, "CASH": 1750 },
        "byMachineType": { "WASHER": 2800, "DRYER": 1450 }
      }
    ],
    "byBranch": [
      { "branchId": "uuid", "branchName": "Sukhumvit", "revenue": 65000, "transactions": 1200 }
    ],
    "byPaymentMethod": { "PROMPTPAY": 75000, "CASH": 35000, "CREDIT_CARD": 15000 }
  }
}
```

### 11.2 Machine Utilization Report

Generate machine utilization reports showing performance metrics for each machine.

```http
GET /api/v1/reports/utilization
Authorization: Bearer <access_token>
```

**Query Parameters:**
| Parameter   | Type | Description                  |
| ----------- | ---- | ---------------------------- |
| `period`    | enum | Same as revenue report       |
| `startDate` | date | Start date for custom period |
| `endDate`   | date | End date for custom period   |
| `branchId`  | uuid | Filter by branch (optional)  |

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "summary": {
      "totalMachines": 24,
      "avgUtilization": 68.5,
      "totalCycles": 4850,
      "totalRevenue": 125000.00,
      "topPerformers": [...],
      "underutilized": [...]
    },
    "machines": [
      {
        "machineId": "uuid",
        "machineName": "Washer-01",
        "machineType": "WASHER",
        "branchName": "Sukhumvit",
        "totalCycles": 285,
        "totalRuntime": 12825,
        "utilizationRate": 78.5,
        "revenue": 8550.00,
        "avgCycleDuration": 45
      }
    ]
  }
}
```

### 11.3 Maintenance Report

Generate maintenance and downtime reports for fleet management.

```http
GET /api/v1/reports/maintenance
Authorization: Bearer <access_token>
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "summary": {
      "totalMachines": 24,
      "machinesNeedingMaintenance": 4,
      "totalMaintenanceCost": 12500.00,
      "avgDowntimePerMachine": 45
    },
    "machines": [
      {
        "machineId": "uuid",
        "machineName": "Washer-05",
        "maintenanceCount": 2,
        "totalDowntime": 180,
        "avgRepairTime": 90,
        "maintenanceCosts": 2500.00,
        "lastMaintenanceDate": "2025-01-15T10:00:00Z",
        "issueCategories": { "Routine Maintenance": 1, "Belt Replacement": 1 }
      }
    ]
  }
}
```

### 11.4 Customer Insights Report

Generate customer behavior analytics and insights.

```http
GET /api/v1/reports/customer-insights
Authorization: Bearer <access_token>
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "summary": {
      "totalCustomers": 1250,
      "avgSpendPerCustomer": 100.00,
      "totalTransactions": 4850,
      "peakHour": "18:00",
      "peakDay": "Saturday"
    },
    "topSpenders": [
      { "customerId": "id", "transactionCount": 45, "totalSpent": 2250.00 }
    ],
    "frequentUsers": [
      { "customerId": "id", "transactionCount": 62, "totalSpent": 1860.00 }
    ],
    "timeAnalysis": {
      "hourlyDistribution": { "10": 245, "18": 385, "20": 312 },
      "dayOfWeekDistribution": { "0": 580, "6": 720 }
    }
  }
}
```

### 11.5 Operational Performance Report

Generate operational metrics and branch performance comparisons.

```http
GET /api/v1/reports/operational
Authorization: Bearer <access_token>
```

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "summary": {
      "totalMachines": 24,
      "fleetHealth": 92.5,
      "throughputPerHour": 6.8,
      "revenuePerMachine": 5208.33,
      "totalRevenue": 125000.00,
      "totalTransactions": 4850
    },
    "machineStatus": {
      "available": 12,
      "inUse": 6,
      "maintenance": 4,
      "offline": 2
    },
    "branchPerformance": [
      {
        "branchId": "uuid",
        "branchName": "Sukhumvit",
        "machines": 10,
        "revenue": 65000.00,
        "transactions": 1200
      }
    ]
  }
}
```

---

## 12. OpenAPI Specification Structure

```yaml
openapi: 3.1.0
info:
  title: WashWise Enterprise API
  version: 1.0.0
  description: Smart Laundromat Management Platform API

servers:
  - url: https://api.washwise.io/api/v1
    description: Production
  - url: https://api.staging.washwise.io/api/v1
    description: Staging

tags:
  - name: Authentication
    description: User authentication and authorization
  - name: Machines
    description: Machine management
  - name: Bookings
    description: Booking and scheduling
  - name: Payments
    description: Payment processing
  - name: Notifications
    description: Notification management
  - name: Analytics
    description: Business intelligence and analytics
  - name: AI
    description: AI-powered features
  - name: Admin
    description: Administrative operations

components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT

  schemas:
    Error:
      type: object
      properties:
        success:
          type: boolean
          example: false
        error:
          $ref: "#/components/schemas/ErrorDetails"

    ErrorDetails:
      type: object
      properties:
        code:
          type: string
        message:
          type: string
        details:
          type: array
          items:
            $ref: "#/components/schemas/FieldError"

    Machine:
      type: object
      properties:
        id:
          type: string
          format: uuid
        serialNumber:
          type: string
        label:
          type: string
        type:
          type: string
          enum: [WASHER, DRYER]
        status:
          type: string
          enum: [AVAILABLE, BUSY, OFFLINE, MAINTENANCE]
        # ... more properties

security:
  - bearerAuth: []
```

---

## 13. Versioning Strategy

### Current: v1

- Base path: `/api/v1/`
- Stability: Stable, no breaking changes

### Future: v2 (When needed)

- Base path: `/api/v2/`
- v1 deprecation notice: 6 months
- v1 end-of-life: 12 months after v2 release

### Breaking Change Policy

- Breaking changes only in major versions
- Additive changes (new fields, endpoints) allowed in minor versions
- Deprecation warnings via `X-API-Deprecation` header
