# WashWise Enterprise - System Architecture

## 1. Architecture Overview

### 1.1 High-Level Architecture

WashWise follows an **Asynchronous Microservices Architecture** with clear separation between:

- **Core API Service ("Brain")**: Business logic, authentication, data management
- **AI Agent Worker ("Muscle")**: AI/ML processing, chatbot, analytics
- **Frontend Applications**: Web dashboard for owners/staff

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              WASHWISE ENTERPRISE ARCHITECTURE                            │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                          │
│    ┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐         │
│    │   Web Admin     │         │   Customer App  │         │   IoT Devices   │         │
│    │   (Next.js 16)  │         │   (Future PWA)  │         │   (MQTT)        │         │
│    └────────┬────────┘         └────────┬────────┘         └────────┬────────┘         │
│             │                           │                           │                   │
│             └───────────────────────────┼───────────────────────────┘                   │
│                                         │                                               │
│                              ┌──────────▼──────────┐                                    │
│                              │    AWS ALB / CDN    │                                    │
│                              │   (Load Balancer)   │                                    │
│                              └──────────┬──────────┘                                    │
│                                         │                                               │
│    ┌────────────────────────────────────┼────────────────────────────────────┐         │
│    │                         API Gateway Layer                                │         │
│    └────────────────────────────────────┼────────────────────────────────────┘         │
│                                         │                                               │
│         ┌───────────────────────────────┼───────────────────────────────┐              │
│         │                               │                               │              │
│         ▼                               ▼                               ▼              │
│    ┌─────────────┐              ┌─────────────┐              ┌─────────────┐           │
│    │  Core API   │◄────────────▶│   Redis     │◄────────────▶│  AI Worker  │           │
│    │  Service    │   Events     │  Cluster    │   Events     │  Service    │           │
│    │ (Java 21)   │              │             │              │ (Python)    │           │
│    └──────┬──────┘              └──────┬──────┘              └──────┬──────┘           │
│           │                            │                            │                   │
│           │                            │ Cache/Pub-Sub              │                   │
│           │                            │                            │                   │
│           ▼                            ▼                            ▼                   │
│    ┌─────────────┐              ┌─────────────┐              ┌─────────────┐           │
│    │ PostgreSQL  │              │   Redis     │              │  MongoDB    │           │
│    │ + pgvector  │              │  Streams    │              │ (Chat Logs) │           │
│    │             │              │             │              │             │           │
│    └─────────────┘              └─────────────┘              └─────────────┘           │
│                                                                                         │
│    ┌─────────────────────────────────────────────────────────────────────────┐         │
│    │                        External Services                                 │         │
│    │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │         │
│    │  │  Stripe  │  │   LINE   │  │  SendGrid│  │  OpenAI  │  │    S3    │  │         │
│    │  │ Payments │  │ Messaging│  │   Email  │  │   LLM    │  │  Storage │  │         │
│    │  └──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │         │
│    └─────────────────────────────────────────────────────────────────────────┘         │
│                                                                                         │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Why Asynchronous Microservices?

| Benefit               | Explanation                                                         |
| --------------------- | ------------------------------------------------------------------- |
| **Scalability**       | Scale AI workers independently during peak analysis hours           |
| **Fault Isolation**   | AI service failure doesn't affect booking/payment flows             |
| **Technology Fit**    | Java for business logic, Python for AI/ML (best tools for each job) |
| **Team Autonomy**     | Backend team and AI team can deploy independently                   |
| **Cost Optimization** | Scale AI workers only when needed (event-driven)                    |

