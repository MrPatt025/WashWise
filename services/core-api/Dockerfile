# WashWise Core API Service Dockerfile
# Multi-stage build for Java 21 + Spring Boot
# Optimized for faster rebuilds with dependency caching

# =============================================================================
# Stage 1: Dependency Cache Layer
# =============================================================================
FROM eclipse-temurin:21-jdk-alpine AS deps

WORKDIR /app

# Install Maven
RUN apk add --no-cache maven

# Copy only dependency-related files first (better caching)
COPY pom.xml .

# Download all dependencies - this layer is cached unless pom.xml changes
# Using dependency:resolve for more reliable caching than go-offline
RUN --mount=type=cache,target=/root/.m2/repository \
    mvn dependency:resolve dependency:resolve-plugins -B -q

# =============================================================================
# Stage 2: Build Application
# =============================================================================
FROM deps AS builder

WORKDIR /app

# Copy source code (changes frequently)
COPY src ./src

# Build the application using cached dependencies
RUN --mount=type=cache,target=/root/.m2/repository \
    mvn package -Dmaven.test.skip=true -B -q

# =============================================================================
# Stage 3: Runtime (Production-optimized)
# =============================================================================
FROM eclipse-temurin:21-jre-alpine AS runtime

# Security: Run as non-root user
RUN addgroup -S spring && adduser -S spring -G spring

# Install curl for health checks (smaller than wget in alpine)
RUN apk add --no-cache curl

WORKDIR /app

# Copy the built artifact
COPY --from=builder /app/target/*.jar app.jar

# Set ownership
RUN chown -R spring:spring /app

USER spring

# Health check using liveness endpoint (doesn't require DB/Redis to be healthy)
# This prevents container from being marked unhealthy during slow DB startup
HEALTHCHECK --interval=30s --timeout=10s --start-period=90s --retries=3 \
    CMD curl -sf http://localhost:8080/actuator/health/liveness || exit 1

# JVM configuration for containers
ENV JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -XX:+UseZGC -XX:+ExitOnOutOfMemoryError"

EXPOSE 8080

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
