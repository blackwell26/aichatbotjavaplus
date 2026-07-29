# DevOps Guide

This document describes the DevOps implementation for Phase 12 of the AI Customer Service Web Application frontend.

## Table of Contents

1. [Docker Configuration (T12.1)](#docker-configuration-t121)
2. [NGINX Configuration (T12.2)](#nginx-configuration-t122)
3. [Kubernetes Deployment (T12.3)](#kubernetes-deployment-t123)
4. [CI/CD Pipeline (T12.4)](#cicd-pipeline-t124)
5. [Monitoring & Observability (T12.5)](#monitoring--observability-t125)
6. [Deployment Procedures](#deployment-procedures)
7. [Troubleshooting](#troubleshooting)
8. [Best Practices](#best-practices)

---

## Docker Configuration (T12.1)

### Multi-Stage Dockerfile

Location: `Dockerfile`

The Dockerfile uses a multi-stage build process for optimal image size and security:

#### Stage 1: Builder
- Base image: `node:22-alpine`
- Installs build dependencies
- Runs production build with optimizations
- Prunes development dependencies

#### Stage 2: Runtime
- Base image: `nginx:1.27-alpine`
- Runs as non-root user (nginx:101)
- Includes healthcheck endpoint
- Minimal attack surface

### Key Features

1. **Security Hardening**
   - Non-root user execution
   - Read-only root filesystem
   - Dropped capabilities
   - Security labels and metadata

2. **Size Optimization**
   - Multi-stage build reduces final image size by ~70%
   - Only production dependencies included
   - Optimized layer caching

3. **Health Monitoring**
   - Built-in healthcheck on `/health` endpoint
   - 30-second interval checks
   - 3 retry attempts before marking unhealthy

### Building the Image

```bash
# Build for local development
docker build -t aichatbot/frontend:dev .

# Build for production
docker build -t aichatbot/frontend:latest .

# Build with specific tag
docker build -t aichatbot/frontend:v1.0.0 .

# Build for multiple platforms
docker buildx build --platform linux/amd64,linux/arm64 -t aichatbot/frontend:latest .
```

### Running Locally

```bash
# Run container
docker run -d \
  --name aichatbot-frontend \
  -p 8080:8080 \
  -e API_BASE_URL=http://localhost:8080/api/v1 \
  aichatbot/frontend:latest

# Check health
curl http://localhost:8080/health

# View logs
docker logs -f aichatbot-frontend

# Stop container
docker stop aichatbot-frontend
```

### Docker Compose

```yaml
version: '3.8'
services:
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "8080:8080"
    environment:
      - API_BASE_URL=http://backend:8080/api/v1
      - WS_BASE_URL=ws://backend:8080/ws
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
      interval: 30s
      timeout: 5s
      retries: 3
    restart: unless-stopped
```

### .dockerignore

Location: `.dockerignore`

Excludes unnecessary files from Docker context:
- `node_modules/` - Reinstalled during build
- `dist/` - Generated during build
- `.angular/` - Build cache
- Test files and documentation
- IDE and OS files

---

## NGINX Configuration (T12.2)

### Configuration File

Location: `nginx.conf`

### Key Features

1. **Performance Optimizations**
   - Gzip compression (6 compression level)
   - Brotli compression support (commented, enable if available)
   - Sendfile and TCP optimizations
   - Connection keep-alive
   - Client body buffering

2. **Security Headers**
   - X-Frame-Options: SAMEORIGIN
   - X-Content-Type-Options: nosniff
   - Content-Security-Policy (CSP)
   - Referrer-Policy
   - Permissions-Policy

3. **Caching Strategy**
   - Static assets: 1 year cache with immutable flag
   - index.html: No cache (always fresh)
   - Proper cache-control headers

4. **SPA Support**
   - Fallback to index.html for client-side routing
   - Proper MIME types
   - Health endpoint for monitoring

### Configuration Sections

```nginx
# Listen on port 8080 (non-privileged)
listen 8080;

# Gzip compression
gzip on;
gzip_comp_level 6;
gzip_types text/plain text/css application/javascript;

# Static assets caching
location ~* \.(js|css|woff2?|ttf|eot|svg|ico|png|jpg|jpeg|webp|gif)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}

# index.html - no cache
location = /index.html {
    expires -1;
    add_header Cache-Control "no-store, no-cache, must-revalidate";
}

# Health endpoint
location /health {
    return 200 'OK';
    add_header Content-Type text/plain;
}

# SPA fallback
location / {
    try_files $uri $uri/ /index.html;
}
```

### Testing NGINX Configuration

```bash
# Test configuration syntax
docker run --rm -v $(pwd)/nginx.conf:/etc/nginx/conf.d/default.conf nginx:1.27-alpine nginx -t

# Test with local file
nginx -t -c nginx.conf
```

---

## Kubernetes Deployment (T12.3)

### Deployment Manifests

Location: `deployment/k8s/`

#### 1. Deployment (`frontend-deployment.yaml`)

**Key Features:**
- 2 replicas (minimum)
- Rolling update strategy (zero downtime)
- Resource limits and requests
- Security context (non-root, read-only filesystem)
- Health probes (readiness, liveness, startup)
- Pod anti-affinity for high availability

**Resource Allocation:**
```yaml
resources:
  requests:
    cpu: 100m
    memory: 128Mi
  limits:
    cpu: 500m
    memory: 256Mi
```

**Health Probes:**
- Startup probe: 12 attempts × 5s = 60s max startup time
- Readiness probe: Every 10s, 3 failures to mark not ready
- Liveness probe: Every 15s, 3 failures to restart

#### 2. Service (`frontend-service.yaml`)

**Configuration:**
- Type: ClusterIP (internal only)
- Port: 80 → 8080 (container)
- Session affinity: ClientIP (3-hour timeout)

#### 3. Ingress (`frontend-ingress.yaml`)

**Features:**
- TLS termination with Let's Encrypt
- Rate limiting (100 RPS, 50 connections)
- Security headers injection
- CORS configuration
- SSL redirect enforcement

**Annotations:**
```yaml
nginx.ingress.kubernetes.io/ssl-redirect: "true"
nginx.ingress.kubernetes.io/limit-rps: "100"
cert-manager.io/cluster-issuer: "letsencrypt-prod"
```

#### 4. HorizontalPodAutoscaler (`frontend-hpa.yaml`)

**Scaling Configuration:**
- Min replicas: 2
- Max replicas: 10
- Target CPU: 70%
- Target Memory: 80%

**Scaling Behavior:**
- Scale up: Fast (100% or 4 pods per 30s)
- Scale down: Slow (50% or 2 pods per 60s, 5-minute stabilization)

#### 5. PodDisruptionBudget (`frontend-pdb.yaml`)

**Configuration:**
- Minimum available: 1 pod
- Ensures availability during voluntary disruptions

### Deploying to Kubernetes

```bash
# Create namespace
kubectl create namespace aichatbot

# Apply all manifests
kubectl apply -f deployment/k8s/

# Or apply individually
kubectl apply -f deployment/k8s/frontend-deployment.yaml
kubectl apply -f deployment/k8s/frontend-service.yaml
kubectl apply -f deployment/k8s/frontend-ingress.yaml
kubectl apply -f deployment/k8s/frontend-hpa.yaml
kubectl apply -f deployment/k8s/frontend-pdb.yaml

# Check deployment status
kubectl get deployments -n aichatbot
kubectl get pods -n aichatbot
kubectl get svc -n aichatbot
kubectl get ingress -n aichatbot

# Check HPA status
kubectl get hpa -n aichatbot

# View logs
kubectl logs -f deployment/aichatbot-frontend -n aichatbot

# Describe pod for troubleshooting
kubectl describe pod <pod-name> -n aichatbot
```

### OpenShift Deployment

For OpenShift, use Route instead of Ingress:

```yaml
apiVersion: route.openshift.io/v1
kind: Route
metadata:
  name: aichatbot-frontend
  namespace: aichatbot
spec:
  host: chatbot.apps.openshift.example.com
  to:
    kind: Service
    name: aichatbot-frontend
  port:
    targetPort: http
  tls:
    termination: edge
    insecureEdgeTerminationPolicy: Redirect
```

---

## CI/CD Pipeline (T12.4)

### GitHub Actions Workflow

Location: `.github/workflows/frontend-ci.yml`

### Pipeline Stages

#### 1. Code Quality
- **Lint**: ESLint checks
- **Format**: Prettier validation
- Runs on every push and PR

#### 2. Testing
- **Unit Tests**: Vitest with coverage (80%+ threshold)
- **Integration Tests**: Multi-service workflow tests
- **E2E Tests**: Playwright on Chromium and Firefox
- **Accessibility Tests**: WCAG 2.1 AA compliance
- **Security Tests**: XSS, CSRF, authentication validation

#### 3. Build
- Production build with optimizations
- Bundle size analysis
- Artifact upload for deployment

#### 4. Docker
- Multi-platform build (amd64, arm64)
- Push to GitHub Container Registry
- SBOM generation for security

#### 5. Deployment
- **Staging**: Auto-deploy on `develop` branch
- **Production**: Auto-deploy on `main` branch with approval
- Smoke tests after deployment

### Workflow Triggers

```yaml
on:
  push:
    branches: [main, develop]
    paths: ['frontend/**']
  pull_request:
    branches: [main, develop]
    paths: ['frontend/**']
  workflow_dispatch:
```

### Required Secrets

Configure in GitHub repository settings:

```bash
# Container Registry
GITHUB_TOKEN  # Automatically provided

# Kubernetes
KUBE_CONFIG_STAGING  # Base64-encoded kubeconfig for staging
KUBE_CONFIG_PROD     # Base64-encoded kubeconfig for production

# Notifications
SLACK_WEBHOOK        # Optional: Slack webhook URL
```

### Manual Deployment

```bash
# Trigger workflow manually
gh workflow run frontend-ci.yml

# Deploy specific branch
gh workflow run frontend-ci.yml --ref feature-branch

# View workflow runs
gh run list --workflow=frontend-ci.yml

# View logs
gh run view <run-id> --log
```

### Local CI Testing

```bash
# Install act (GitHub Actions local runner)
brew install act  # macOS
# or
curl https://raw.githubusercontent.com/nektos/act/master/install.sh | sudo bash

# Run workflow locally
act -j lint
act -j test
act -j build

# Run entire workflow
act push
```

---

## Monitoring & Observability (T12.5)

### Prometheus Monitoring

Location: `monitoring/`

#### 1. Prometheus Rules (`prometheus-rules.yaml`)

**Alert Rules:**
- High error rate (>5% for 5 minutes)
- High response time (p95 >1s for 5 minutes)
- Pod not ready (5 minutes)
- High memory usage (>90% for 5 minutes)
- High CPU usage (>90% for 5 minutes)
- Replica mismatch (10 minutes)
- High restart rate

#### 2. ServiceMonitor (`servicemonitor.yaml`)

**Configuration:**
- Scrape interval: 30 seconds
- Scrape timeout: 10 seconds
- Metrics endpoint: `/metrics`

#### 3. Grafana Dashboard (`grafana-dashboard.json`)

**Panels:**
1. Request Rate (by status code)
2. Response Time (95th percentile)
3. Error Rate
4. Pod Status
5. Memory Usage
6. CPU Usage
7. Network Traffic
8. Container Restarts

### Metrics Exposed

```
# NGINX metrics
nginx_http_requests_total
nginx_http_request_duration_seconds
nginx_http_connections_active

# Kubernetes metrics
kube_pod_status_ready
kube_deployment_status_replicas
container_memory_working_set_bytes
container_cpu_usage_seconds_total
container_network_receive_bytes_total
container_network_transmit_bytes_total
```

### Setting Up Monitoring

```bash
# Install Prometheus Operator
kubectl apply -f https://raw.githubusercontent.com/prometheus-operator/prometheus-operator/main/bundle.yaml

# Apply monitoring resources
kubectl apply -f monitoring/prometheus-rules.yaml
kubectl apply -f monitoring/servicemonitor.yaml

# Import Grafana dashboard
# 1. Open Grafana UI
# 2. Go to Dashboards → Import
# 3. Upload monitoring/grafana-dashboard.json
```

### Accessing Metrics

```bash
# Port-forward Prometheus
kubectl port-forward -n monitoring svc/prometheus-operated 9090:9090

# Port-forward Grafana
kubectl port-forward -n monitoring svc/grafana 3000:3000

# Access UIs
open http://localhost:9090  # Prometheus
open http://localhost:3000  # Grafana
```

### Log Aggregation

For centralized logging, use Fluent Bit or Fluentd:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: fluent-bit-config
  namespace: aichatbot
data:
  fluent-bit.conf: |
    [INPUT]
        Name              tail
        Path              /var/log/containers/aichatbot-frontend-*.log
        Parser            docker
        Tag               kube.*
        Refresh_Interval  5
    
    [OUTPUT]
        Name  es
        Match *
        Host  elasticsearch.logging.svc.cluster.local
        Port  9200
        Index frontend-logs
```

---

## Deployment Procedures

### Initial Deployment

```bash
# 1. Build and push Docker image
docker build -t ghcr.io/yourorg/aichatbot-frontend:v1.0.0 ./frontend
docker push ghcr.io/yourorg/aichatbot-frontend:v1.0.0

# 2. Create namespace
kubectl create namespace aichatbot

# 3. Create secrets
kubectl create secret generic aichatbot-secrets \
  --from-literal=api-key=your-api-key \
  -n aichatbot

# 4. Apply ConfigMap
kubectl apply -f deployment/k8s/configmap.yaml

# 5. Deploy application
kubectl apply -f deployment/k8s/

# 6. Verify deployment
kubectl rollout status deployment/aichatbot-frontend -n aichatbot

# 7. Test application
kubectl port-forward svc/aichatbot-frontend 8080:80 -n aichatbot
curl http://localhost:8080/health
```

### Rolling Update

```bash
# Update image
kubectl set image deployment/aichatbot-frontend \
  frontend=ghcr.io/yourorg/aichatbot-frontend:v1.1.0 \
  -n aichatbot

# Watch rollout
kubectl rollout status deployment/aichatbot-frontend -n aichatbot

# Check history
kubectl rollout history deployment/aichatbot-frontend -n aichatbot
```

### Rollback

```bash
# Rollback to previous version
kubectl rollout undo deployment/aichatbot-frontend -n aichatbot

# Rollback to specific revision
kubectl rollout undo deployment/aichatbot-frontend --to-revision=2 -n aichatbot

# Verify rollback
kubectl rollout status deployment/aichatbot-frontend -n aichatbot
```

### Blue-Green Deployment

```bash
# 1. Deploy new version with different label
kubectl apply -f deployment/k8s/frontend-deployment-green.yaml

# 2. Wait for green deployment to be ready
kubectl wait --for=condition=available deployment/aichatbot-frontend-green -n aichatbot

# 3. Update service selector to point to green
kubectl patch service aichatbot-frontend -n aichatbot \
  -p '{"spec":{"selector":{"version":"green"}}}'

# 4. Verify traffic is going to green
kubectl get endpoints aichatbot-frontend -n aichatbot

# 5. Delete blue deployment
kubectl delete deployment aichatbot-frontend-blue -n aichatbot
```

### Canary Deployment

```bash
# 1. Deploy canary with 10% traffic
kubectl apply -f deployment/k8s/frontend-deployment-canary.yaml

# 2. Monitor metrics
kubectl top pods -n aichatbot
kubectl logs -f deployment/aichatbot-frontend-canary -n aichatbot

# 3. Gradually increase traffic (update replica count)
kubectl scale deployment/aichatbot-frontend-canary --replicas=2 -n aichatbot

# 4. If successful, promote canary to stable
kubectl set image deployment/aichatbot-frontend \
  frontend=ghcr.io/yourorg/aichatbot-frontend:canary \
  -n aichatbot

# 5. Delete canary deployment
kubectl delete deployment/aichatbot-frontend-canary -n aichatbot
```

---

## Troubleshooting

### Common Issues

#### 1. Pods Not Starting

```bash
# Check pod status
kubectl get pods -n aichatbot

# Describe pod for events
kubectl describe pod <pod-name> -n aichatbot

# Check logs
kubectl logs <pod-name> -n aichatbot

# Common causes:
# - Image pull errors (check imagePullPolicy)
# - Resource limits too low
# - Health probe failures
# - ConfigMap/Secret not found
```

#### 2. High Memory Usage

```bash
# Check memory usage
kubectl top pods -n aichatbot

# Increase memory limits
kubectl set resources deployment/aichatbot-frontend \
  --limits=memory=512Mi \
  -n aichatbot

# Check for memory leaks
kubectl exec -it <pod-name> -n aichatbot -- sh
# Inside pod:
ps aux
top
```

#### 3. Slow Response Times

```bash
# Check HPA status
kubectl get hpa -n aichatbot

# Scale manually if needed
kubectl scale deployment/aichatbot-frontend --replicas=5 -n aichatbot

# Check NGINX logs
kubectl logs -f <pod-name> -n aichatbot

# Check metrics
kubectl port-forward svc/prometheus-operated 9090:9090 -n monitoring
# Query: histogram_quantile(0.95, rate(nginx_http_request_duration_seconds_bucket[5m]))
```

#### 4. Certificate Issues

```bash
# Check certificate status
kubectl get certificate -n aichatbot
kubectl describe certificate aichatbot-frontend-tls -n aichatbot

# Check cert-manager logs
kubectl logs -f deployment/cert-manager -n cert-manager

# Manually trigger certificate renewal
kubectl delete secret aichatbot-frontend-tls -n aichatbot
# cert-manager will recreate it
```

#### 5. Ingress Not Working

```bash
# Check ingress status
kubectl get ingress -n aichatbot
kubectl describe ingress aichatbot-frontend -n aichatbot

# Check ingress controller logs
kubectl logs -f deployment/nginx-ingress-controller -n ingress-nginx

# Test from inside cluster
kubectl run -it --rm debug --image=curlimages/curl --restart=Never -- \
  curl http://aichatbot-frontend.aichatbot.svc.cluster.local/health
```

### Debug Commands

```bash
# Get all resources
kubectl get all -n aichatbot

# Check events
kubectl get events -n aichatbot --sort-by='.lastTimestamp'

# Check resource usage
kubectl top nodes
kubectl top pods -n aichatbot

# Execute commands in pod
kubectl exec -it <pod-name> -n aichatbot -- sh

# Copy files from pod
kubectl cp <pod-name>:/var/log/nginx/error.log ./error.log -n aichatbot

# Port forward for debugging
kubectl port-forward <pod-name> 8080:8080 -n aichatbot

# Check DNS resolution
kubectl run -it --rm debug --image=busybox --restart=Never -- \
  nslookup aichatbot-frontend.aichatbot.svc.cluster.local
```

---

## Best Practices

### Docker

1. **Use Multi-Stage Builds**
   - Separate build and runtime stages
   - Minimize final image size

2. **Run as Non-Root**
   - Always specify USER directive
   - Use least privilege principle

3. **Use Specific Tags**
   - Avoid `latest` tag in production
   - Use semantic versioning

4. **Scan Images**
   ```bash
   docker scan aichatbot/frontend:latest
   trivy image aichatbot/frontend:latest
   ```

5. **Optimize Layers**
   - Order commands from least to most frequently changing
   - Combine RUN commands where appropriate
   - Use .dockerignore

### Kubernetes

1. **Resource Management**
   - Always set resource requests and limits
   - Use HPA for automatic scaling
   - Monitor resource usage

2. **Health Checks**
   - Implement all three probes (startup, readiness, liveness)
   - Use appropriate timeouts and thresholds
   - Test probes thoroughly

3. **Security**
   - Use Pod Security Standards
   - Enable RBAC
   - Use Network Policies
   - Scan images regularly
   - Keep secrets in Secret objects

4. **High Availability**
   - Run multiple replicas
   - Use Pod Disruption Budgets
   - Configure pod anti-affinity
   - Use rolling updates

5. **Monitoring**
   - Expose metrics
   - Set up alerts
   - Use distributed tracing
   - Centralize logs

### CI/CD

1. **Pipeline Design**
   - Fail fast (run quick tests first)
   - Parallelize where possible
   - Cache dependencies
   - Use matrix builds for multi-platform

2. **Testing**
   - Run tests on every commit
   - Maintain high coverage (80%+)
   - Include E2E tests for critical paths
   - Test accessibility and security

3. **Deployment**
   - Use staging environment
   - Automate smoke tests
   - Implement rollback strategy
   - Use blue-green or canary for production

4. **Security**
   - Scan dependencies
   - Scan Docker images
   - Use signed commits
   - Rotate secrets regularly

### Monitoring

1. **Metrics**
   - Track golden signals (latency, traffic, errors, saturation)
   - Set meaningful thresholds
   - Use percentiles (p50, p95, p99)

2. **Alerts**
   - Alert on symptoms, not causes
   - Avoid alert fatigue
   - Include runbooks in alerts
   - Test alert rules

3. **Logging**
   - Use structured logging
   - Include correlation IDs
   - Set appropriate log levels
   - Centralize logs

4. **Dashboards**
   - Create role-specific dashboards
   - Include SLO/SLI metrics
   - Use consistent time ranges
   - Document dashboard purpose

---

## Appendix

### Useful Commands Cheat Sheet

```bash
# Docker
docker build -t image:tag .
docker push image:tag
docker run -d -p 8080:8080 image:tag
docker logs -f container-name
docker exec -it container-name sh

# Kubernetes
kubectl get pods -n namespace
kubectl describe pod pod-name -n namespace
kubectl logs -f pod-name -n namespace
kubectl exec -it pod-name -n namespace -- sh
kubectl port-forward pod-name 8080:8080 -n namespace
kubectl apply -f manifest.yaml
kubectl delete -f manifest.yaml
kubectl rollout restart deployment/name -n namespace
kubectl rollout status deployment/name -n namespace
kubectl rollout undo deployment/name -n namespace
kubectl scale deployment/name --replicas=3 -n namespace
kubectl top pods -n namespace
kubectl get events -n namespace

# Helm (if using)
helm install release-name chart-name
helm upgrade release-name chart-name
helm rollback release-name revision
helm list
helm status release-name
```

### Environment Variables

```bash
# Frontend Configuration
API_BASE_URL=http://backend:8080/api/v1
WS_BASE_URL=ws://backend:8080/ws
NODE_ENV=production

# Kubernetes
KUBECONFIG=/path/to/kubeconfig
KUBECTL_NAMESPACE=aichatbot

# Docker
DOCKER_BUILDKIT=1
COMPOSE_DOCKER_CLI_BUILD=1
```

### Resource Sizing Guidelines

| Environment | Replicas | CPU Request | CPU Limit | Memory Request | Memory Limit |
|-------------|----------|-------------|-----------|----------------|--------------|
| Development | 1        | 50m         | 200m      | 64Mi           | 128Mi        |
| Staging     | 2        | 100m        | 500m      | 128Mi          | 256Mi        |
| Production  | 3-10     | 100m        | 500m      | 128Mi          | 256Mi        |

### Links and References

- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Docker Documentation](https://docs.docker.com/)
- [NGINX Documentation](https://nginx.org/en/docs/)
- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