### 1.3 Communication Patterns

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                        COMMUNICATION PATTERNS                                 │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│   SYNCHRONOUS (Request/Response)                                              │
│   ─────────────────────────────                                               │
│   • Client → Core API: REST over HTTPS                                        │
│   • Core API → PostgreSQL: JDBC                                               │
│   • AI Worker → MongoDB: MongoDB Driver                                       │
│                                                                               │
│   ASYNCHRONOUS (Event-Driven)                                                 │
│   ──────────────────────────                                                  │
│   • Core API → AI Worker: Redis Streams                                       │
│   • AI Worker → Core API: Redis Streams (results)                             │
│   • IoT Devices → Core API: MQTT → Redis                                      │
│                                                                               │
│   ┌─────────┐    Redis Streams    ┌─────────┐                                │
│   │  Core   │ ──────────────────▶ │   AI    │                                │
│   │   API   │                     │ Worker  │                                │
│   │         │ ◀────────────────── │         │                                │
│   └─────────┘    Redis Streams    └─────────┘                                │
│                  (Results)                                                    │
│                                                                               │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Service Decomposition

### 2.1 Core API Service (Java 21 + Spring Boot 4)

**Responsibilities**:

- Multi-tenant management (tenants, branches, plans)
- User authentication and authorization (OAuth2/OIDC)
- Machine inventory and status management
- Booking lifecycle management
- Payment processing orchestration
- Notification dispatch coordination
- Audit logging

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         CORE API SERVICE                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌──────────────────────────────────────────────────────────────────────┐  │
│   │                        API Layer (REST)                               │  │
│   │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐ │  │
│   │  │   Auth   │  │ Machines │  │ Bookings │  │ Payments │  │ Admin  │ │  │
│   │  │Controller│  │Controller│  │Controller│  │Controller│  │  API   │ │  │
│   │  └──────────┘  └──────────┘  └──────────┘  └──────────┘  └────────┘ │  │
│   └──────────────────────────────────────────────────────────────────────┘  │
│                                      │                                       │
│   ┌──────────────────────────────────▼──────────────────────────────────┐   │
│   │                       Service Layer                                  │   │
│   │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐│   │
│   │  │  Auth    │  │ Machine  │  │ Booking  │  │ Payment  │  │ Notif. ││   │
│   │  │ Service  │  │ Service  │  │ Service  │  │ Service  │  │Service ││   │
│   │  └──────────┘  └──────────┘  └──────────┘  └──────────┘  └────────┘│   │
│   └──────────────────────────────────────────────────────────────────────┘  │
│                                      │                                       │
│   ┌──────────────────────────────────▼──────────────────────────────────┐   │
│   │                     Domain Layer (Entities)                          │   │
│   │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐│   │
│   │  │  Tenant  │  │   User   │  │ Machine  │  │ Booking  │  │Payment ││   │
│   │  │  Entity  │  │  Entity  │  │  Entity  │  │  Entity  │  │ Entity ││   │
│   │  └──────────┘  └──────────┘  └──────────┘  └──────────┘  └────────┘│   │
│   └──────────────────────────────────────────────────────────────────────┘  │
│                                      │                                       │
│   ┌──────────────────────────────────▼──────────────────────────────────┐   │
│   │                   Infrastructure Layer                               │   │
│   │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐            │   │
│   │  │   JPA    │  │  Redis   │  │  Event   │  │ External │            │   │
│   │  │ Repos    │  │  Client  │  │Publisher │  │ Clients  │            │   │
│   │  └──────────┘  └──────────┘  └──────────┘  └──────────┘            │   │
│   └──────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Inbound Interfaces**:

- REST API (OpenAPI 3.1)
- WebSocket (for real-time machine status)

**Outbound Interfaces**:

- PostgreSQL (JPA/Hibernate)
- Redis (Cache + Pub/Sub)
- Redis Streams (Events to AI Worker)
- Stripe API (Payments)
- LINE/SendGrid API (Notifications)

---

### 2.2 AI Agent Worker (Python 3.12 + FastAPI)

**Responsibilities**:

- Customer support chatbot (RAG with tenant-specific knowledge)
- Machine anomaly detection
- Revenue analytics and forecasting
- Daily staff summary generation
- Embedding generation for RAG

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         AI AGENT WORKER                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌──────────────────────────────────────────────────────────────────────┐  │
│   │                     Event Consumers (Redis Streams)                   │  │
│   │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │  │
│   │  │   Chat      │  │  Anomaly    │  │  Analytics  │  │   Summary   │ │  │
│   │  │  Consumer   │  │  Consumer   │  │  Consumer   │  │  Consumer   │ │  │
│   │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘ │  │
│   └──────────────────────────────────────────────────────────────────────┘  │
│                                      │                                       │
│   ┌──────────────────────────────────▼──────────────────────────────────┐   │
│   │                      AI Agents (LangChain/CrewAI)                    │   │
│   │                                                                      │   │
│   │  ┌─────────────────┐        ┌─────────────────┐                     │   │
│   │  │  Support Agent  │        │  Analyst Agent  │                     │   │
│   │  │  ─────────────  │        │  ─────────────  │                     │   │
│   │  │  • RAG Retrieval│        │  • Time Series  │                     │   │
│   │  │  • FAQ Answers  │        │  • Forecasting  │                     │   │
│   │  │  • Escalation   │        │  • Anomaly Det. │                     │   │
│   │  └─────────────────┘        └─────────────────┘                     │   │
│   │                                                                      │   │
│   │  ┌─────────────────┐        ┌─────────────────┐                     │   │
│   │  │ Maintenance Agt │        │  Summary Agent  │                     │   │
│   │  │  ─────────────  │        │  ─────────────  │                     │   │
│   │  │  • Health Score │        │  • Log Analysis │                     │   │
│   │  │  • Predictions  │        │  • Daily Report │                     │   │
│   │  │  • Scheduling   │        │  • Action Items │                     │   │
│   │  └─────────────────┘        └─────────────────┘                     │   │
│   └──────────────────────────────────────────────────────────────────────┘  │
│                                      │                                       │
│   ┌──────────────────────────────────▼──────────────────────────────────┐   │
│   │                     Data & Storage Layer                             │   │
│   │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐            │   │
│   │  │ pgvector │  │ MongoDB  │  │  OpenAI  │  │  Redis   │            │   │
│   │  │Embeddings│  │Chat Logs │  │   API    │  │  Cache   │            │   │
│   │  └──────────┘  └──────────┘  └──────────┘  └──────────┘            │   │
│   └──────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Inbound Interfaces**:

- Redis Streams (Events from Core API)
- REST API (Health checks, manual triggers)

**Outbound Interfaces**:

- PostgreSQL (pgvector for embeddings)
- MongoDB (Conversation history)
- Redis Streams (Results back to Core API)
- OpenAI API (LLM inference)

---

### 2.3 Frontend Application (Next.js 16)

**Responsibilities**:

- Owner/Staff dashboard
- Real-time machine monitoring
- Booking management interface
- Payment status views
- AI assistant chat panel
- Analytics visualizations

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       FRONTEND (Next.js 16)                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌──────────────────────────────────────────────────────────────────────┐  │
│   │                         App Router                                    │  │
│   │  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐     │  │
│   │  │  /login    │  │ /dashboard │  │ /machines  │  │ /bookings  │     │  │
│   │  │            │  │            │  │            │  │            │     │  │
│   │  └────────────┘  └────────────┘  └────────────┘  └────────────┘     │  │
│   │  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐     │  │
│   │  │ /payments  │  │ /analytics │  │ /settings  │  │   /ai      │     │  │
│   │  │            │  │            │  │            │  │            │     │  │
│   │  └────────────┘  └────────────┘  └────────────┘  └────────────┘     │  │
│   └──────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
│   ┌───────────────────────┐  ┌───────────────────────┐                      │
│   │   Server Components   │  │   Client Components   │                      │
│   │   ─────────────────   │  │   ─────────────────   │                      │
│   │   • Data fetching     │  │   • Interactivity     │                      │
│   │   • SEO               │  │   • Real-time updates │                      │
│   │   • Auth checks       │  │   • Form handling     │                      │
│   └───────────────────────┘  └───────────────────────┘                      │
│                                                                              │
│   ┌──────────────────────────────────────────────────────────────────────┐  │
│   │                      State Management                                 │  │
│   │  ┌─────────────────────────┐  ┌─────────────────────────┐           │  │
│   │  │   TanStack Query v5    │  │      Zustand v5         │           │  │
│   │  │   (Server State)       │  │    (Client State)       │           │  │
│   │  │   • API data caching   │  │   • UI state            │           │  │
│   │  │   • Optimistic updates │  │   • User preferences    │           │  │
│   │  │   • Background sync    │  │   • Temporary data      │           │  │
│   │  └─────────────────────────┘  └─────────────────────────┘           │  │
│   └──────────────────────────────────────────────────────────────────────┘  │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Data Flow Diagrams

