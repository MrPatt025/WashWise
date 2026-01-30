# WashWise Enterprise - Observability

## 1. Overview

### 1.1 Three Pillars of Observability

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                           OBSERVABILITY STACK                                            │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                          │
│   ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐                     │
│   │     METRICS     │    │      LOGS       │    │     TRACES      │                     │
│   │                 │    │                 │    │                 │                     │
│   │  • Prometheus   │    │  • CloudWatch   │    │  • OpenTelemetry│                     │
│   │  • Grafana      │    │  • Loki         │    │  • AWS X-Ray    │                     │
│   │  • CloudWatch   │    │  • ELK Stack    │    │  • Jaeger       │                     │
│   │                 │    │                 │    │                 │                     │
│   │  What happened? │    │  Why happened?  │    │  Where happened?│                     │
│   └─────────────────┘    └─────────────────┘    └─────────────────┘                     │
│           │                      │                      │                               │
│           └──────────────────────┼──────────────────────┘                               │
│                                  │                                                       │
│                                  ▼                                                       │
│                       ┌─────────────────┐                                               │
│                       │    ALERTING     │                                               │
│                       │                 │                                               │
│                       │  • PagerDuty    │                                               │
│                       │  • Slack        │                                               │
│                       │  • Email        │                                               │
│                       └─────────────────┘                                               │
│                                                                                          │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Technology Stack

| Category     | Technology           | Purpose                              |
| ------------ | -------------------- | ------------------------------------ |
| **Metrics**  | Prometheus + Grafana | Application & infrastructure metrics |
| **Metrics**  | CloudWatch           | AWS resource metrics                 |
| **Logs**     | CloudWatch Logs      | Centralized log aggregation          |
| **Logs**     | Loki (Optional)      | High-cardinality log search          |
| **Traces**   | OpenTelemetry        | Distributed tracing instrumentation  |
| **Traces**   | AWS X-Ray            | Request tracing visualization        |
| **Alerting** | Grafana Alerting     | Metric-based alerts                  |
| **Alerting** | PagerDuty            | On-call management                   |

---

## 2. Metrics

### 2.1 Application Metrics

#### Core API (Spring Boot Actuator)

```yaml
# application.yml - Metrics Configuration
management:
  endpoints:
    web:
      exposure:
        include: health,info,metrics,prometheus
  endpoint:
    health:
      show-details: when_authorized
      probes:
        enabled: true
  metrics:
    export:
      prometheus:
        enabled: true
    tags:
      application: washwise-core-api
      environment: ${SPRING_PROFILES_ACTIVE}
    distribution:
      percentiles-histogram:
        http.server.requests: true
      percentiles:
        http.server.requests: 0.5, 0.9, 0.95, 0.99

# Custom metrics
spring:
  application:
    name: core-api
```

```java
// Custom Business Metrics
@Component
@RequiredArgsConstructor
public class BusinessMetrics {

    private final MeterRegistry meterRegistry;

    // Counter: Total bookings created
    private Counter bookingsCreated;

    // Gauge: Active machines
    private AtomicInteger activeMachines = new AtomicInteger(0);

    // Timer: Booking processing time
    private Timer bookingProcessingTime;

    // Distribution Summary: Transaction amounts
    private DistributionSummary transactionAmounts;

    @PostConstruct
    public void init() {
        bookingsCreated = Counter.builder("washwise.bookings.created")
            .description("Total number of bookings created")
            .tags("type", "booking")
            .register(meterRegistry);

        Gauge.builder("washwise.machines.active", activeMachines, AtomicInteger::get)
            .description("Number of currently active machines")
            .register(meterRegistry);

        bookingProcessingTime = Timer.builder("washwise.booking.processing.time")
            .description("Time taken to process a booking")
            .publishPercentiles(0.5, 0.9, 0.95, 0.99)
            .register(meterRegistry);

        transactionAmounts = DistributionSummary.builder("washwise.transactions.amount")
            .description("Distribution of transaction amounts")
            .baseUnit("THB")
            .publishPercentileHistogram()
            .register(meterRegistry);
    }

    public void recordBookingCreated(String tenantId) {
        meterRegistry.counter("washwise.bookings.created",
            "tenant_id", tenantId
        ).increment();
    }

    public void recordTransactionAmount(BigDecimal amount, String tenantId) {
        transactionAmounts.record(amount.doubleValue());
    }

    public Timer.Sample startBookingTimer() {
        return Timer.start(meterRegistry);
    }

    public void stopBookingTimer(Timer.Sample sample) {
        sample.stop(bookingProcessingTime);
    }
}
```

