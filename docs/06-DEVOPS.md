# WashWise Enterprise - DevOps & CI/CD

## 1. Overview

### 1.1 DevOps Principles

| Principle                    | Implementation                                |
| ---------------------------- | --------------------------------------------- |
| **Infrastructure as Code**   | Terraform for all AWS resources               |
| **GitOps**                   | Git as single source of truth for deployments |
| **Shift Left Security**      | Security scanning in CI pipeline              |
| **Immutable Infrastructure** | Container images, no in-place updates         |
| **Observability First**      | Metrics, logs, traces from day one            |

### 1.2 Environment Strategy

| Environment    | Purpose                   | Infrastructure  | Deployment           |
| -------------- | ------------------------- | --------------- | -------------------- |
| **Local**      | Development               | Docker Compose  | Manual               |
| **Dev**        | Integration testing       | AWS (minimal)   | On push to `develop` |
| **Staging**    | Pre-production validation | AWS (prod-like) | On PR to `main`      |
| **Production** | Live system               | AWS (full HA)   | On release tag       |

---

## 2. CI/CD Pipeline

### 2.1 Pipeline Overview

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              CI/CD PIPELINE                                              │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                          │
│   ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐             │
│   │  Lint   │───▶│  Test   │───▶│  Build  │───▶│  Scan   │───▶│ Deploy  │             │
│   │         │    │         │    │         │    │         │    │         │             │
│   └─────────┘    └─────────┘    └─────────┘    └─────────┘    └─────────┘             │
│       │              │              │              │              │                    │
│       ▼              ▼              ▼              ▼              ▼                    │
│   • ESLint       • Unit         • Docker      • SAST         • Dev (auto)            │
│   • Checkstyle   • Integration  • Push to     • Dependency   • Staging (manual)      │
│   • Black/Ruff   • E2E            ECR         • Container    • Prod (manual)         │
│                                               • License                               │
│                                                                                          │
│   ─────────────────────────────────────────────────────────────────────────────────────  │
│                                                                                          │
│   TRIGGERS:                                                                              │
│   • Push to any branch → Lint + Test                                                    │
│   • Push to develop → + Build + Deploy Dev                                              │
│   • PR to main → + Deploy Staging                                                       │
│   • Release tag (v*) → + Deploy Production                                              │
│                                                                                          │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 GitHub Actions Workflows

#### Main CI Pipeline