### 3.1 Booking Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          BOOKING FLOW                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   Customer        Frontend         Core API         Redis         Postgres  │
│      │               │                │               │               │      │
│      │ 1. Select     │                │               │               │      │
│      │────────────▶  │                │               │               │      │
│      │   machine     │ 2. Check       │               │               │      │
│      │               │────────────────▶               │               │      │
│      │               │   availability │ 3. Check      │               │      │
│      │               │                │───────────────▶               │      │
│      │               │                │   cache       │               │      │
│      │               │                │◀──────────────│               │      │
│      │               │◀───────────────│               │               │      │
│      │◀──────────────│   available    │               │               │      │
│      │               │                │               │               │      │
│      │ 4. Confirm    │                │               │               │      │
│      │────────────▶  │ 5. Create      │               │               │      │
│      │   booking     │────────────────▶               │               │      │
│      │               │   booking      │ 6. Acquire    │               │      │
│      │               │                │───────────────▶               │      │
│      │               │                │   lock        │               │      │
│      │               │                │◀──────────────│               │      │
│      │               │                │   (OK)        │               │      │
│      │               │                │                       7. Save │      │
│      │               │                │───────────────────────────────▶      │
│      │               │                │                       booking │      │
│      │               │                │◀──────────────────────────────│      │
│      │               │                │ 8. Release    │               │      │
│      │               │                │───────────────▶               │      │
│      │               │                │   lock        │               │      │
│      │               │                │ 9. Publish    │               │      │
│      │               │                │───────────────▶               │      │
│      │               │                │   event       │               │      │
│      │               │◀───────────────│               │               │      │
│      │◀──────────────│   confirmed    │               │               │      │
│      │               │                │               │               │      │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 AI Chat Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          AI CHAT FLOW                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   User      Frontend     Core API      Redis       AI Worker    MongoDB     │
│    │           │            │            │             │            │        │
│    │ 1. Send   │            │            │             │            │        │
│    │──────────▶│            │            │             │            │        │
│    │  message  │ 2. Forward │            │             │            │        │
│    │           │───────────▶│            │             │            │        │
│    │           │            │ 3. Publish │             │            │        │
│    │           │            │────────────▶             │            │        │
│    │           │            │  to stream │ 4. Consume  │            │        │
│    │           │            │            │────────────▶│            │        │
│    │           │            │            │             │ 5. Get     │        │
│    │           │            │            │             │───────────▶│        │
│    │           │            │            │             │  history   │        │
│    │           │            │            │             │◀───────────│        │
│    │           │            │            │             │            │        │
│    │           │            │            │             │ 6. RAG     │        │
│    │           │            │            │             │ retrieval  │        │
│    │           │            │            │             │ (pgvector) │        │
│    │           │            │            │             │            │        │
│    │           │            │            │             │ 7. LLM     │        │
│    │           │            │            │             │ inference  │        │
│    │           │            │            │             │            │        │
│    │           │            │            │             │ 8. Save    │        │
│    │           │            │            │             │───────────▶│        │
│    │           │            │            │             │  response  │        │
│    │           │            │            │ 9. Publish  │            │        │
│    │           │            │            │◀────────────│            │        │
│    │           │            │            │  result     │            │        │
│    │           │            │◀───────────│             │            │        │
│    │           │◀───────────│ 10. SSE    │             │            │        │
│    │◀──────────│  response  │            │             │            │        │
│    │           │            │            │             │            │        │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.3 IoT Telemetry Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       IoT TELEMETRY FLOW                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   IoT Device   MQTT Broker    Core API      Redis      AI Worker   Postgres │
│       │            │             │            │            │            │    │
│       │ 1. MQTT    │             │            │            │            │    │
│       │───────────▶│             │            │            │            │    │
│       │  telemetry │ 2. Webhook  │            │            │            │    │
│       │            │────────────▶│            │            │            │    │
│       │            │             │ 3. Save    │            │            │    │
│       │            │             │────────────────────────────────────▶│    │
│       │            │             │  iot_log   │            │            │    │
│       │            │             │            │            │            │    │
│       │            │             │ 4. Update  │            │            │    │
│       │            │             │───────────▶│            │            │    │
│       │            │             │  cache     │            │            │    │
│       │            │             │            │            │            │    │
│       │            │             │ 5. Publish │            │            │    │
│       │            │             │───────────▶│            │            │    │
│       │            │             │  event     │ 6. Consume │            │    │
│       │            │             │            │───────────▶│            │    │
│       │            │             │            │            │            │    │
│       │            │             │            │            │ 7. Analyze │    │
│       │            │             │            │            │  (anomaly) │    │
│       │            │             │            │            │            │    │
│       │            │             │            │ 8. Alert   │            │    │
│       │            │             │◀───────────│◀───────────│            │    │
│       │            │             │  (if any)  │            │            │    │
│       │            │             │            │            │            │    │
│       │            │             │ 9. Notify  │            │            │    │
│       │            │             │  owner     │            │            │    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Technology Decisions