#### AI Worker (FastAPI + Prometheus)

```python
# app/metrics.py
from prometheus_client import Counter, Histogram, Gauge, generate_latest
from fastapi import APIRouter

router = APIRouter()

# Metrics definitions
AI_REQUESTS = Counter(
    'washwise_ai_requests_total',
    'Total AI requests processed',
    ['model', 'intent_type', 'tenant_id']
)

AI_RESPONSE_TIME = Histogram(
    'washwise_ai_response_seconds',
    'AI response time in seconds',
    ['model', 'intent_type'],
    buckets=[0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0]
)

AI_TOKEN_USAGE = Counter(
    'washwise_ai_tokens_total',
    'Total tokens used',
    ['model', 'token_type']  # prompt, completion
)

ACTIVE_CONVERSATIONS = Gauge(
    'washwise_active_conversations',
    'Number of active AI conversations',
    ['tenant_id']
)

LLM_ERRORS = Counter(
    'washwise_llm_errors_total',
    'Total LLM API errors',
    ['model', 'error_type']
)

@router.get("/metrics")
async def metrics():
    return Response(
        generate_latest(),
        media_type="text/plain"
    )

# Usage in service
class AIService:
    async def process_message(
        self,
        message: str,
        tenant_id: str,
        model: str = "gpt-4o"
    ) -> AIResponse:
        with AI_RESPONSE_TIME.labels(
            model=model,
            intent_type="chat"
        ).time():
            try:
                response = await self._call_llm(message, model)

                AI_REQUESTS.labels(
                    model=model,
                    intent_type="chat",
                    tenant_id=tenant_id
                ).inc()

                AI_TOKEN_USAGE.labels(
                    model=model,
                    token_type="prompt"
                ).inc(response.prompt_tokens)

                AI_TOKEN_USAGE.labels(
                    model=model,
                    token_type="completion"
                ).inc(response.completion_tokens)

                return response

            except LLMError as e:
                LLM_ERRORS.labels(
                    model=model,
                    error_type=e.type
                ).inc()
                raise
```

### 2.2 Key Metrics Dashboard

#### Service Level Indicators (SLIs)

| SLI                  | Metric                                          | Target  |
| -------------------- | ----------------------------------------------- | ------- |
| **Availability**     | `up` probe                                      | 99.9%   |
| **Latency (p50)**    | `http_server_requests_seconds{quantile="0.5"}`  | < 100ms |
| **Latency (p99)**    | `http_server_requests_seconds{quantile="0.99"}` | < 500ms |
| **Error Rate**       | `http_server_requests_total{status=~"5.."}`     | < 0.1%  |
| **AI Response Time** | `washwise_ai_response_seconds{quantile="0.95"}` | < 3s    |

#### Grafana Dashboard JSON