```yaml
# .github/workflows/ci.yml
name: CI Pipeline

on:
  push:
    branches: [main, develop, "feature/**"]
  pull_request:
    branches: [main, develop]

env:
  JAVA_VERSION: "21"
  NODE_VERSION: "22"
  PYTHON_VERSION: "3.12"
  AWS_REGION: "ap-southeast-1"

jobs:
  # ==========================================
  # LINT
  # ==========================================
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      # Java
      - name: Setup Java
        uses: actions/setup-java@v4
        with:
          java-version: ${{ env.JAVA_VERSION }}
          distribution: "temurin"

      - name: Lint Java (Checkstyle)
        working-directory: services/core-api
        run: mvn checkstyle:check

      # Python
      - name: Setup Python
        uses: actions/setup-python@v5
        with:
          python-version: ${{ env.PYTHON_VERSION }}

      - name: Lint Python (Ruff)
        working-directory: services/ai-worker
        run: |
          pip install ruff
          ruff check .
          ruff format --check .

      # Node.js
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}

      - name: Install dependencies
        working-directory: apps/web-admin
        run: npm ci

      - name: Lint TypeScript (ESLint)
        working-directory: apps/web-admin
        run: npm run lint

  # ==========================================
  # TEST
  # ==========================================
  test-core-api:
    runs-on: ubuntu-latest
    needs: lint
    services:
      postgres:
        image: pgvector/pgvector:pg16
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: washwise_test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      redis:
        image: redis:7-alpine
        ports:
          - 6379:6379

    steps:
      - uses: actions/checkout@v4

      - name: Setup Java
        uses: actions/setup-java@v4
        with:
          java-version: ${{ env.JAVA_VERSION }}
          distribution: "temurin"
          cache: "maven"

      - name: Run Unit Tests
        working-directory: services/core-api
        run: mvn test -Dspring.profiles.active=test

      - name: Run Integration Tests
        working-directory: services/core-api
        env:
          DATABASE_URL: jdbc:postgresql://localhost:5432/washwise_test
          REDIS_URL: redis://localhost:6379
        run: mvn verify -Dspring.profiles.active=integration

      - name: Upload Coverage
        uses: codecov/codecov-action@v4
        with:
          files: services/core-api/target/site/jacoco/jacoco.xml
          flags: core-api

  test-ai-worker:
    runs-on: ubuntu-latest
    needs: lint
    services:
      redis:
        image: redis:7-alpine
        ports:
          - 6379:6379
      mongo:
        image: mongo:7
        ports:
          - 27017:27017

    steps:
      - uses: actions/checkout@v4

      - name: Setup Python
        uses: actions/setup-python@v5
        with:
          python-version: ${{ env.PYTHON_VERSION }}

      - name: Install dependencies
        working-directory: services/ai-worker
        run: |
          pip install -r requirements.txt
          pip install pytest pytest-cov pytest-asyncio

      - name: Run Tests
        working-directory: services/ai-worker
        env:
          REDIS_URL: redis://localhost:6379
          MONGODB_URL: mongodb://localhost:27017/washwise_test
        run: pytest --cov=app --cov-report=xml

      - name: Upload Coverage
        uses: codecov/codecov-action@v4
        with:
          files: services/ai-worker/coverage.xml
          flags: ai-worker

  test-frontend:
    runs-on: ubuntu-latest
    needs: lint
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: "npm"
          cache-dependency-path: apps/web-admin/package-lock.json

      - name: Install dependencies
        working-directory: apps/web-admin
        run: npm ci

      - name: Run Tests
        working-directory: apps/web-admin
        run: npm test -- --coverage

      - name: Upload Coverage
        uses: codecov/codecov-action@v4
        with:
          files: apps/web-admin/coverage/lcov.info
          flags: web-admin

  # ==========================================
  # SECURITY SCAN
  # ==========================================
  security-scan:
    runs-on: ubuntu-latest
    needs: lint
    steps:
      - uses: actions/checkout@v4

      # SAST with Semgrep
      - name: Semgrep Scan
        uses: semgrep/semgrep-action@v1
        with:
          config: >-
            p/security-audit
            p/secrets
            p/owasp-top-ten

      # Dependency scan
      - name: OWASP Dependency Check (Java)
        uses: dependency-check/Dependency-Check_Action@main
        with:
          project: "washwise-core-api"
          path: "services/core-api"
          format: "SARIF"
          out: "reports"

      - name: Safety Check (Python)
        working-directory: services/ai-worker
        run: |
          pip install safety
          safety check -r requirements.txt --output json > safety-report.json
        continue-on-error: true

      - name: NPM Audit
        working-directory: apps/web-admin
        run: npm audit --audit-level=high
        continue-on-error: true

      # Upload results
      - name: Upload SARIF
        uses: github/codeql-action/upload-sarif@v3
        with:
          sarif_file: reports/dependency-check-report.sarif

  # ==========================================
  # BUILD
  # ==========================================
  build:
    runs-on: ubuntu-latest
    needs: [test-core-api, test-ai-worker, test-frontend, security-scan]
    if: github.ref == 'refs/heads/develop' || github.ref == 'refs/heads/main' || startsWith(github.ref, 'refs/tags/v')

    permissions:
      id-token: write
      contents: read

    steps:
      - uses: actions/checkout@v4

      - name: Configure AWS Credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ secrets.AWS_ROLE_ARN }}
          aws-region: ${{ env.AWS_REGION }}

      - name: Login to ECR
        id: ecr-login
        uses: aws-actions/amazon-ecr-login@v2

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      # Build Core API
      - name: Build Core API Image
        uses: docker/build-push-action@v5
        with:
          context: services/core-api
          push: true
          tags: |
            ${{ steps.ecr-login.outputs.registry }}/washwise/core-api:${{ github.sha }}
            ${{ steps.ecr-login.outputs.registry }}/washwise/core-api:latest
          cache-from: type=gha
          cache-to: type=gha,mode=max

      # Build AI Worker
      - name: Build AI Worker Image
        uses: docker/build-push-action@v5
        with:
          context: services/ai-worker
          push: true
          tags: |
            ${{ steps.ecr-login.outputs.registry }}/washwise/ai-worker:${{ github.sha }}
            ${{ steps.ecr-login.outputs.registry }}/washwise/ai-worker:latest
          cache-from: type=gha
          cache-to: type=gha,mode=max

      # Build Frontend
      - name: Build Frontend Image
        uses: docker/build-push-action@v5
        with:
          context: apps/web-admin
          push: true
          tags: |
            ${{ steps.ecr-login.outputs.registry }}/washwise/web-admin:${{ github.sha }}
            ${{ steps.ecr-login.outputs.registry }}/washwise/web-admin:latest
          cache-from: type=gha
          cache-to: type=gha,mode=max
          build-args: |
            NEXT_PUBLIC_API_URL=${{ vars.API_URL }}

      # Scan images
      - name: Scan Images with Trivy
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: ${{ steps.ecr-login.outputs.registry }}/washwise/core-api:${{ github.sha }}
          format: "sarif"
          output: "trivy-results.sarif"
          severity: "CRITICAL,HIGH"

      - name: Upload Trivy Results
        uses: github/codeql-action/upload-sarif@v3
        with:
          sarif_file: "trivy-results.sarif"

  # ==========================================
  # DEPLOY
  # ==========================================
  deploy-dev:
    runs-on: ubuntu-latest
    needs: build
    if: github.ref == 'refs/heads/develop'
    environment: development

    steps:
      - uses: actions/checkout@v4

      - name: Configure AWS Credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ secrets.AWS_ROLE_ARN }}
          aws-region: ${{ env.AWS_REGION }}

      - name: Deploy to ECS (Dev)
        run: |
          aws ecs update-service \
            --cluster washwise-dev \
            --service core-api \
            --force-new-deployment
            
          aws ecs update-service \
            --cluster washwise-dev \
            --service ai-worker \
            --force-new-deployment
            
          aws ecs update-service \
            --cluster washwise-dev \
            --service web-admin \
            --force-new-deployment

      - name: Wait for deployment
        run: |
          aws ecs wait services-stable \
            --cluster washwise-dev \
            --services core-api ai-worker web-admin

  deploy-staging:
    runs-on: ubuntu-latest
    needs: build
    if: github.ref == 'refs/heads/main'
    environment: staging

    steps:
      - uses: actions/checkout@v4

      - name: Configure AWS Credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ secrets.AWS_ROLE_ARN }}
          aws-region: ${{ env.AWS_REGION }}

      - name: Deploy to ECS (Staging)
        run: |
          aws ecs update-service \
            --cluster washwise-staging \
            --service core-api \
            --force-new-deployment

  deploy-production:
    runs-on: ubuntu-latest
    needs: build
    if: startsWith(github.ref, 'refs/tags/v')
    environment: production

    steps:
      - uses: actions/checkout@v4

      - name: Configure AWS Credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ secrets.AWS_ROLE_ARN }}
          aws-region: ${{ env.AWS_REGION }}

      # Blue/Green deployment
      - name: Deploy to ECS (Production - Blue/Green)
        uses: aws-actions/amazon-ecs-deploy-task-definition@v1
        with:
          task-definition: infra/ecs/task-definitions/core-api-prod.json
          service: core-api
          cluster: washwise-prod
          wait-for-service-stability: true
          codedeploy-appspec: infra/codedeploy/appspec.yaml
          codedeploy-application: washwise-prod
          codedeploy-deployment-group: washwise-prod-dg
```

