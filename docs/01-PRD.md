# WashWise Enterprise - Product Requirement Document (PRD)

## 1. Executive Summary

**WashWise** is an enterprise-grade, multi-tenant SaaS platform for smart laundromat management. It
combines real-time IoT machine monitoring, intelligent booking systems, secure payment processing,
and AI-powered analytics to help laundromat owners optimize operations and improve customer
experience.

### Vision Statement

> "Empower laundromat businesses with intelligent automation, real-time insights, and AI-driven
> optimization to maximize revenue and customer satisfaction."

### Product Goals

1. **Operational Efficiency**: Reduce machine downtime by 40% through predictive maintenance
2. **Revenue Optimization**: Increase machine utilization by 25% through smart scheduling
3. **Customer Experience**: Provide seamless booking, payment, and notification experience
4. **Business Intelligence**: Deliver actionable insights through AI-powered analytics

---

## 2. Scope

### 2.1 In Scope

| Category               | Features                                                                   |
| ---------------------- | -------------------------------------------------------------------------- |
| **Multi-Tenancy**      | Multiple laundromat brands/chains, per-tenant data isolation, tiered plans |
| **User Management**    | RBAC for Owner/Staff/Customer roles, OAuth2/OIDC authentication            |
| **Machine Management** | Real-time status, IoT telemetry ingestion, maintenance scheduling          |
| **Booking System**     | Time-slot reservations, conflict prevention, cancellation policies         |
| **Payment Processing** | Payment intents, webhooks, refunds, transaction history                    |
| **Notifications**      | LINE/Email/Push for cycle completion, errors, payment status               |
| **AI Features**        | Customer support bot, anomaly detection, revenue forecasting               |
| **Analytics**          | Dashboards for revenue, utilization, booking patterns                      |
| **Audit & Compliance** | Full audit trail, GDPR-ready data handling                                 |

### 2.2 Out of Scope (v1)

- Mobile native apps (iOS/Android) - Future phase
- Hardware manufacturing/provisioning
- Physical payment terminal integration
- Franchise management features
- White-label customization

### 2.3 Non-Goals

- Replacing existing POS systems (integration-first approach)
- Real-time video monitoring
- Customer social features
- Loyalty/rewards program (v2 consideration)

---

## 3. Personas

### 3.1 Shop Owner (Primary)

**Profile**: Somchai, 45, owns 3 laundromat branches in Bangkok

**Pain Points**:

- Cannot monitor all branches simultaneously
- Unclear which machines need maintenance
- No visibility into revenue trends across locations
- Relies on staff reports which are often delayed

**Goals**:

- Real-time visibility into all branches from one dashboard
- Predictive alerts before machines fail
- Automated revenue reports and forecasting
- Reduced operational overhead

**Success Metrics**:

- 30% reduction in unexpected machine failures
- Daily operation reports without manual input
- Cross-branch revenue comparison in real-time

---

### 3.2 Staff Member

**Profile**: Nong, 28, works at the flagship branch

**Pain Points**:

- Paper-based machine status tracking
- Customer complaints about broken machines
- No clear priority for maintenance tasks
- Communication gaps with owner

**Goals**:

- Clear dashboard showing machine status
- Automated task prioritization
- Easy customer issue escalation
- Digital log of daily activities

**Success Metrics**:

- Zero paper forms
- < 5 min response to machine issues
- Clear daily task list from AI assistant

---

### 3.3 Customer

**Profile**: Ploy, 32, young professional living in a condo

**Pain Points**:

- Arrives at laundromat to find all machines busy
- No notification when laundry is done
- Uncertain about machine availability

**Goals**:

- Reserve machines in advance
- Get notified when cycle completes
- View real-time machine availability
- Quick and easy payment

**Success Metrics**:

- Zero wasted trips (booking confirmation)
- < 5 min notification delay after cycle completion
- One-tap payment

---

## 4. User Journeys