```json
{
  "dashboard": {
    "title": "WashWise - Service Overview",
    "uid": "washwise-overview",
    "panels": [
      {
        "title": "Request Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "sum(rate(http_server_requests_seconds_count[5m])) by (service)",
            "legendFormat": "{{service}}"
          }
        ]
      },
      {
        "title": "Error Rate (%)",
        "type": "gauge",
        "targets": [
          {
            "expr": "sum(rate(http_server_requests_seconds_count{status=~\"5..\"}[5m])) / sum(rate(http_server_requests_seconds_count[5m])) * 100"
          }
        ],
        "fieldConfig": {
          "defaults": {
            "thresholds": {
              "steps": [
                { "color": "green", "value": null },
                { "color": "yellow", "value": 1 },
                { "color": "red", "value": 5 }
              ]
            }
          }
        }
      },
      {
        "title": "Response Time (p95)",
        "type": "timeseries",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, sum(rate(http_server_requests_seconds_bucket[5m])) by (le, service))",
            "legendFormat": "{{service}} p95"
          }
        ]
      },
      {
        "title": "Active Bookings",
        "type": "stat",
        "targets": [
          {
            "expr": "sum(washwise_bookings_active)"
          }
        ]
      },
      {
        "title": "AI Token Usage (24h)",
        "type": "piechart",
        "targets": [
          {
            "expr": "sum(increase(washwise_ai_tokens_total[24h])) by (model)"
          }
        ]
      }
    ]
  }
}
```

---

## 3. Logging

### 3.1 Structured Logging Format

#### Java (Logback + JSON)

```xml
<!-- logback-spring.xml -->
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
    <springProperty scope="context" name="service" source="spring.application.name"/>
    <springProperty scope="context" name="environment" source="spring.profiles.active"/>

    <appender name="CONSOLE" class="ch.qos.logback.core.ConsoleAppender">
        <encoder class="net.logstash.logback.encoder.LogstashEncoder">
            <customFields>
                {"service":"${service}","environment":"${environment}"}
            </customFields>
            <fieldNames>
                <timestamp>@timestamp</timestamp>
                <message>message</message>
                <logger>logger</logger>
                <thread>thread</thread>
                <level>level</level>
            </fieldNames>
        </encoder>
    </appender>

    <root level="INFO">
        <appender-ref ref="CONSOLE"/>
    </root>
</configuration>
```

```java
// Structured logging with MDC
@Slf4j
@Service
public class BookingService {

    public Booking createBooking(CreateBookingRequest request) {
        // Add context to all subsequent logs
        MDC.put("tenant_id", request.getTenantId());
        MDC.put("user_id", request.getUserId());
        MDC.put("trace_id", getTraceId());

        try {
            log.info("Creating booking",
                kv("machine_id", request.getMachineId()),
                kv("start_time", request.getStartTime())
            );

            Booking booking = repository.save(new Booking(request));

            log.info("Booking created successfully",
                kv("booking_id", booking.getId()),
                kv("amount", booking.getAmount())
            );

            return booking;

        } catch (Exception e) {
            log.error("Failed to create booking",
                kv("error_type", e.getClass().getSimpleName()),
                kv("error_message", e.getMessage())
            );
            throw e;
        } finally {
            MDC.clear();
        }
    }
}
```

#### Python (structlog)

```python
# app/logging_config.py
import structlog
import logging.config

def configure_logging():
    structlog.configure(
        processors=[
            structlog.contextvars.merge_contextvars,
            structlog.processors.add_log_level,
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.stdlib.ProcessorFormatter.wrap_for_formatter,
        ],
        wrapper_class=structlog.stdlib.BoundLogger,
        context_class=dict,
        logger_factory=structlog.stdlib.LoggerFactory(),
        cache_logger_on_first_use=True,
    )

    logging.config.dictConfig({
        "version": 1,
        "disable_existing_loggers": False,
        "formatters": {
            "json": {
                "()": structlog.stdlib.ProcessorFormatter,
                "processor": structlog.processors.JSONRenderer(),
            },
        },
        "handlers": {
            "console": {
                "class": "logging.StreamHandler",
                "formatter": "json",
            },
        },
        "root": {
            "handlers": ["console"],
            "level": "INFO",
        },
    })

# Usage
import structlog

logger = structlog.get_logger()

async def process_ai_request(request: AIRequest):
    logger = structlog.get_logger().bind(
        tenant_id=request.tenant_id,
        user_id=request.user_id,
        request_id=request.id
    )

    logger.info("Processing AI request", intent=request.intent)

    try:
        response = await ai_service.process(request)
        logger.info("AI request completed",
            tokens_used=response.tokens,
            response_time_ms=response.duration_ms
        )
        return response
    except Exception as e:
        logger.exception("AI request failed", error_type=type(e).__name__)
        raise
```