---

## 3. Terraform Infrastructure

### 3.1 Project Structure

```
infra/
├── terraform/
│   ├── modules/
│   │   ├── vpc/
│   │   │   ├── main.tf
│   │   │   ├── variables.tf
│   │   │   └── outputs.tf
│   │   ├── ecs/
│   │   │   ├── main.tf
│   │   │   ├── variables.tf
│   │   │   └── outputs.tf
│   │   ├── rds/
│   │   │   ├── main.tf
│   │   │   ├── variables.tf
│   │   │   └── outputs.tf
│   │   ├── elasticache/
│   │   │   ├── main.tf
│   │   │   ├── variables.tf
│   │   │   └── outputs.tf
│   │   └── monitoring/
│   │       ├── main.tf
│   │       ├── variables.tf
│   │       └── outputs.tf
│   │
│   └── environments/
│       ├── dev/
│       │   ├── main.tf
│       │   ├── variables.tf
│       │   └── terraform.tfvars
│       ├── staging/
│       │   ├── main.tf
│       │   ├── variables.tf
│       │   └── terraform.tfvars
│       └── prod/
│           ├── main.tf
│           ├── variables.tf
│           └── terraform.tfvars
```

### 3.2 VPC Module

```hcl
# infra/terraform/modules/vpc/main.tf

variable "environment" {
  type = string
}

variable "vpc_cidr" {
  type    = string
  default = "10.0.0.0/16"
}

variable "availability_zones" {
  type    = list(string)
  default = ["ap-southeast-1a", "ap-southeast-1b", "ap-southeast-1c"]
}

# VPC
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name        = "washwise-${var.environment}-vpc"
    Environment = var.environment
  }
}

# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name        = "washwise-${var.environment}-igw"
    Environment = var.environment
  }
}

# Public Subnets
resource "aws_subnet" "public" {
  count                   = length(var.availability_zones)
  vpc_id                  = aws_vpc.main.id
  cidr_block              = cidrsubnet(var.vpc_cidr, 4, count.index)
  availability_zone       = var.availability_zones[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name        = "washwise-${var.environment}-public-${count.index + 1}"
    Environment = var.environment
    Type        = "public"
  }
}

# Private Subnets
resource "aws_subnet" "private" {
  count             = length(var.availability_zones)
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 4, count.index + length(var.availability_zones))
  availability_zone = var.availability_zones[count.index]

  tags = {
    Name        = "washwise-${var.environment}-private-${count.index + 1}"
    Environment = var.environment
    Type        = "private"
  }
}

# NAT Gateway
resource "aws_eip" "nat" {
  count  = var.environment == "prod" ? length(var.availability_zones) : 1
  domain = "vpc"

  tags = {
    Name        = "washwise-${var.environment}-nat-eip-${count.index + 1}"
    Environment = var.environment
  }
}

resource "aws_nat_gateway" "main" {
  count         = var.environment == "prod" ? length(var.availability_zones) : 1
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = {
    Name        = "washwise-${var.environment}-nat-${count.index + 1}"
    Environment = var.environment
  }
}

# Route Tables
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = {
    Name        = "washwise-${var.environment}-public-rt"
    Environment = var.environment
  }
}

resource "aws_route_table" "private" {
  count  = var.environment == "prod" ? length(var.availability_zones) : 1
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main[count.index].id
  }

  tags = {
    Name        = "washwise-${var.environment}-private-rt-${count.index + 1}"
    Environment = var.environment
  }
}

# Security Groups
resource "aws_security_group" "alb" {
  name        = "washwise-${var.environment}-alb-sg"
  description = "Security group for ALB"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "washwise-${var.environment}-alb-sg"
    Environment = var.environment
  }
}

resource "aws_security_group" "ecs" {
  name        = "washwise-${var.environment}-ecs-sg"
  description = "Security group for ECS tasks"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = 0
    to_port         = 65535
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "washwise-${var.environment}-ecs-sg"
    Environment = var.environment
  }
}

resource "aws_security_group" "rds" {
  name        = "washwise-${var.environment}-rds-sg"
  description = "Security group for RDS"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.ecs.id]
  }

  tags = {
    Name        = "washwise-${var.environment}-rds-sg"
    Environment = var.environment
  }
}

output "vpc_id" {
  value = aws_vpc.main.id
}

output "public_subnet_ids" {
  value = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  value = aws_subnet.private[*].id
}

output "alb_security_group_id" {
  value = aws_security_group.alb.id
}

output "ecs_security_group_id" {
  value = aws_security_group.ecs.id
}

output "rds_security_group_id" {
  value = aws_security_group.rds.id
}
```