### 4.1 Why Java 21 for Core API?

| Factor                  | Decision                                                          |
| ----------------------- | ----------------------------------------------------------------- |
| **Virtual Threads**     | Handle 10,000+ concurrent requests without thread pool exhaustion |
| **Enterprise Maturity** | Battle-tested in banking/enterprise for similar workloads         |
| **Spring Ecosystem**    | Security, Data, Cloud all integrated                              |
| **Type Safety**         | Catch errors at compile time for business-critical logic          |
| **Performance**         | JIT compilation, excellent for long-running services              |

### 4.2 Why Python for AI Worker?

| Factor              | Decision                                      |
| ------------------- | --------------------------------------------- |
| **AI/ML Libraries** | LangChain, NumPy, pandas, scikit-learn native |
| **LLM Integration** | First-class support in all AI SDKs            |
| **Rapid Iteration** | Quick prototyping for AI experiments          |
| **Community**       | Largest AI/ML community and examples          |
| **FastAPI**         | Modern async framework, auto OpenAPI docs     |

### 4.3 Why Redis Streams (not Kafka)?

| Factor         | Decision                                             |
| -------------- | ---------------------------------------------------- |
| **Simplicity** | Already using Redis for cache, no new infrastructure |
| **Scale Fit**  | Handles 10,000+ msg/sec, sufficient for our load     |
| **Latency**    | Sub-millisecond for real-time features               |
| **Operations** | Single Redis cluster to manage                       |
| **Cost**       | Lower operational cost than Kafka cluster            |

### 4.4 Why PostgreSQL + pgvector (not dedicated vector DB)?

| Factor                     | Decision                                         |
| -------------------------- | ------------------------------------------------ |
| **Operational Simplicity** | One database for relational + vector data        |
| **Transactions**           | ACID guarantees for embeddings with metadata     |
| **Scale Fit**              | Handles millions of vectors with proper indexing |
| **Cost**                   | No additional vector DB license/infrastructure   |
| **Maturity**               | pgvector is production-ready since 2023          |

---

## 5. Tenant Isolation Strategy