### 3.2 Log Aggregation (CloudWatch)

```hcl
# infra/terraform/modules/logging/main.tf

# Log Group for each service
resource "aws_cloudwatch_log_group" "services" {
  for_each = toset(["core-api", "ai-worker", "web-admin"])

  name              = "/ecs/washwise-${var.environment}/${each.key}"
  retention_in_days = var.environment == "prod" ? 30 : 7

  tags = {
    Service     = each.key
    Environment = var.environment
  }
}

# Metric Filters
resource "aws_cloudwatch_log_metric_filter" "errors" {
  name           = "washwise-${var.environment}-errors"
  pattern        = "[timestamp, level=ERROR, ...]"
  log_group_name = aws_cloudwatch_log_group.services["core-api"].name

  metric_transformation {
    name          = "ErrorCount"
    namespace     = "WashWise/${var.environment}"
    value         = "1"
    default_value = "0"
  }
}

resource "aws_cloudwatch_log_metric_filter" "auth_failures" {
  name           = "washwise-${var.environment}-auth-failures"
  pattern        = "{ $.level = \"WARN\" && $.message = \"*authentication failed*\" }"
  log_group_name = aws_cloudwatch_log_group.services["core-api"].name

  metric_transformation {
    name          = "AuthFailures"
    namespace     = "WashWise/${var.environment}"
    value         = "1"
  }
}

# Log Insights Query (saved)
resource "aws_cloudwatch_query_definition" "slow_requests" {
  name            = "WashWise/SlowRequests"
  log_group_names = [aws_cloudwatch_log_group.services["core-api"].name]

  query_string = <<-EOT
    fields @timestamp, @message, tenant_id, request_path, duration_ms
    | filter duration_ms > 1000
    | sort @timestamp desc
    | limit 100
  EOT
}
```

---

## 4. Distributed Tracing

### 4.1 OpenTelemetry Configuration

#### Java (Spring Boot)

```yaml
# application.yml
spring:
  application:
    name: core-api

management:
  tracing:
    sampling:
      probability: 1.0 # 100% in dev, adjust for prod
    propagation:
      type: w3c

otel:
  exporter:
    otlp:
      endpoint: ${OTEL_EXPORTER_ENDPOINT:http://localhost:4317}
  resource:
    attributes:
      service.name: washwise-core-api
      service.version: ${APP_VERSION:1.0.0}
      deployment.environment: ${SPRING_PROFILES_ACTIVE}
```

```java
// Custom span for business logic
@Service
@RequiredArgsConstructor
public class BookingService {

    private final Tracer tracer;

    public Booking createBooking(CreateBookingRequest request) {
        Span span = tracer.spanBuilder("booking.create")
            .setAttribute("tenant.id", request.getTenantId())
            .setAttribute("machine.id", request.getMachineId())
            .startSpan();

        try (Scope scope = span.makeCurrent()) {
            // Validate machine availability
            Span validationSpan = tracer.spanBuilder("booking.validate")
                .startSpan();
            try {
                validateMachineAvailability(request);
            } finally {
                validationSpan.end();
            }

            // Process payment
            Span paymentSpan = tracer.spanBuilder("booking.payment")
                .setAttribute("payment.method", request.getPaymentMethod())
                .startSpan();
            try {
                processPayment(request);
            } finally {
                paymentSpan.end();
            }

            // Save booking
            Booking booking = repository.save(new Booking(request));
            span.setAttribute("booking.id", booking.getId());

            return booking;

        } catch (Exception e) {
            span.setStatus(StatusCode.ERROR, e.getMessage());
            span.recordException(e);
            throw e;
        } finally {
            span.end();
        }
    }
}
```

#### Python (FastAPI)