### 3.3 ECS Module

```hcl
# infra/terraform/modules/ecs/main.tf

variable "environment" {
  type = string
}

variable "vpc_id" {
  type = string
}

variable "private_subnet_ids" {
  type = list(string)
}

variable "ecs_security_group_id" {
  type = string
}

# ECS Cluster
resource "aws_ecs_cluster" "main" {
  name = "washwise-${var.environment}"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = {
    Environment = var.environment
  }
}

resource "aws_ecs_cluster_capacity_providers" "main" {
  cluster_name = aws_ecs_cluster.main.name

  capacity_providers = ["FARGATE", "FARGATE_SPOT"]

  default_capacity_provider_strategy {
    base              = 1
    weight            = 100
    capacity_provider = "FARGATE"
  }
}

# Core API Task Definition
resource "aws_ecs_task_definition" "core_api" {
  family                   = "washwise-${var.environment}-core-api"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = var.environment == "prod" ? 1024 : 512
  memory                   = var.environment == "prod" ? 2048 : 1024
  execution_role_arn       = aws_iam_role.ecs_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([
    {
      name  = "core-api"
      image = "${var.ecr_repository_url}/washwise/core-api:latest"

      portMappings = [
        {
          containerPort = 8080
          protocol      = "tcp"
        }
      ]

      environment = [
        {
          name  = "SPRING_PROFILES_ACTIVE"
          value = var.environment
        }
      ]

      secrets = [
        {
          name      = "DATABASE_URL"
          valueFrom = "${var.secrets_arn}:DATABASE_URL::"
        },
        {
          name      = "REDIS_URL"
          valueFrom = "${var.secrets_arn}:REDIS_URL::"
        },
        {
          name      = "JWT_SECRET"
          valueFrom = "${var.secrets_arn}:JWT_SECRET::"
        }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-group         = "/ecs/washwise-${var.environment}/core-api"
          awslogs-region        = var.aws_region
          awslogs-stream-prefix = "ecs"
        }
      }

      healthCheck = {
        command     = ["CMD-SHELL", "curl -f http://localhost:8080/actuator/health || exit 1"]
        interval    = 30
        timeout     = 5
        retries     = 3
        startPeriod = 60
      }
    }
  ])

  tags = {
    Environment = var.environment
    Service     = "core-api"
  }
}

# Core API Service
resource "aws_ecs_service" "core_api" {
  name            = "core-api"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.core_api.arn
  desired_count   = var.environment == "prod" ? 3 : 1
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = var.private_subnet_ids
    security_groups  = [var.ecs_security_group_id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.core_api.arn
    container_name   = "core-api"
    container_port   = 8080
  }

  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }

  deployment_controller {
    type = var.environment == "prod" ? "CODE_DEPLOY" : "ECS"
  }

  tags = {
    Environment = var.environment
    Service     = "core-api"
  }
}

# Auto Scaling
resource "aws_appautoscaling_target" "core_api" {
  max_capacity       = var.environment == "prod" ? 20 : 3
  min_capacity       = var.environment == "prod" ? 3 : 1
  resource_id        = "service/${aws_ecs_cluster.main.name}/${aws_ecs_service.core_api.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

resource "aws_appautoscaling_policy" "core_api_cpu" {
  name               = "core-api-cpu-scaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.core_api.resource_id
  scalable_dimension = aws_appautoscaling_target.core_api.scalable_dimension
  service_namespace  = aws_appautoscaling_target.core_api.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
    target_value       = 70.0
    scale_in_cooldown  = 300
    scale_out_cooldown = 60
  }
}

resource "aws_appautoscaling_policy" "core_api_memory" {
  name               = "core-api-memory-scaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.core_api.resource_id
  scalable_dimension = aws_appautoscaling_target.core_api.scalable_dimension
  service_namespace  = aws_appautoscaling_target.core_api.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageMemoryUtilization"
    }
    target_value       = 80.0
    scale_in_cooldown  = 300
    scale_out_cooldown = 60
  }
}
```