### 5.1 Data Layer Isolation

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      TENANT ISOLATION                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                    Request Flow                                      │   │
│   │                                                                      │   │
│   │   Request ──▶ JWT Extract ──▶ TenantContext ──▶ Data Access         │   │
│   │                 tenantId       ThreadLocal       + tenantId          │   │
│   │                                                   filter             │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                    Implementation                                    │   │
│   │                                                                      │   │
│   │   @Entity                                                            │   │
│   │   @Where(clause = "tenant_id = :tenantId")  // Hibernate filter     │   │
│   │   public class Machine {                                             │   │
│   │       @Column(name = "tenant_id")                                    │   │
│   │       private UUID tenantId;                                         │   │
│   │   }                                                                  │   │
│   │                                                                      │   │
│   │   // All queries automatically scoped to tenant                      │   │
│   │   machineRepository.findAll() // Only returns current tenant's data │   │
│   │                                                                      │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                    IDOR Protection                                   │   │
│   │                                                                      │   │
│   │   GET /api/v1/machines/{machineId}                                   │   │
│   │                                                                      │   │
│   │   // Query includes tenantId from JWT, not just machineId           │   │
│   │   SELECT * FROM machines                                             │   │
│   │   WHERE id = :machineId AND tenant_id = :tenantId                    │   │
│   │                                                                      │   │
│   │   // Cross-tenant access returns 404 (not 403) to prevent           │   │
│   │   // enumeration attacks                                             │   │
│   │                                                                      │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 5.2 Cache Isolation

```
Redis Key Strategy:
─────────────────

tenant:{tenantId}:machine:{machineId}:status   → Machine status
tenant:{tenantId}:dashboard:summary            → Dashboard cache
tenant:{tenantId}:user:{userId}:session        → Session data

Example:
tenant:550e8400-e29b-41d4-a716-446655440000:machine:123:status
```

---

## 6. Deployment Architecture

### 6.1 AWS Production Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         AWS DEPLOYMENT                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                        Public Subnet                                 │   │
│   │  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐           │   │
│   │  │   Route53   │────▶│ CloudFront  │────▶│     ALB     │           │   │
│   │  │    (DNS)    │     │    (CDN)    │     │             │           │   │
│   │  └─────────────┘     └─────────────┘     └──────┬──────┘           │   │
│   └──────────────────────────────────────────────────┼───────────────────┘   │
│                                                      │                       │
│   ┌──────────────────────────────────────────────────┼───────────────────┐   │
│   │                      Private Subnet               │                   │   │
│   │                                                   │                   │   │
│   │   ┌─────────────────┐   ┌─────────────────┐   ┌──▼────────────┐    │   │
│   │   │   ECS Fargate   │   │   ECS Fargate   │   │  ECS Fargate  │    │   │
│   │   │   ───────────   │   │   ───────────   │   │  ───────────  │    │   │
│   │   │    Frontend     │   │    Core API     │   │   AI Worker   │    │   │
│   │   │   (Next.js)     │   │   (Java 21)     │   │   (Python)    │    │   │
│   │   │                 │   │                 │   │               │    │   │
│   │   │   Tasks: 2-10   │   │   Tasks: 2-20   │   │  Tasks: 1-5   │    │   │
│   │   │   CPU: 0.5      │   │   CPU: 1        │   │  CPU: 2       │    │   │
│   │   │   Mem: 1GB      │   │   Mem: 2GB      │   │  Mem: 4GB     │    │   │
│   │   └─────────────────┘   └─────────────────┘   └───────────────┘    │   │
│   │                                                                     │   │
│   │   ┌─────────────────┐   ┌─────────────────┐   ┌───────────────┐    │   │
│   │   │     RDS         │   │  ElastiCache    │   │  DocumentDB   │    │   │
│   │   │   ─────────     │   │  ───────────    │   │  ───────────  │    │   │
│   │   │  PostgreSQL 16  │   │   Redis 7.x     │   │   MongoDB     │    │   │
│   │   │   + pgvector    │   │   Cluster       │   │   Compatible  │    │   │
│   │   │                 │   │                 │   │               │    │   │
│   │   │   db.r6g.large  │   │ cache.r6g.large │   │  db.r6g.large │    │   │
│   │   │   Multi-AZ      │   │   3 nodes       │   │   3 nodes     │    │   │
│   │   └─────────────────┘   └─────────────────┘   └───────────────┘    │   │
│   │                                                                     │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 7. Development Environment