```python
# app/tracing.py
from opentelemetry import trace
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.sdk.resources import Resource
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from opentelemetry.instrumentation.httpx import HTTPXClientInstrumentor
from opentelemetry.instrumentation.redis import RedisInstrumentor

def setup_tracing(app, service_name: str, environment: str):
    resource = Resource.create({
        "service.name": service_name,
        "service.version": os.getenv("APP_VERSION", "1.0.0"),
        "deployment.environment": environment
    })

    provider = TracerProvider(resource=resource)

    otlp_exporter = OTLPSpanExporter(
        endpoint=os.getenv("OTEL_EXPORTER_ENDPOINT", "localhost:4317"),
        insecure=True
    )

    processor = BatchSpanProcessor(otlp_exporter)
    provider.add_span_processor(processor)

    trace.set_tracer_provider(provider)

    # Auto-instrument
    FastAPIInstrumentor.instrument_app(app)
    HTTPXClientInstrumentor().instrument()
    RedisInstrumentor().instrument()

# Custom spans
tracer = trace.get_tracer(__name__)

class AIService:
    async def generate_response(self, prompt: str, tenant_id: str):
        with tracer.start_as_current_span("ai.generate") as span:
            span.set_attribute("tenant.id", tenant_id)
            span.set_attribute("prompt.length", len(prompt))

            # Call LLM
            with tracer.start_as_current_span("ai.llm.call") as llm_span:
                llm_span.set_attribute("model", self.model)
                response = await self._call_llm(prompt)
                llm_span.set_attribute("tokens.prompt", response.usage.prompt_tokens)
                llm_span.set_attribute("tokens.completion", response.usage.completion_tokens)

            # Process response
            with tracer.start_as_current_span("ai.response.process"):
                result = self._process_response(response)

            span.set_attribute("response.length", len(result))
            return result
```

### 4.2 Trace Correlation

```java
// Cross-service trace propagation
@Component
public class TracingInterceptor implements ClientHttpRequestInterceptor {

    @Override
    public ClientHttpResponse intercept(
            HttpRequest request,
            byte[] body,
            ClientHttpRequestExecution execution) throws IOException {

        // Propagate trace context to downstream service
        Span currentSpan = Span.current();
        if (currentSpan != null && currentSpan.getSpanContext().isValid()) {
            request.getHeaders().add("traceparent",
                String.format("00-%s-%s-01",
                    currentSpan.getSpanContext().getTraceId(),
                    currentSpan.getSpanContext().getSpanId()
                )
            );
        }

        return execution.execute(request, body);
    }
}
```

---

## 5. Alerting

### 5.1 Alert Rules

```yaml
# grafana/alerts/rules.yaml
groups:
  - name: washwise-critical
    interval: 30s
    rules:
      # Service Down
      - alert: ServiceDown
        expr: up{job=~"washwise-.*"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Service {{ $labels.job }} is down"
          description: "{{ $labels.job }} has been down for more than 1 minute"

      # High Error Rate
      - alert: HighErrorRate
        expr: |
          (sum(rate(http_server_requests_seconds_count{status=~"5.."}[5m])) by (service)
          / sum(rate(http_server_requests_seconds_count[5m])) by (service)) * 100 > 5
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "High error rate on {{ $labels.service }}"
          description: 'Error rate is {{ $value | printf "%.2f" }}%'

      # High Latency
      - alert: HighLatency
        expr: |
          histogram_quantile(0.95, sum(rate(http_server_requests_seconds_bucket[5m])) by (le, service)) > 2
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High latency on {{ $labels.service }}"
          description: 'P95 latency is {{ $value | printf "%.2f" }}s'

      # Database Connection Pool Exhausted
      - alert: DBConnectionPoolExhausted
        expr: |
          hikaricp_connections_active / hikaricp_connections_max > 0.9
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Database connection pool nearly exhausted"
          description: '{{ $value | printf "%.0f" }}% of connections in use'

  - name: washwise-business
    interval: 1m
    rules:
      # No Bookings in Last Hour (during business hours)
      - alert: NoRecentBookings
        expr: |
          increase(washwise_bookings_created[1h]) == 0
          and hour() >= 8 and hour() <= 22
        for: 30m
        labels:
          severity: warning
        annotations:
          summary: "No bookings in the last hour"
          description: "Business may be impacted - no new bookings created"

      # AI Service Degraded
      - alert: AIServiceDegraded
        expr: |
          histogram_quantile(0.95, sum(rate(washwise_ai_response_seconds_bucket[5m])) by (le)) > 10
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "AI service response time degraded"
          description: 'P95 AI response time is {{ $value | printf "%.2f" }}s'

      # High AI Token Usage
      - alert: HighAITokenUsage
        expr: |
          increase(washwise_ai_tokens_total[1h]) > 100000
        labels:
          severity: info
        annotations:
          summary: "High AI token usage"
          description: "{{ $value }} tokens used in the last hour"
```