### 3.4 RDS Module

```hcl
# infra/terraform/modules/rds/main.tf

variable "environment" {
  type = string
}

variable "vpc_id" {
  type = string
}

variable "private_subnet_ids" {
  type = list(string)
}

variable "rds_security_group_id" {
  type = string
}

# DB Subnet Group
resource "aws_db_subnet_group" "main" {
  name       = "washwise-${var.environment}"
  subnet_ids = var.private_subnet_ids

  tags = {
    Name        = "washwise-${var.environment}-db-subnet"
    Environment = var.environment
  }
}

# RDS Instance
resource "aws_db_instance" "main" {
  identifier     = "washwise-${var.environment}"
  engine         = "postgres"
  engine_version = "16.1"

  instance_class = var.environment == "prod" ? "db.r6g.large" : "db.t4g.micro"

  allocated_storage     = var.environment == "prod" ? 100 : 20
  max_allocated_storage = var.environment == "prod" ? 500 : 50
  storage_type          = "gp3"
  storage_encrypted     = true

  db_name  = "washwise"
  username = "washwise_admin"
  password = random_password.db_password.result

  vpc_security_group_ids = [var.rds_security_group_id]
  db_subnet_group_name   = aws_db_subnet_group.main.name

  multi_az               = var.environment == "prod"
  publicly_accessible    = false
  deletion_protection    = var.environment == "prod"
  skip_final_snapshot    = var.environment != "prod"

  backup_retention_period = var.environment == "prod" ? 30 : 7
  backup_window           = "03:00-04:00"
  maintenance_window      = "Mon:04:00-Mon:05:00"

  performance_insights_enabled          = var.environment == "prod"
  performance_insights_retention_period = var.environment == "prod" ? 7 : 0

  enabled_cloudwatch_logs_exports = ["postgresql", "upgrade"]

  parameter_group_name = aws_db_parameter_group.main.name

  tags = {
    Name        = "washwise-${var.environment}"
    Environment = var.environment
  }
}

# Parameter Group (pgvector extension)
resource "aws_db_parameter_group" "main" {
  name   = "washwise-${var.environment}"
  family = "postgres16"

  parameter {
    name  = "shared_preload_libraries"
    value = "pg_stat_statements,pgvector"
  }

  tags = {
    Environment = var.environment
  }
}

# Random password
resource "random_password" "db_password" {
  length  = 32
  special = true
}

# Store in Secrets Manager
resource "aws_secretsmanager_secret" "db_password" {
  name = "washwise/${var.environment}/database"

  tags = {
    Environment = var.environment
  }
}

resource "aws_secretsmanager_secret_version" "db_password" {
  secret_id = aws_secretsmanager_secret.db_password.id
  secret_string = jsonencode({
    DATABASE_URL = "postgresql://${aws_db_instance.main.username}:${random_password.db_password.result}@${aws_db_instance.main.endpoint}/${aws_db_instance.main.db_name}"
    username     = aws_db_instance.main.username
    password     = random_password.db_password.result
    host         = aws_db_instance.main.address
    port         = aws_db_instance.main.port
    database     = aws_db_instance.main.db_name
  })
}

output "db_endpoint" {
  value = aws_db_instance.main.endpoint
}

output "db_secrets_arn" {
  value = aws_secretsmanager_secret.db_password.arn
}
```