### 7.1 Local Docker Compose

```yaml
# docker-compose.dev.yml
services:
  # Core API (Java)
  core-api:
    build: ./services/core-api
    ports:
      - "8080:8080"
    environment:
      - SPRING_PROFILES_ACTIVE=dev
      - DATABASE_URL=jdbc:postgresql://postgres:5432/washwise
      - REDIS_URL=redis://redis:6379
    depends_on:
      - postgres
      - redis

  # AI Worker (Python)
  ai-worker:
    build: ./services/ai-worker
    ports:
      - "8081:8081"
    environment:
      - ENVIRONMENT=dev
      - REDIS_URL=redis://redis:6379
      - MONGODB_URL=mongodb://mongo:27017/washwise
      - OPENAI_API_KEY=${OPENAI_API_KEY}
    depends_on:
      - redis
      - mongo

  # Frontend (Next.js)
  frontend:
    build: ./apps/web-admin
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:8080

  # Infrastructure
  postgres:
    image: pgvector/pgvector:pg16
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  mongo:
    image: mongo:7
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db

volumes:
  postgres_data:
  mongo_data:
```

### 7.2 Repository Structure (Monorepo)

```
washwise-enterprise/
├── apps/
│   └── web-admin/              # Next.js 16 frontend
│       ├── src/
│       │   ├── app/            # App Router
│       │   ├── components/     # React components
│       │   ├── hooks/          # Custom hooks
│       │   ├── lib/            # Utilities
│       │   └── stores/         # Zustand stores
│       └── package.json
│
├── services/
│   ├── core-api/               # Java 21 + Spring Boot 4
│   │   ├── src/main/java/
│   │   │   └── com/washwise/
│   │   │       ├── config/
│   │   │       ├── controller/
│   │   │       ├── service/
│   │   │       ├── domain/
│   │   │       ├── repository/
│   │   │       └── event/
│   │   ├── src/main/resources/
│   │   └── pom.xml
│   │
│   └── ai-worker/              # Python 3.12 + FastAPI
│       ├── app/
│       │   ├── agents/
│       │   ├── consumers/
│       │   ├── services/
│       │   └── models/
│       ├── requirements.txt
│       └── pyproject.toml
│
├── packages/                   # Shared packages
│   ├── types/                  # Shared TypeScript types
│   └── proto/                  # Protobuf definitions (if needed)
│
├── infra/
│   ├── terraform/              # IaC
│   │   ├── environments/
│   │   │   ├── dev/
│   │   │   ├── staging/
│   │   │   └── prod/
│   │   └── modules/
│   │       ├── ecs/
│   │       ├── rds/
│   │       └── redis/
│   └── docker/
│       └── compose/
│
├── docs/                       # Documentation
│   ├── 01-PRD.md
│   ├── 02-ARCHITECTURE.md
│   ├── 03-DATABASE.md
│   ├── 04-API.md
│   ├── 05-SECURITY.md
│   └── ...
│
├── .github/
│   └── workflows/              # CI/CD pipelines
│
└── docker-compose.yml
```

---

## 8. Next Steps

See the following documents for detailed specifications:

- [03-DATABASE.md](./03-DATABASE.md) - Database schema design
- [04-API.md](./04-API.md) - API specifications
- [05-SECURITY.md](./05-SECURITY.md) - Security architecture
- [06-DEVOPS.md](./06-DEVOPS.md) - CI/CD and infrastructure