### 4.1 Owner Onboarding Journey

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        OWNER ONBOARDING JOURNEY                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌────────┐│
│  │ Sign Up  │───▶│  Verify  │───▶│  Setup   │───▶│   Add    │───▶│  Live  ││
│  │ Account  │    │  Email   │    │  Tenant  │    │ Machines │    │        ││
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘    └────────┘│
│       │               │               │               │               │      │
│       ▼               ▼               ▼               ▼               ▼      │
│  • Email/Pass    • Click link    • Business      • Serial #       • Dashboard│
│  • OAuth2        • 24hr expiry     name          • Machine type   • Real-time│
│  • Terms agree   • Re-send        • Branch info  • Pricing        • AI ready │
│                    option         • Plan select  • Location                  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Detailed Steps**:

1. **Account Creation** (2 min)
   - Visit landing page → Click "Start Free Trial"
   - Enter email, password (or OAuth2 with Google/LINE)
   - Accept terms and privacy policy

2. **Email Verification** (1 min)
   - Receive verification email
   - Click link to verify (24-hour expiry)
   - Redirect to tenant setup wizard

3. **Tenant Configuration** (5 min)
   - Business name and logo upload
   - Primary branch information (name, address, hours)
   - Select plan tier (FREE trial → upgrade later)
   - Configure notification preferences

4. **Machine Registration** (10 min per branch)
   - Add machines manually or bulk CSV import
   - For each machine: serial number, type, capacity, pricing
   - Assign to branch location (floor map optional)
   - Test IoT connectivity (if hardware integrated)

5. **Go Live** (immediate)
   - Dashboard becomes active
   - AI onboarding assistant provides tips
   - Invite staff members (optional)

---

### 4.2 Customer Booking & Payment Journey

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     CUSTOMER BOOKING JOURNEY                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌────────┐│
│  │  Browse  │───▶│  Select  │───▶│  Confirm │───▶│  Payment │───▶│  Use   ││
│  │ Machines │    │   Slot   │    │  Booking │    │          │    │        ││
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘    └────────┘│
│       │               │               │               │               │      │
│       ▼               ▼               ▼               ▼               ▼      │
│  • Real-time     • Calendar      • Review        • Stripe/       • QR code  │
│    availability    view           details         PromptPay      • Start    │
│  • Filter by     • Time slots    • Total cost    • Hold amount    cycle     │
│    type/size     • Duration      • T&C           • Webhook       • Notify   │
│                    select                          confirm        complete  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Detailed Steps**:

1. **Browse Available Machines** (1 min)
   - Open web app or scan branch QR code
   - View real-time machine availability
   - Filter by type (washer/dryer), capacity, price

2. **Select Time Slot** (1 min)
   - Choose date and time slot
   - Select cycle duration
   - System checks availability in real-time
   - Shows estimated completion time

3. **Confirm Booking** (30 sec)
   - Review booking details
   - See total cost breakdown
   - Accept booking terms
   - Optional: save payment method

4. **Payment** (30 sec)
   - Choose payment method (card, PromptPay, LINE Pay)
   - Payment intent created (hold amount)
   - Receive confirmation via LINE/email
   - Booking ID and QR code generated

5. **Use Machine** (during cycle)
   - Arrive at scheduled time
   - Scan QR code or enter booking ID
   - Machine unlocks and starts
   - Real-time progress in app
   - Push notification on completion

---

### 4.3 Staff Daily Operations Journey

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      STAFF DAILY OPERATIONS                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌────────┐│
│  │  Login   │───▶│  Review  │───▶│  Handle  │───▶│  Monitor │───▶│  End   ││
│  │  Shift   │    │  Tasks   │    │  Issues  │    │  Status  │    │  Shift ││
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘    └────────┘│
│       │               │               │               │               │      │
│       ▼               ▼               ▼               ▼               ▼      │
│  • Clock in      • AI summary    • Alerts        • Dashboard     • Log out  │
│  • Branch        • Priority        queue         • Real-time     • AI daily │
│    select          list          • Customer      • Escalate        summary  │
│                  • Yesterday's     support       • Report issue  • Handover │
│                    issues                                           notes   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Detailed Steps**:

1. **Start Shift** (2 min)
   - Login with staff credentials
   - Select assigned branch
   - Clock in (time tracking)
   - View AI-generated morning briefing

2. **Review Tasks** (5 min)
   - AI assistant shows priority tasks:
     - Machine #3 showing error patterns (preventive check)
     - 2 customer complaints from yesterday
     - Detergent inventory low
   - Accept/defer tasks

3. **Handle Issues** (ongoing)
   - Receive real-time alerts for machine errors
   - Access customer support queue
   - Log resolution actions
   - Escalate to owner if needed

4. **Monitor Operations** (ongoing)
   - Dashboard shows all machine statuses
   - Upcoming bookings list
   - Revenue counter for the day
   - Customer feedback notifications

5. **End Shift** (5 min)
   - Review completed tasks
   - Add handover notes
   - AI generates shift summary
   - Clock out

---

## 5. Feature Requirements

### 5.1 Multi-Tenant Management

| Requirement | Priority | Description                                 |
| ----------- | -------- | ------------------------------------------- |
| MT-001      | P0       | Tenant registration with email verification |
| MT-002      | P0       | Complete data isolation between tenants     |
| MT-003      | P0       | Tiered plans: FREE, BASIC, PRO, ENTERPRISE  |
| MT-004      | P1       | Multiple branches per tenant                |
| MT-005      | P1       | Plan upgrade/downgrade workflow             |
| MT-006      | P2       | Custom domain per tenant (Enterprise)       |
| MT-007      | P2       | Tenant suspension/termination workflow      |

### 5.2 User Management

| Requirement | Priority | Description                               |
| ----------- | -------- | ----------------------------------------- |
| UM-001      | P0       | OAuth2/OIDC authentication                |
| UM-002      | P0       | Role-based access: OWNER, STAFF, CUSTOMER |
| UM-003      | P0       | Secure password policy (Argon2id)         |
| UM-004      | P1       | Invite staff via email link               |
| UM-005      | P1       | Account lockout after failed attempts     |
| UM-006      | P1       | Password reset flow                       |
| UM-007      | P2       | Two-factor authentication (TOTP)          |
| UM-008      | P2       | Session management (view/revoke)          |

### 5.3 Machine Management

| Requirement | Priority | Description                                   |
| ----------- | -------- | --------------------------------------------- |
| MM-001      | P0       | CRUD operations for machines                  |
| MM-002      | P0       | Real-time status updates                      |
| MM-003      | P0       | Status: AVAILABLE, BUSY, OFFLINE, MAINTENANCE |
| MM-004      | P1       | IoT telemetry ingestion                       |
| MM-005      | P1       | Maintenance scheduling                        |
| MM-006      | P1       | Error code catalog                            |
| MM-007      | P2       | Machine health score                          |
| MM-008      | P2       | Predictive maintenance alerts                 |

### 5.4 Booking System

| Requirement | Priority | Description                               |
| ----------- | -------- | ----------------------------------------- |
| BK-001      | P0       | Create/view/cancel bookings               |
| BK-002      | P0       | Prevent double-booking (distributed lock) |
| BK-003      | P0       | Time slot management                      |
| BK-004      | P1       | Booking reminders                         |
| BK-005      | P1       | Cancellation policy enforcement           |
| BK-006      | P1       | No-show handling                          |
| BK-007      | P2       | Recurring bookings                        |
| BK-008      | P2       | Waitlist for busy slots                   |

### 5.5 Payment Processing

| Requirement | Priority | Description                         |
| ----------- | -------- | ----------------------------------- |
| PM-001      | P0       | Payment intent creation             |
| PM-002      | P0       | Webhook handling for payment status |
| PM-003      | P0       | Transaction history                 |
| PM-004      | P1       | Refund processing                   |
| PM-005      | P1       | Multiple payment methods            |
| PM-006      | P1       | Invoice generation                  |
| PM-007      | P2       | Subscription billing for plans      |
| PM-008      | P2       | Revenue analytics                   |