### 3.5 Production Environment

```hcl
# infra/terraform/environments/prod/main.tf

terraform {
  required_version = ">= 1.9.0"

  backend "s3" {
    bucket         = "washwise-terraform-state"
    key            = "prod/terraform.tfstate"
    region         = "ap-southeast-1"
    dynamodb_table = "washwise-terraform-locks"
    encrypt        = true
  }

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = "ap-southeast-1"

  default_tags {
    tags = {
      Project     = "WashWise"
      Environment = "prod"
      ManagedBy   = "Terraform"
    }
  }
}

# VPC
module "vpc" {
  source = "../../modules/vpc"

  environment = "prod"
  vpc_cidr    = "10.0.0.0/16"
}

# RDS
module "rds" {
  source = "../../modules/rds"

  environment           = "prod"
  vpc_id                = module.vpc.vpc_id
  private_subnet_ids    = module.vpc.private_subnet_ids
  rds_security_group_id = module.vpc.rds_security_group_id
}

# ElastiCache
module "elasticache" {
  source = "../../modules/elasticache"

  environment             = "prod"
  vpc_id                  = module.vpc.vpc_id
  private_subnet_ids      = module.vpc.private_subnet_ids
  redis_security_group_id = module.vpc.redis_security_group_id
}

# ECS
module "ecs" {
  source = "../../modules/ecs"

  environment           = "prod"
  vpc_id                = module.vpc.vpc_id
  private_subnet_ids    = module.vpc.private_subnet_ids
  public_subnet_ids     = module.vpc.public_subnet_ids
  ecs_security_group_id = module.vpc.ecs_security_group_id
  alb_security_group_id = module.vpc.alb_security_group_id

  db_secrets_arn    = module.rds.db_secrets_arn
  redis_endpoint    = module.elasticache.redis_endpoint
  ecr_repository_url = var.ecr_repository_url
}

# Monitoring
module "monitoring" {
  source = "../../modules/monitoring"

  environment  = "prod"
  ecs_cluster  = module.ecs.cluster_name
  rds_instance = module.rds.db_instance_id

  alert_email = var.alert_email
}
```

