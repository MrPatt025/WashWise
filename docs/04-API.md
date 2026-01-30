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

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `branchId` | uuid | Filter by branch |
| `status` | enum | AVAILABLE, BUSY, OFFLINE, MAINTENANCE |
| `type` | enum | WASHER, DRYER |

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

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `machineId` | uuid | Filter by machine |
| `branchId` | uuid | Filter by branch |
| `status` | enum | PENDING, CONFIRMED, IN_PROGRESS, COMPLETED, CANCELLED |
| `startDate` | date | Filter by date range start |
| `endDate` | date | Filter by date range end |

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

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `machineId` | uuid | Yes | Machine to check |
| `date` | date | Yes | Date to check |

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

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `branchId` | uuid | Filter by branch |
| `type` | enum | anomaly, forecast, recommendation |
| `severity` | enum | info, warning, critical |

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

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `branchId` | uuid | Branch to summarize |
| `date` | date | Date for summary (default: yesterday) |

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

## 10. OpenAPI Specification Structure

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

## 11. Versioning Strategy

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