### 5.6 AI Features

| Requirement | Priority | Description                          |
| ----------- | -------- | ------------------------------------ |
| AI-001      | P1       | Customer support chatbot (RAG-based) |
| AI-002      | P1       | Anomaly detection for machines       |
| AI-003      | P2       | Revenue forecasting                  |
| AI-004      | P2       | Demand prediction                    |
| AI-005      | P2       | Daily staff summary generation       |
| AI-006      | P2       | Smart maintenance scheduling         |

---

## 6. Success Metrics

### 6.1 Technical KPIs

| Metric                    | Target  | Measurement      |
| ------------------------- | ------- | ---------------- |
| API Response Time (p99)   | < 200ms | Prometheus       |
| System Uptime             | 99.9%   | CloudWatch       |
| Error Rate                | < 0.1%  | Application logs |
| Database Query Time (p95) | < 50ms  | APM              |

### 6.2 Business KPIs

| Metric                       | Target              | Measurement         |
| ---------------------------- | ------------------- | ------------------- |
| Machine Utilization          | +25%                | Analytics dashboard |
| Unexpected Downtime          | -40%                | Maintenance logs    |
| Customer Booking Adoption    | 60% of transactions | Payment records     |
| Owner Dashboard Daily Active | 80%                 | Login analytics     |

### 6.3 User Satisfaction

| Metric                        | Target | Measurement           |
| ----------------------------- | ------ | --------------------- |
| Owner NPS                     | > 50   | Quarterly survey      |
| Customer Booking Success Rate | > 95%  | Transaction data      |
| Staff Task Completion         | > 90%  | Task logs             |
| AI Chatbot Resolution Rate    | > 70%  | Conversation analysis |

---

## 7. Constraints & Assumptions

### 7.1 Technical Constraints

- Must support 100 concurrent tenants with 10 branches each
- Peak load: 1,000 bookings/hour
- Data retention: 2 years for transactions, 90 days for IoT logs
- Must comply with Thai PDPA regulations

### 7.2 Business Constraints

- Initial launch: Bangkok metropolitan area
- Language support: Thai and English
- Currency: THB only (v1)
- Payment providers: Stripe (cards), PromptPay (local)

### 7.3 Assumptions

- Laundromats have stable internet connectivity
- IoT integration will use standard MQTT protocol
- Customers have smartphones with LINE app installed
- Staff have basic computer literacy

---

## 8. Risks & Mitigations

| Risk                      | Impact   | Probability | Mitigation                 |
| ------------------------- | -------- | ----------- | -------------------------- |
| IoT connectivity issues   | High     | Medium      | Offline mode with sync     |
| Payment provider downtime | High     | Low         | Multiple provider fallback |
| AI model accuracy         | Medium   | Medium      | Human escalation path      |
| Data breach               | Critical | Low         | Security audit, encryption |
| Tenant data leakage       | Critical | Low         | Strict isolation testing   |

---

## 9. Timeline Overview

| Phase                   | Duration | Key Deliverables                             |
| ----------------------- | -------- | -------------------------------------------- |
| **Phase 1: MVP**        | 3 months | Core API, Basic UI, Auth, Machines, Bookings |
| **Phase 2: Growth**     | 3 months | Payments, Notifications, AI Chatbot          |
| **Phase 3: Enterprise** | 3 months | Advanced AI, Multi-branch, Analytics         |

---

## 10. Appendix

### 10.1 Glossary

| Term    | Definition                                     |
| ------- | ---------------------------------------------- |
| Tenant  | A laundromat business/brand using the platform |
| Branch  | A physical location belonging to a tenant      |
| Cycle   | One wash or dry operation on a machine         |
| Booking | A reserved time slot for a machine             |
| IoT Log | Telemetry data from a smart machine            |

### 10.2 References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Thai PDPA Guidelines](https://www.pdpc.or.th/)
- [Stripe API Documentation](https://stripe.com/docs/api)
- [LINE Messaging API](https://developers.line.biz/en/docs/messaging-api/)