---

## 4. Local Development

### 4.1 Docker Compose

```yaml
# docker-compose.yml
version: "3.9"

services:
  # PostgreSQL with pgvector
  postgres:
    image: pgvector/pgvector:pg16
    container_name: washwise-postgres
    environment:
      POSTGRES_USER: washwise
      POSTGRES_PASSWORD: washwise
      POSTGRES_DB: washwise
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./infra/docker/init-db.sql:/docker-entrypoint-initdb.d/init.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U washwise"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Redis
  redis:
    image: redis:7-alpine
    container_name: washwise-redis
    ports:
      - "6379:6379"
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  # MongoDB
  mongo:
    image: mongo:7
    container_name: washwise-mongo
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db
    healthcheck:
      test: ["CMD", "mongosh", "--eval", "db.adminCommand('ping')"]
      interval: 10s
      timeout: 5s
      retries: 5

  # Core API (Development)
  core-api:
    build:
      context: ./services/core-api
      dockerfile: Dockerfile.dev
    container_name: washwise-core-api
    ports:
      - "8080:8080"
    environment:
      - SPRING_PROFILES_ACTIVE=dev
      - DATABASE_URL=jdbc:postgresql://postgres:5432/washwise
      - REDIS_URL=redis://redis:6379
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    volumes:
      - ./services/core-api/src:/app/src
    develop:
      watch:
        - action: sync
          path: ./services/core-api/src
          target: /app/src

  # AI Worker (Development)
  ai-worker:
    build:
      context: ./services/ai-worker
      dockerfile: Dockerfile.dev
    container_name: washwise-ai-worker
    ports:
      - "8081:8081"
    environment:
      - ENVIRONMENT=dev
      - REDIS_URL=redis://redis:6379
      - MONGODB_URL=mongodb://mongo:27017/washwise
      - OPENAI_API_KEY=${OPENAI_API_KEY}
    depends_on:
      redis:
        condition: service_healthy
      mongo:
        condition: service_healthy
    volumes:
      - ./services/ai-worker/app:/app/app

  # Frontend (Development)
  web-admin:
    build:
      context: ./apps/web-admin
      dockerfile: Dockerfile.dev
    container_name: washwise-web-admin
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:8080
    depends_on:
      - core-api
    volumes:
      - ./apps/web-admin/src:/app/src
      - ./apps/web-admin/public:/app/public

volumes:
  postgres_data:
  redis_data:
  mongo_data:
```

### 4.2 Development Commands

```bash
# Start all services
docker compose up -d

# Start specific services
docker compose up -d postgres redis mongo

# View logs
docker compose logs -f core-api

# Run database migrations
docker compose exec core-api ./mvnw flyway:migrate

# Run tests in container
docker compose exec core-api ./mvnw test

# Rebuild specific service
docker compose build --no-cache core-api
docker compose up -d core-api

# Clean up
docker compose down -v
```

---

## 5. Deployment Checklist

### Pre-Deployment

- [ ] All tests passing in CI
- [ ] Security scan passed (no critical/high vulnerabilities)
- [ ] Code review approved
- [ ] Feature flags configured for new features
- [ ] Database migrations tested
- [ ] Rollback plan documented

### Deployment

- [ ] Notify team of deployment start
- [ ] Run database migrations
- [ ] Deploy to staging first
- [ ] Run smoke tests on staging
- [ ] Deploy to production (blue/green)
- [ ] Monitor error rates and latency
- [ ] Verify health checks passing

### Post-Deployment

- [ ] Confirm all services healthy
- [ ] Check application logs for errors
- [ ] Verify key user journeys working
- [ ] Update deployment documentation
- [ ] Notify team of completion