### 5.2 Notification Channels

```yaml
# grafana/alerting/contact-points.yaml
contactPoints:
  - name: pagerduty-critical
    type: pagerduty
    settings:
      integrationKey: ${PAGERDUTY_KEY}
      severity: critical

  - name: slack-alerts
    type: slack
    settings:
      url: ${SLACK_WEBHOOK_URL}
      channel: "#washwise-alerts"
      title: "{{ .CommonAnnotations.summary }}"
      text: "{{ .CommonAnnotations.description }}"

  - name: email-team
    type: email
    settings:
      addresses:
        - team@washwise.io

# Notification Policies
notificationPolicies:
  - receiver: pagerduty-critical
    matchers:
      - severity = critical
    group_wait: 30s
    group_interval: 5m
    repeat_interval: 4h

  - receiver: slack-alerts
    matchers:
      - severity =~ "warning|info"
    group_wait: 1m
    group_interval: 10m
    repeat_interval: 24h
```

---

## 6. Runbooks

### 6.1 High Error Rate

````markdown
# Runbook: High Error Rate

## Symptoms

- Error rate > 5% for more than 2 minutes
- Alert: HighErrorRate fired

## Investigation Steps

1. **Check error logs**
   ```bash
   aws logs tail /ecs/washwise-prod/core-api --filter-pattern ERROR
   ```
````

2. **Identify error distribution**
   - Grafana: Dashboard > Error Breakdown
   - Check which endpoints are failing

3. **Check dependencies**
   - Database connectivity
   - Redis connectivity
   - External API status

4. **Check recent deployments**
   ```bash
   aws ecs describe-services --cluster washwise-prod --services core-api
   ```

## Remediation

### Database Issues

- Check connection pool: Grafana > DB Pool dashboard
- Scale up RDS if needed
- Check for long-running queries

### Memory Issues

- Check container memory: Grafana > Container Resources
- Restart service if OOM
- Scale horizontally

### Code Bug

1. Roll back to previous version
2. Create hotfix branch
3. Deploy fix through pipeline

## Escalation

- If unresolved in 15 minutes: Page on-call engineer
- If customer impact > 30 minutes: Notify leadership

````

### 6.2 Service Down

```markdown
# Runbook: Service Down

## Symptoms
- Service health check failing
- Alert: ServiceDown fired

## Immediate Actions

1. **Verify service status**
   ```bash
   aws ecs describe-services --cluster washwise-prod --services core-api
````

2. **Check task status**

   ```bash
   aws ecs list-tasks --cluster washwise-prod --service-name core-api
   aws ecs describe-tasks --cluster washwise-prod --tasks <task-arn>
   ```

3. **Check container logs**
   ```bash
   aws logs tail /ecs/washwise-prod/core-api --since 10m
   ```

## Root Cause Analysis

### Container Won't Start

- Check image exists in ECR
- Verify secrets are accessible
- Check memory/CPU limits

### Health Check Failing

- Verify /health endpoint
- Check database connectivity
- Check port mapping

### OOM Killed

- Increase memory limits
- Check for memory leaks
- Add JVM heap dumps for analysis

## Recovery

1. **Force new deployment**

   ```bash
   aws ecs update-service --cluster washwise-prod --service core-api --force-new-deployment
   ```

2. **Roll back if needed**
   ```bash
   aws ecs update-service --cluster washwise-prod --service core-api \
     --task-definition core-api:<previous-version>
   ```

```

```
